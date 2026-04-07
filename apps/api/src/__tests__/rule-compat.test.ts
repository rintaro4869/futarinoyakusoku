import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PrismaClient } from '@fny/db'
import { createApp } from '../app.js'
import { signToken } from '../lib/jwt.js'
import { resetRuleCompatCacheForTests } from '../lib/rule-compat.js'

const JWT_SECRET = 'test-secret-min-32-chars-long-xxxx'
const TEST_USER_ID = 'user_test_1'
const TEST_PARTNER_ID = 'user_test_2'
const TEST_COUPLE_ID = 'couple_test_1'
const TEST_RULE_ID = 'rule_test_1'
const TEST_EVENT_ID = 'event_test_1'

const LEGACY_RULE_COLUMNS = [
  'id',
  'couple_id',
  'title',
  'objective',
  'mode',
  'point_value',
  'threshold',
  'thank_you_threshold',
  'nobishiro_threshold',
  'active',
  'created_at',
  'archived_at',
].map((name) => ({ name }))

const LEGACY_RULE_ROW = {
  id: TEST_RULE_ID,
  coupleId: TEST_COUPLE_ID,
  title: '皿洗い',
  objective: '毎日',
  mode: 'routine',
  pointValue: 10,
  threshold: 5,
  thankYouThreshold: 5,
  nobishiroThreshold: 3,
  active: 1,
  createdAt: '2026-03-24T00:00:00.000Z',
  archivedAt: null,
}

async function makeAuthedApp() {
  const prisma = new PrismaClient() as any
  delete prisma.$queryRawUnsafe
  delete prisma.$executeRawUnsafe

  const app = createApp(() => prisma, {
    JWT_SECRET,
    APP_URL: 'http://localhost:3000',
    WEB_URL: 'http://localhost:3000',
  })
  const token = await signToken(TEST_USER_ID, JWT_SECRET)
  return { app, prisma, token }
}

function installLegacyRuleReadMock(prisma: any) {
  prisma.$queryRawUnsafe = vi.fn(async (sql: string, ...params: unknown[]) => {
    if (sql.includes('PRAGMA table_info("rules")')) return LEGACY_RULE_COLUMNS
    if (sql.includes('FROM "rules"') && (params[0] === TEST_COUPLE_ID || params[0] === TEST_RULE_ID)) {
      return [LEGACY_RULE_ROW]
    }
    return []
  })
}

describe('rule compatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRuleCompatCacheForTests()
  })

  afterEach(() => {
    const prisma = new PrismaClient() as any
    delete prisma.$queryRawUnsafe
    delete prisma.$executeRawUnsafe
    resetRuleCompatCacheForTests()
  })

  it('returns fallback defaults from GET /couples/:id/rules on the legacy schema', async () => {
    const { app, prisma, token } = await makeAuthedApp()
    installLegacyRuleReadMock(prisma)
    prisma.membership.findFirst.mockResolvedValue({ coupleId: TEST_COUPLE_ID, userId: TEST_USER_ID, leftAt: null })

    const res = await app.request(`/api/v1/couples/${TEST_COUPLE_ID}/rules`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.items[0]).toEqual(
      expect.objectContaining({
        id: TEST_RULE_ID,
        start_date: null,
        recurrence_type: null,
        recurrence_interval: 1,
        days_of_week: null,
        day_of_month: null,
        time_of_day: null,
        category: null,
        creator_user_id: null,
        assignee: 'both',
        recorder: 'self',
        reminder_enabled: false,
        reminder_time: null,
      })
    )
  })

  it('records events without 500 when the rule table is still on the legacy schema', async () => {
    const { app, prisma, token } = await makeAuthedApp()
    installLegacyRuleReadMock(prisma)

    prisma.membership.findFirst.mockResolvedValue({ coupleId: TEST_COUPLE_ID, userId: TEST_USER_ID, leftAt: null })
    prisma.membership.findMany.mockResolvedValue([
      { coupleId: TEST_COUPLE_ID, userId: TEST_USER_ID, leftAt: null },
      { coupleId: TEST_COUPLE_ID, userId: TEST_PARTNER_ID, leftAt: null },
    ])
    prisma.couple.findUnique.mockResolvedValue({ id: TEST_COUPLE_ID, status: 'active' })
    prisma.ruleEvent.create.mockResolvedValue({
      id: TEST_EVENT_ID,
      ruleId: TEST_RULE_ID,
      coupleId: TEST_COUPLE_ID,
      reporterUserId: TEST_USER_ID,
      targetUserId: TEST_USER_ID,
      reportType: 'self',
      note: null,
      status: 'approved',
      createdAt: new Date('2026-03-24T00:00:00.000Z'),
    })
    prisma.pointLedger.create.mockResolvedValue({ id: 'ledger_1' })
    prisma.pointLedger.aggregate.mockResolvedValue({ _sum: { points: 10 } })
    prisma.ruleEvent.findUnique.mockResolvedValue({ ruleId: TEST_RULE_ID })
    prisma.analyticsEvent.create.mockResolvedValue({ id: 'analytics_1' })

    const res = await app.request(`/api/v1/rules/${TEST_RULE_ID}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({}),
    })

    expect(res.status).toBe(201)
    const body = await res.json() as any
    expect(body).toEqual(
      expect.objectContaining({
        id: TEST_EVENT_ID,
        rule_id: TEST_RULE_ID,
        status: 'approved',
        report_type: 'self',
      })
    )
  })

  it('returns 503 instead of 500 when a new schedule field needs a missing column', async () => {
    const { app, prisma, token } = await makeAuthedApp()
    installLegacyRuleReadMock(prisma)

    prisma.membership.findFirst.mockResolvedValue({ coupleId: TEST_COUPLE_ID, userId: TEST_USER_ID, leftAt: null })
    prisma.couple.findUnique.mockResolvedValue({ id: TEST_COUPLE_ID, status: 'active' })
    prisma.rule.count.mockResolvedValue(0)

    const res = await app.request(`/api/v1/couples/${TEST_COUPLE_ID}/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: '曜日指定の約束',
        mode: 'routine',
        point_value: 10,
        threshold: 5,
        recurrence_type: 'weekly',
        days_of_week: [1, 3],
      }),
    })

    expect(res.status).toBe(503)
    const body = await res.json() as any
    expect(body.code).toBe('SCHEMA_MISMATCH')
  })
})

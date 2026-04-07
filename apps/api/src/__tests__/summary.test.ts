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

describe('GET /api/v1/couples/:id/home', () => {
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

  it('returns 200 when the rules table is still on the legacy schema', async () => {
    const { app, prisma, token } = await makeAuthedApp()

    prisma.$queryRawUnsafe = vi.fn(async (sql: string, ...params: unknown[]) => {
      if (sql.includes('PRAGMA table_info("rules")')) return LEGACY_RULE_COLUMNS
      if (sql.includes('FROM "rules"') && params[0] === TEST_COUPLE_ID) {
        return [
          {
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
          },
        ]
      }
      return []
    })

    prisma.membership.findFirst
      .mockResolvedValueOnce({ coupleId: TEST_COUPLE_ID, userId: TEST_USER_ID, leftAt: null, displayName: 'わたし' })
      .mockResolvedValueOnce({ coupleId: TEST_COUPLE_ID, userId: TEST_USER_ID, leftAt: null, displayName: 'わたし' })
      .mockResolvedValueOnce({ coupleId: TEST_COUPLE_ID, userId: TEST_PARTNER_ID, leftAt: null, displayName: '相手' })
    prisma.pointLedger.aggregate.mockResolvedValue({ _sum: { points: 0 } })
    prisma.ruleEvent.count.mockResolvedValue(0)
    prisma.repairAction.count.mockResolvedValue(0)
    prisma.ruleEvent.findMany.mockResolvedValue([{ ruleId: TEST_RULE_ID }])

    const res = await app.request(`/api/v1/couples/${TEST_COUPLE_ID}/home`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.status).toBe(200)
    const body = await res.json() as any

    expect(body.rules).toHaveLength(1)
    expect(body.rules[0]).toEqual(
      expect.objectContaining({
        rule_id: TEST_RULE_ID,
        title: '皿洗い',
        category: null,
        start_date: null,
        recurrence_type: null,
        recurrence_interval: 1,
        days_of_week: null,
        day_of_month: null,
        time_of_day: null,
        count: 1,
      })
    )
  })
})

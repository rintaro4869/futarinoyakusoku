import { describe, expect, it } from 'vitest'
import { PrismaClient } from '@fny/db'
import { createApp } from '../app.js'
import { signToken } from '../lib/jwt.js'

const JWT_SECRET = 'test-secret-min-32-chars-long-xxxx'
const TEST_USER_ID = 'user_test_1'
const TEST_PARTNER_ID = 'user_test_2'
const TEST_COUPLE_ID = 'couple_test_1'
const TEST_RULE_ID = 'rule_test_1'

async function makeAuthedApp() {
  const prisma = new PrismaClient() as any
  const app = createApp(() => prisma, {
    JWT_SECRET,
    APP_URL: 'http://localhost:3000',
    WEB_URL: 'http://localhost:3000',
  })
  const token = await signToken(TEST_USER_ID, JWT_SECRET)
  return { app, prisma, token }
}

describe('POST /api/v1/rules/:rule_id/events', () => {
  it('records points for both members when the rule assignee is both', async () => {
    const { app, prisma, token } = await makeAuthedApp()

    prisma.rule.findUnique.mockResolvedValue({
      id: TEST_RULE_ID,
      coupleId: TEST_COUPLE_ID,
      title: '皿洗い',
      objective: '毎日',
      mode: 'routine',
      pointValue: 10,
      threshold: 5,
      thankYouThreshold: 5,
      nobishiroThreshold: 3,
      creatorUserId: TEST_USER_ID,
      assignee: 'both',
      recorder: 'self',
      active: true,
      reminderEnabled: false,
      reminderTime: null,
      archivedAt: null,
      createdAt: new Date(),
    })
    prisma.couple.findUnique.mockResolvedValue({ id: TEST_COUPLE_ID, status: 'active' })
    prisma.membership.findFirst.mockResolvedValue({ coupleId: TEST_COUPLE_ID, userId: TEST_USER_ID, leftAt: null })
    prisma.membership.findMany.mockResolvedValue([
      { coupleId: TEST_COUPLE_ID, userId: TEST_USER_ID, leftAt: null },
      { coupleId: TEST_COUPLE_ID, userId: TEST_PARTNER_ID, leftAt: null },
    ])
    prisma.ruleEvent.create.mockResolvedValue({
      id: 'event_1',
      ruleId: TEST_RULE_ID,
      status: 'approved',
      reportType: 'self',
      note: 'やったよ',
      createdAt: new Date(),
    })
    prisma.ruleEvent.findUnique.mockResolvedValue({ ruleId: TEST_RULE_ID })
    prisma.pointLedger.create.mockResolvedValue({ id: 'ledger_1' })
    prisma.pointLedger.aggregate.mockResolvedValue({ _sum: { points: 10 } })
    prisma.analyticsEvent.create.mockResolvedValue({ id: 'analytics_1' })

    const res = await app.request(`/api/v1/rules/${TEST_RULE_ID}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ note: 'やったよ' }),
    })

    expect(res.status).toBe(201)
    expect(prisma.pointLedger.create).toHaveBeenCalledTimes(2)
    const firstLedger = prisma.pointLedger.create.mock.calls[0]?.[0]?.data
    const secondLedger = prisma.pointLedger.create.mock.calls[1]?.[0]?.data

    expect(firstLedger.userId).toBe(TEST_USER_ID)
    expect(secondLedger.userId).toBe(TEST_PARTNER_ID)
    expect(firstLedger.pointKind).toBe('nobishiro')
    expect(secondLedger.pointKind).toBe('nobishiro')
    expect(firstLedger.sourceEventId).toBe(secondLedger.sourceEventId)
  })

  it('stores the selected occurrence date and uses that week for points', async () => {
    const { app, prisma, token } = await makeAuthedApp()

    prisma.rule.findUnique.mockResolvedValue({
      id: TEST_RULE_ID,
      coupleId: TEST_COUPLE_ID,
      title: '掃除',
      objective: '毎日',
      mode: 'routine',
      pointValue: 10,
      threshold: 5,
      thankYouThreshold: 5,
      nobishiroThreshold: 3,
      creatorUserId: TEST_USER_ID,
      assignee: 'self',
      recorder: 'self',
      active: true,
      reminderEnabled: false,
      reminderTime: null,
      archivedAt: null,
      createdAt: new Date(),
    })
    prisma.couple.findUnique.mockResolvedValue({ id: TEST_COUPLE_ID, status: 'active' })
    prisma.membership.findFirst.mockResolvedValue({ coupleId: TEST_COUPLE_ID, userId: TEST_USER_ID, leftAt: null })
    prisma.membership.findMany.mockResolvedValue([
      { coupleId: TEST_COUPLE_ID, userId: TEST_USER_ID, leftAt: null },
      { coupleId: TEST_COUPLE_ID, userId: TEST_PARTNER_ID, leftAt: null },
    ])
    prisma.ruleOccurrenceAction.create.mockResolvedValue({
      id: 'occ_1',
      ruleId: TEST_RULE_ID,
      occurrenceDate: new Date('2026-04-03T12:00:00.000Z'),
      actionType: 'recorded',
      note: 'event:test',
      createdAt: new Date(),
    })
    prisma.ruleEvent.create.mockResolvedValue({
      id: 'event_2',
      ruleId: TEST_RULE_ID,
      status: 'approved',
      reportType: 'self',
      note: null,
      createdAt: new Date(),
    })
    prisma.ruleEvent.findUnique.mockResolvedValue({ ruleId: TEST_RULE_ID })
    prisma.pointLedger.create.mockResolvedValue({ id: 'ledger_2' })
    prisma.pointLedger.aggregate.mockResolvedValue({ _sum: { points: 10 } })
    prisma.analyticsEvent.create.mockResolvedValue({ id: 'analytics_2' })

    const res = await app.request(`/api/v1/rules/${TEST_RULE_ID}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ occurred_on: '2026-04-03' }),
    })

    expect(res.status).toBe(201)
    const createdEventId = prisma.ruleEvent.create.mock.calls.at(-1)?.[0]?.data?.id
    const occurrencePayload = prisma.ruleOccurrenceAction.create.mock.calls.at(-1)?.[0]?.data
    const ledgerPayload = prisma.pointLedger.create.mock.calls.at(-1)?.[0]?.data
    const body = await res.json() as any

    expect(occurrencePayload.note).toBe(`event:${createdEventId}`)
    expect(occurrencePayload.occurrenceDate.toISOString()).toBe('2026-04-03T12:00:00.000Z')
    expect(ledgerPayload.weekKey).toBe('2026-W14')
    expect(body.occurred_on).toBe('2026-04-03')
  })

  it('returns occurred_on when listing events with saved occurrence actions', async () => {
    const { app, prisma, token } = await makeAuthedApp()

    prisma.membership.findFirst.mockResolvedValue({ coupleId: TEST_COUPLE_ID, userId: TEST_USER_ID, leftAt: null })
    prisma.ruleEvent.findMany.mockResolvedValue([
      {
        id: 'event_list_1',
        ruleId: TEST_RULE_ID,
        coupleId: TEST_COUPLE_ID,
        reporterUserId: TEST_USER_ID,
        targetUserId: TEST_USER_ID,
        status: 'approved',
        reportType: 'self',
        note: null,
        createdAt: new Date('2026-04-04T02:30:00.000Z'),
      },
    ])
    prisma.ruleOccurrenceAction.findMany.mockResolvedValue([
      {
        id: 'occ_list_1',
        ruleId: TEST_RULE_ID,
        occurrenceDate: new Date('2026-04-03T12:00:00.000Z'),
        actionType: 'recorded',
        note: 'event:event_list_1',
        createdAt: new Date(),
      },
    ])

    const res = await app.request(`/api/v1/couples/${TEST_COUPLE_ID}/events`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.items[0]?.occurred_on).toBe('2026-04-03')
  })
})

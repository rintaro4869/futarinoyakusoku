import { describe, it, expect } from 'vitest'
import { PrismaClient } from '@fny/db'
import { createApp } from '../app.js'
import { signToken } from '../lib/jwt.js'

const JWT_SECRET = 'test-secret-min-32-chars-long-xxxx'
const TEST_USER_ID = 'user_test_1'
const TEST_COUPLE_ID = 'couple_test_1'

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

describe('Error codes', () => {
  it('RULE_LIMIT_REACHED maps to 422', async () => {
    const { ERROR_CODES } = await import('../lib/error-codes.js')
    expect(ERROR_CODES.RULE_LIMIT_REACHED.http).toBe(422)
  })

  it('INVITE_EXPIRED maps to 410', async () => {
    const { ERROR_CODES } = await import('../lib/error-codes.js')
    expect(ERROR_CODES.INVITE_EXPIRED.http).toBe(410)
  })

  it('COUPLE_LOCKED maps to 423', async () => {
    const { ERROR_CODES } = await import('../lib/error-codes.js')
    expect(ERROR_CODES.COUPLE_LOCKED.http).toBe(423)
  })

  it('DUPLICATE_ACTION maps to 409', async () => {
    const { ERROR_CODES } = await import('../lib/error-codes.js')
    expect(ERROR_CODES.DUPLICATE_ACTION.http).toBe(409)
  })

  it('all error messages match spec', async () => {
    const { ERROR_CODES } = await import('../lib/error-codes.js')
    expect(ERROR_CODES.AUTH_REQUIRED.message).toBe('認証が必要です')
    expect(ERROR_CODES.RULE_LIMIT_REACHED.message).toBe('約束の登録は最大5件までです')
    expect(ERROR_CODES.COUPLE_LOCKED.message).toBe('現在このペアは加点停止中です')
  })
})

describe('POST /api/v1/couples/:couple_id/rules', () => {
  it('accepts point values above 500', async () => {
    const { app, prisma, token } = await makeAuthedApp()

    prisma.membership.findFirst.mockResolvedValue({
      coupleId: TEST_COUPLE_ID,
      userId: TEST_USER_ID,
      leftAt: null,
    })
    prisma.couple.findUnique.mockResolvedValue({ id: TEST_COUPLE_ID, status: 'active' })
    prisma.rule.create.mockResolvedValue({
      id: 'rule_high_point',
      coupleId: TEST_COUPLE_ID,
      title: '大きいごほうび用',
      objective: '毎日',
      startDate: new Date('2026-04-04T00:00:00.000Z'),
      recurrenceType: 'daily',
      recurrenceInterval: 1,
      daysOfWeek: null,
      dayOfMonth: null,
      timeOfDay: null,
      mode: 'routine',
      category: null,
      pointValue: 600,
      threshold: 5,
      thankYouThreshold: 5,
      nobishiroThreshold: 3,
      creatorUserId: TEST_USER_ID,
      assignee: 'both',
      recorder: 'self',
      active: true,
      reminderEnabled: false,
      reminderTime: null,
      createdAt: new Date(),
      archivedAt: null,
    })
    prisma.analyticsEvent.create.mockResolvedValue({ id: 'analytics_1' })

    const res = await app.request(`/api/v1/couples/${TEST_COUPLE_ID}/rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: '大きいごほうび用',
        mode: 'routine',
        objective: '毎日',
        point_value: 600,
        threshold: 5,
        thank_you_threshold: 5,
        nobishiro_threshold: 3,
        assignee: 'both',
        recorder: 'self',
        reminder_enabled: false,
      }),
    })

    expect(res.status).toBe(201)
    expect(prisma.rule.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          pointValue: 600,
        }),
      })
    )
  })
})

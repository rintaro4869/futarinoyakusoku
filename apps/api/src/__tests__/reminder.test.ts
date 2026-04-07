import { describe, it, expect, beforeEach } from 'vitest'
import { PrismaClient } from '@fny/db'
import { createApp } from '../app.js'
import { signToken } from '../lib/jwt.js'

const JWT_SECRET = 'test-secret-min-32-chars-long-xxxx'
const TEST_USER_ID = 'user_test_1'
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

const baseRule = {
  id: TEST_RULE_ID,
  coupleId: TEST_COUPLE_ID,
  title: 'テスト約束',
  objective: '毎日',
  mode: 'routine',
  pointValue: 10,
  threshold: 5,
  thankYouThreshold: 5,
  nobishiroThreshold: 3,
  active: true,
  reminderEnabled: false,
  reminderTime: null,
  archivedAt: null,
  createdAt: new Date(),
}

// ─── POST /couples/:id/rules — reminder フィールド ──────────────

describe('POST /couples/:id/rules — reminder', () => {
  it('reminder_enabled=true と reminder_time を受け付けて保存する', async () => {
    const { app, prisma, token } = await makeAuthedApp()

    prisma.membership.findFirst.mockResolvedValue({ coupleId: TEST_COUPLE_ID, userId: TEST_USER_ID })
    prisma.couple.findUnique.mockResolvedValue({ id: TEST_COUPLE_ID, status: 'active' })
    prisma.rule.count.mockResolvedValue(0)
    prisma.rule.create.mockResolvedValue({
      ...baseRule,
      reminderEnabled: true,
      reminderTime: '08:30',
    })
    prisma.analyticsEvent.create.mockResolvedValue({ id: 'ev1' })

    const res = await app.request(`/api/v1/couples/${TEST_COUPLE_ID}/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: 'テスト約束',
        mode: 'routine',
        point_value: 10,
        threshold: 5,
        reminder_enabled: true,
        reminder_time: '08:30',
      }),
    })

    expect(res.status).toBe(201)
    const body = await res.json() as any
    expect(body.reminder_enabled).toBe(true)
    expect(body.reminder_time).toBe('08:30')

    // create が reminderEnabled/reminderTime で呼ばれていること
    expect(prisma.rule.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reminderEnabled: true,
          reminderTime: '08:30',
        }),
      })
    )
  })

  it('reminder_time のフォーマットが不正（HH:MM 以外）なら 400 を返す', async () => {
    const { app, prisma, token } = await makeAuthedApp()

    prisma.membership.findFirst.mockResolvedValue({ coupleId: TEST_COUPLE_ID, userId: TEST_USER_ID })
    prisma.couple.findUnique.mockResolvedValue({ id: TEST_COUPLE_ID, status: 'active' })
    prisma.rule.count.mockResolvedValue(0)

    const res = await app.request(`/api/v1/couples/${TEST_COUPLE_ID}/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: 'テスト約束',
        mode: 'routine',
        point_value: 10,
        threshold: 5,
        reminder_enabled: true,
        reminder_time: '8:30',  // 不正フォーマット（HH必須）
      }),
    })

    expect(res.status).toBe(400)
  })
})

// ─── PATCH /rules/:id — reminder フィールド ───────────────────

describe('PATCH /rules/:id — reminder', () => {
  it('reminder_enabled を更新できる', async () => {
    const { app, prisma, token } = await makeAuthedApp()

    prisma.rule.findUnique.mockResolvedValue(baseRule)
    prisma.membership.findFirst.mockResolvedValue({ coupleId: TEST_COUPLE_ID, userId: TEST_USER_ID })
    prisma.rule.update.mockResolvedValue({ ...baseRule, reminderEnabled: true, reminderTime: '20:00' })
    prisma.analyticsEvent.create.mockResolvedValue({ id: 'ev1' })

    const res = await app.request(`/api/v1/rules/${TEST_RULE_ID}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reminder_enabled: true, reminder_time: '20:00' }),
    })

    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.reminder_enabled).toBe(true)
    expect(body.reminder_time).toBe('20:00')

    expect(prisma.rule.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ reminderEnabled: true, reminderTime: '20:00' }),
      })
    )
  })

  it('reminder_enabled=false で無効化できる', async () => {
    const { app, prisma, token } = await makeAuthedApp()

    prisma.rule.findUnique.mockResolvedValue({ ...baseRule, reminderEnabled: true, reminderTime: '08:00' })
    prisma.membership.findFirst.mockResolvedValue({ coupleId: TEST_COUPLE_ID, userId: TEST_USER_ID })
    prisma.rule.update.mockResolvedValue({ ...baseRule, reminderEnabled: false, reminderTime: null })
    prisma.analyticsEvent.create.mockResolvedValue({ id: 'ev1' })

    const res = await app.request(`/api/v1/rules/${TEST_RULE_ID}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reminder_enabled: false, reminder_time: null }),
    })

    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.reminder_enabled).toBe(false)
  })
})

// ─── GET /couples/:id/rules — reminder フィールドが含まれる ───────

describe('GET /couples/:id/rules — reminder', () => {
  it('レスポンスに reminder_enabled と reminder_time が含まれる', async () => {
    const { app, prisma, token } = await makeAuthedApp()

    prisma.membership.findFirst.mockResolvedValue({ coupleId: TEST_COUPLE_ID, userId: TEST_USER_ID })
    prisma.rule.findMany.mockResolvedValue([
      { ...baseRule, reminderEnabled: true, reminderTime: '07:00' },
    ])

    const res = await app.request(`/api/v1/couples/${TEST_COUPLE_ID}/rules`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.items[0].reminder_enabled).toBe(true)
    expect(body.items[0].reminder_time).toBe('07:00')
  })
})

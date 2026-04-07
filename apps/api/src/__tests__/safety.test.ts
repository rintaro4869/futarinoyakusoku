import { describe, it, expect, vi, beforeEach } from 'vitest'
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

// ─── VALID_EVENTS ──────────────────────────────────────────────

describe('analytics VALID_EVENTS', () => {
  it('contains help_link_clicked', async () => {
    // trackEvent のホワイトリストに入っていることを実際の import で検証
    const { trackEvent } = await import('../services/analytics.js')
    const prisma = new PrismaClient() as any
    prisma.analyticsEvent.create.mockResolvedValue({ id: 1n })

    // VALID_EVENTS に含まれていれば create が呼ばれる（含まれなければ warn のみで create は呼ばれない）
    await trackEvent(prisma, { eventName: 'help_link_clicked', userId: 'u1' })
    expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ eventName: 'help_link_clicked' }) })
    )
  })

  it('data_deletion_requested is still valid (used by privacy route)', async () => {
    const { trackEvent } = await import('../services/analytics.js')
    const prisma = new PrismaClient() as any
    prisma.analyticsEvent.create.mockResolvedValue({ id: 1n })

    await trackEvent(prisma, { eventName: 'data_deletion_requested', userId: 'u1' })
    expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ eventName: 'data_deletion_requested' }) })
    )
  })
})

// ─── POST /support/help-link-clicked ──────────────────────────

describe('POST /api/v1/support/help-link-clicked', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 204', async () => {
    const { app, prisma, token } = await makeAuthedApp()
    prisma.analyticsEvent.create.mockResolvedValue({ id: 1n })

    const res = await app.request('/api/v1/support/help-link-clicked', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    })

    expect(res.status).toBe(204)
  })

  it('tracks help_link_clicked (not data_deletion_requested)', async () => {
    const { app, prisma, token } = await makeAuthedApp()
    prisma.analyticsEvent.create.mockResolvedValue({ id: 1n })

    await app.request('/api/v1/support/help-link-clicked', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    })

    expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ eventName: 'help_link_clicked' }),
      })
    )

    const calls = prisma.analyticsEvent.create.mock.calls as any[]
    const eventNames = calls.map((c) => c[0].data.eventName)
    expect(eventNames).not.toContain('data_deletion_requested')
  })

  it('records safetyAction when couple_id is provided', async () => {
    const { app, prisma, token } = await makeAuthedApp()
    prisma.analyticsEvent.create.mockResolvedValue({ id: 1n })
    prisma.safetyAction.create.mockResolvedValue({})

    await app.request('/api/v1/support/help-link-clicked', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ couple_id: TEST_COUPLE_ID }),
    })

    expect(prisma.safetyAction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          coupleId: TEST_COUPLE_ID,
          actionType: 'help_click',
        }),
      })
    )
  })

  it('returns 401 without token', async () => {
    const { app } = await makeAuthedApp()
    const res = await app.request('/api/v1/support/help-link-clicked', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(401)
  })
})

// ─── POST /couples/:id/safety/pause ───────────────────────────

describe('POST /api/v1/couples/:id/safety/pause', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns paused status and tracks safety_pause_enabled', async () => {
    const { app, prisma, token } = await makeAuthedApp()
    prisma.couple.findUnique.mockResolvedValue({ id: TEST_COUPLE_ID, status: 'active' })
    prisma.membership.findFirst.mockResolvedValue({ coupleId: TEST_COUPLE_ID, userId: TEST_USER_ID })
    prisma.$transaction.mockResolvedValue([])
    prisma.analyticsEvent.create.mockResolvedValue({ id: 1n })

    const res = await app.request(`/api/v1/couples/${TEST_COUPLE_ID}/safety/pause`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'paused' })
    expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ eventName: 'safety_pause_enabled' }),
      })
    )
  })
})

// ─── POST /couples/:id/safety/unpause ─────────────────────────

describe('POST /api/v1/couples/:id/safety/unpause', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns active status and tracks safety_pause_disabled', async () => {
    const { app, prisma, token } = await makeAuthedApp()
    prisma.couple.findUnique.mockResolvedValue({ id: TEST_COUPLE_ID, status: 'paused' })
    prisma.membership.findFirst.mockResolvedValue({ coupleId: TEST_COUPLE_ID, userId: TEST_USER_ID })
    prisma.$transaction.mockResolvedValue([])
    prisma.analyticsEvent.create.mockResolvedValue({ id: 1n })

    const res = await app.request(`/api/v1/couples/${TEST_COUPLE_ID}/safety/unpause`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'active' })
    expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ eventName: 'safety_pause_disabled' }),
      })
    )
  })
})

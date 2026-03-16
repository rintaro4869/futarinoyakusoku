import { describe, it, expect } from 'vitest'
import { createApp } from '../app.js'
import { PrismaClient } from '@fny/db'

// Mock prisma factory that returns the mocked PrismaClient from setup.ts
function makeApp() {
  const prisma = new PrismaClient()
  return createApp(() => prisma, {
    DATABASE_URL: 'mock',
    JWT_SECRET: 'test-secret-min-32-chars-long-xxxx',
    APP_URL: 'http://localhost:3000',
    WEB_URL: 'http://localhost:3000',
  })
}

describe('GET /api/v1/health', () => {
  it('returns ok: true', async () => {
    const app = makeApp()
    const res = await app.request('/api/v1/health')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })
})

describe('POST /api/v1/auth/anonymous', () => {
  it('creates anonymous user and returns device_token', async () => {
    const prisma = new PrismaClient() as unknown as {
      user: { create: ReturnType<typeof import('vitest').vi.fn> }
      analyticsEvent: { create: ReturnType<typeof import('vitest').vi.fn> }
    }
    prisma.user.create.mockResolvedValue({ id: 'user_1', locale: 'ja-JP', timezone: 'Asia/Tokyo', createdAt: new Date(), deletedAt: null })
    prisma.analyticsEvent.create.mockResolvedValue({ id: 1n })

    const app = createApp(() => prisma as unknown as PrismaClient, {
      JWT_SECRET: 'test-secret-min-32-chars-long-xxxx',
      APP_URL: 'http://localhost:3000',
    })

    const res = await app.request('/api/v1/auth/anonymous', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: 'ja-JP', timezone: 'Asia/Tokyo' }),
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('user_id')
    expect(body).toHaveProperty('device_token')
  })
})

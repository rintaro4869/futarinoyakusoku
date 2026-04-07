import { describe, expect, it } from 'vitest'
import { PrismaClient } from '@fny/db'
import { createApp } from '../app.js'
import { verifyPassword } from '../lib/password.js'

function makeApp(overrides?: Partial<{ JWT_SECRET: string; APP_URL: string; WEB_URL: string }>) {
  const prisma = new PrismaClient()
  return createApp(() => prisma, {
    JWT_SECRET: overrides?.JWT_SECRET ?? 'test-secret-min-32-chars-long-xxxx',
    APP_URL: overrides?.APP_URL ?? 'http://localhost:3000',
    WEB_URL: overrides?.WEB_URL ?? 'http://localhost:3000',
  })
}

describe('security middleware', () => {
  it('rejects disallowed origins', async () => {
    const app = makeApp({
      APP_URL: 'https://pairlog.app',
      WEB_URL: 'https://pairlog.app',
    })

    const res = await app.request('/api/v1/health', {
      method: 'GET',
      headers: { Origin: 'https://evil.example' },
    })

    expect(res.status).toBe(403)
  })

  it('returns strict CORS headers for allowed origins', async () => {
    const app = makeApp({
      APP_URL: 'https://pairlog.app',
      WEB_URL: 'https://pairlog.app',
    })

    const res = await app.request('/api/v1/health', {
      method: 'OPTIONS',
      headers: { Origin: 'https://pairlog.app' },
    })

    expect(res.status).toBe(204)
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://pairlog.app')
    expect(res.headers.get('Access-Control-Allow-Credentials')).toBe('true')
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  it('fails closed when production-like URLs are used with a weak JWT secret', async () => {
    const app = makeApp({
      JWT_SECRET: 'too-short',
      APP_URL: 'https://pairlog.app',
      WEB_URL: 'https://pairlog.app',
    })

    const res = await app.request('/api/v1/health')
    expect(res.status).toBe(500)
  })

  it('rate limits repeated login attempts from the same client', async () => {
    const app = makeApp()
    let blockedStatus = 0

    for (let i = 0; i < 11; i++) {
      const res = await app.request('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Real-IP': '203.0.113.20',
        },
        body: JSON.stringify({ email: 'user@example.com', password: 'wrong-password' }),
      })

      blockedStatus = res.status
      if (res.status === 429) {
        expect(res.headers.get('Retry-After')).toBeTruthy()
        break
      }
    }

    expect(blockedStatus).toBe(429)
  })
})

describe('password verification hardening', () => {
  it('returns false for malformed stored hashes instead of throwing', async () => {
    await expect(verifyPassword('password123', 'invalid')).resolves.toBe(false)
  })
})

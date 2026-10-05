import { describe, expect, it } from 'vitest'
import { PrismaClient } from '@fny/db'
import { createApp } from '../app.js'
import { signToken } from '../lib/jwt.js'

const TEST_SECRET = 'test-secret-min-32-chars-long-xxxx'

describe('SIGNUPS_CLOSED', () => {
  it('blocks new accounts while keeping existing authenticated access', async () => {
    const prisma = new PrismaClient() as any
    prisma.user.create.mockClear()
    const app = createApp(() => prisma as PrismaClient, {
      JWT_SECRET: TEST_SECRET,
      APP_URL: 'http://localhost:3000',
      WEB_URL: 'http://localhost:3000',
      SIGNUPS_CLOSED: 'true',
    })

    for (const path of ['/api/v1/auth/anonymous', '/api/v1/auth/register']) {
      const res = await app.request(path, { method: 'POST', body: '{}' })
      expect(res.status).toBe(410)
      expect((await res.json() as { code: string }).code).toBe('SIGNUPS_CLOSED')
    }
    expect(prisma.user.create).not.toHaveBeenCalled()

    const token = await signToken('existing_user', TEST_SECRET)
    const refresh = await app.request('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(refresh.status).toBe(200)
  })
})

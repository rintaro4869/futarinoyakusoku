import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app.js'
import { PrismaClient } from '@fny/db'
import { signToken } from '../lib/jwt.js'
import * as jwt from '../lib/jwt.js'

const TEST_SECRET = 'test-secret-min-32-chars-long-xxxx'

function makeApp(
  prisma: PrismaClient = new PrismaClient(),
  overrides?: Partial<{
    JWT_SECRET: string
    APP_URL: string
    WEB_URL: string
    RESEND_API_KEY: string
    RESET_EMAIL_FROM: string
    RESET_EMAIL_REPLY_TO: string
  }>
) {
  return createApp(() => prisma, {
    JWT_SECRET: overrides?.JWT_SECRET ?? TEST_SECRET,
    APP_URL: overrides?.APP_URL ?? 'http://localhost:3000',
    WEB_URL: overrides?.WEB_URL ?? 'http://localhost:3000',
    RESEND_API_KEY: overrides?.RESEND_API_KEY,
    RESET_EMAIL_FROM: overrides?.RESET_EMAIL_FROM,
    RESET_EMAIL_REPLY_TO: overrides?.RESET_EMAIL_REPLY_TO,
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

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
    const prisma = new PrismaClient() as any
    prisma.user.create.mockResolvedValue({
      id: 'user_1',
      locale: 'ja-JP',
      timezone: 'Asia/Tokyo',
      createdAt: new Date(),
      deletedAt: null,
    })
    prisma.analyticsEvent.create.mockResolvedValue({ id: 1n })

    const app = makeApp(prisma)
    const res = await app.request('/api/v1/auth/anonymous', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: 'ja-JP', timezone: 'Asia/Tokyo' }),
    })

    expect(res.status).toBe(200)
    const body = await res.json() as { user_id: string; device_token: string }
    expect(body).toHaveProperty('user_id')
    expect(body).toHaveProperty('device_token')
  })
})

describe('POST /api/v1/auth/request-reset', () => {
  it('returns ok even when the email does not exist', async () => {
    const prisma = new PrismaClient() as any
    prisma.user.findUnique.mockResolvedValue(null)
    prisma.$executeRawUnsafe.mockResolvedValue(undefined)

    const app = makeApp(prisma)
    const res = await app.request('/api/v1/auth/request-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ghost@example.com' }),
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })

  it('fails closed in production when mail delivery is not configured', async () => {
    const prisma = new PrismaClient() as any
    prisma.$executeRawUnsafe.mockResolvedValue(undefined)

    const app = makeApp(prisma, {
      APP_URL: 'https://pairlog.app',
      WEB_URL: 'https://pairlog.app',
    })
    const res = await app.request('/api/v1/auth/request-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com' }),
    })

    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({
      code: 'RESET_EMAIL_UNAVAILABLE',
      message: '現在パスワード再設定メールを送信できません。少し待ってから再度お試しください',
    })
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  it('sends a reset email when delivery is configured', async () => {
    const prisma = new PrismaClient() as any
    prisma.$executeRawUnsafe.mockResolvedValue(undefined)
    prisma.user.findUnique.mockResolvedValue({
      id: 'user_1',
      email: 'user@example.com',
      locale: 'ja-JP',
      deletedAt: null,
    })
    prisma.passwordResetToken.create.mockResolvedValue({ id: 'token_1' })
    prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 })
    prisma.analyticsEvent.create.mockResolvedValue({ id: 1n })

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'mail_1' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const app = makeApp(prisma, {
      APP_URL: 'https://pairlog.app',
      WEB_URL: 'https://pairlog.app',
      RESEND_API_KEY: 're_test_123',
      RESET_EMAIL_FROM: 'Pairlog <no-reply@example.com>',
    })
    const res = await app.request('/api/v1/auth/request-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com' }),
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.resend.com/emails')

    const payload = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))
    expect(payload.from).toBe('Pairlog <no-reply@example.com>')
    expect(payload.to).toEqual(['user@example.com'])
    expect(payload.subject).toBe('Pairlog パスワード再設定コード')
    expect(payload.text).toContain('6桁コード')
  })

  it('returns RESET_EMAIL_UNAVAILABLE when Resend API returns an error', async () => {
    const prisma = new PrismaClient() as any
    prisma.$executeRawUnsafe.mockResolvedValue(undefined)
    prisma.user.findUnique.mockResolvedValue({
      id: 'user_1',
      email: 'user@example.com',
      locale: 'ja-JP',
      deletedAt: null,
    })
    prisma.passwordResetToken.create.mockResolvedValue({ id: 'token_1' })
    prisma.passwordResetToken.update.mockResolvedValue({ id: 'token_1', usedAt: new Date() })

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Invalid API Key' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const app = makeApp(prisma, {
      APP_URL: 'https://pairlog.app',
      WEB_URL: 'https://pairlog.app',
      RESEND_API_KEY: 're_invalid_key',
      RESET_EMAIL_FROM: 'Pairlog <no-reply@example.com>',
    })
    const res = await app.request('/api/v1/auth/request-reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '10.0.0.99', // 他テストとバケツを分けてレートリミットを回避
      },
      body: JSON.stringify({ email: 'user@example.com' }),
    })

    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({
      code: 'RESET_EMAIL_UNAVAILABLE',
      message: '現在パスワード再設定メールを送信できません。少し待ってから再度お試しください',
    })
    // トークンは使用済みにされる（再利用不可）
    expect(prisma.passwordResetToken.update).toHaveBeenCalledWith({
      where: { id: 'token_1' },
      data: { usedAt: expect.any(Date) },
    })
  })
})

describe('POST /api/v1/auth/reset-password', () => {
  async function requestResetPassword(app: ReturnType<typeof makeApp>, body?: {
    email?: string
    code?: string
    new_password?: string
  }, ip = '10.0.1.1') {
    return app.request('/api/v1/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip },
      body: JSON.stringify({
        email: body?.email ?? 'user@example.com',
        code: body?.code ?? '123456',
        new_password: body?.new_password ?? 'new-password-123',
      }),
    })
  }

  function mockValidReset() {
    const prisma = new PrismaClient() as any
    prisma.$executeRawUnsafe.mockResolvedValue(undefined)
    prisma.user.findUnique.mockResolvedValue({
      id: 'user_1',
      email: 'user@example.com',
      tokenVersion: 0,
      deletedAt: null,
    })
    const token = {
      id: 'token_1',
      userId: 'user_1',
      code: '123456',
      usedAt: null,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    }
    prisma.passwordResetToken.findFirst.mockResolvedValue(token)
    prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 1 })
    prisma.user.update.mockResolvedValue({ id: 'user_1', tokenVersion: 1 })
    prisma.membership.findFirst.mockResolvedValue(null)
    prisma.analyticsEvent.create.mockResolvedValue({ id: 1n })

    return { prisma, token }
  }

  it('changes the password with a valid code', async () => {
    const { prisma } = mockValidReset()
    const signTokenSpy = vi.spyOn(jwt, 'signToken')

    const app = makeApp(prisma)
    const res = await requestResetPassword(app)

    expect(res.status).toBe(200)
    const body = (await res.json()) as { user_id: string; device_token: string }
    expect(body.user_id).toBe('user_1')
    expect(body).toHaveProperty('device_token')
    expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledTimes(1)
    expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'token_1',
        userId: 'user_1',
        code: '123456',
        usedAt: null,
        expiresAt: { gt: expect.any(Date) },
      },
      data: { usedAt: expect.any(Date) },
    })
    const consumed = prisma.passwordResetToken.updateMany.mock.calls[0][0]
    expect(consumed.where.expiresAt.gt).toEqual(consumed.data.usedAt)
    expect(prisma.passwordResetToken.update).not.toHaveBeenCalled()
    expect(signTokenSpy).toHaveBeenCalledTimes(1)
    expect(prisma.user.update).toHaveBeenCalledTimes(1)
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user_1' },
      data: {
        passwordHash: expect.any(String),
        tokenVersion: { increment: 1 },
      },
    })
  })

  it('stops before password update and JWT issuance when consumption loses a race', async () => {
    const { prisma } = mockValidReset()
    const signTokenSpy = vi.spyOn(jwt, 'signToken')
    prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 })

    const res = await requestResetPassword(makeApp(prisma), undefined, '10.0.1.2')

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      code: 'INVALID_RESET_CODE',
      message: 'リセットコードが無効または期限切れです',
    })
    expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledTimes(1)
    expect(prisma.passwordResetToken.update).not.toHaveBeenCalled()
    expect(prisma.user.update).not.toHaveBeenCalled()
    expect(signTokenSpy).not.toHaveBeenCalled()
    expect(prisma.membership.findFirst).not.toHaveBeenCalled()
    expect(prisma.analyticsEvent.create).not.toHaveBeenCalled()
  })

  it('allows only one of two concurrent requests holding the same unused code', async () => {
    const { prisma, token } = mockValidReset()
    const signTokenSpy = vi.spyOn(jwt, 'signToken')
    let releaseLookups!: () => void
    const bothLookups = new Promise<void>((resolve) => { releaseLookups = resolve })
    let lookups = 0
    let usedAt: Date | null = null

    // Both requests read the unused token before either attempts consumption.
    prisma.passwordResetToken.findFirst.mockImplementation(async () => {
      const snapshot = { ...token, usedAt }
      if (++lookups === 2) releaseLookups()
      await bothLookups
      return snapshot
    })
    // Model the database's atomic conditional update without an await in between.
    prisma.passwordResetToken.updateMany.mockImplementation(async ({ where, data }: any) => {
      if (where.id !== token.id || where.userId !== token.userId || where.code !== token.code ||
          where.usedAt !== null || usedAt !== null || !(token.expiresAt > where.expiresAt.gt)) {
        return { count: 0 }
      }
      usedAt = data.usedAt
      return { count: 1 }
    })

    const app = makeApp(prisma)
    const responses = await Promise.all([
      requestResetPassword(app, { new_password: 'first-password-123' }, '10.0.1.3'),
      requestResetPassword(app, { new_password: 'second-password-123' }, '10.0.1.4'),
    ])

    expect(responses.map((res) => res.status).sort()).toEqual([200, 400])
    const failure = responses.find((res) => res.status === 400)!
    expect(await failure.json()).toEqual({
      code: 'INVALID_RESET_CODE',
      message: 'リセットコードが無効または期限切れです',
    })
    const success = responses.find((res) => res.status === 200)!
    expect(await success.json()).toHaveProperty('device_token')
    expect(prisma.passwordResetToken.findFirst).toHaveBeenCalledTimes(2)
    expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledTimes(2)
    expect(prisma.passwordResetToken.update).not.toHaveBeenCalled()
    expect(prisma.user.update).toHaveBeenCalledTimes(1)
    expect(signTokenSpy).toHaveBeenCalledTimes(1)
    expect(prisma.membership.findFirst).toHaveBeenCalledTimes(1)
    expect(prisma.analyticsEvent.create).toHaveBeenCalledTimes(1)
    expect(usedAt).toBeInstanceOf(Date)
  })

  it('returns INVALID_RESET_CODE when the code is expired', async () => {
    const prisma = new PrismaClient() as any
    prisma.$executeRawUnsafe.mockResolvedValue(undefined)
    prisma.user.findUnique.mockResolvedValue({
      id: 'user_1',
      email: 'user@example.com',
      deletedAt: null,
    })
    prisma.passwordResetToken.findFirst.mockResolvedValue(null)

    const app = makeApp(prisma)
    const res = await requestResetPassword(app)

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      code: 'INVALID_RESET_CODE',
      message: 'リセットコードが無効または期限切れです',
    })
  })

  it('returns INVALID_RESET_CODE when the code has already been used', async () => {
    const prisma = new PrismaClient() as any
    prisma.$executeRawUnsafe.mockResolvedValue(undefined)
    prisma.user.findUnique.mockResolvedValue({
      id: 'user_1',
      email: 'user@example.com',
      deletedAt: null,
    })
    prisma.passwordResetToken.findFirst.mockResolvedValue(null)

    const app = makeApp(prisma)
    const res = await requestResetPassword(app)

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      code: 'INVALID_RESET_CODE',
      message: 'リセットコードが無効または期限切れです',
    })
  })

  it('returns INVALID_RESET_CODE for an unknown email address', async () => {
    const prisma = new PrismaClient() as any
    prisma.$executeRawUnsafe.mockResolvedValue(undefined)
    prisma.user.findUnique.mockResolvedValue(null)

    const app = makeApp(prisma)
    const res = await requestResetPassword(app, {
      email: 'ghost@example.com',
    })

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      code: 'INVALID_RESET_CODE',
      message: 'リセットコードが無効または期限切れです',
    })
  })

  it('returns INVALID_RESET_CODE for a deleted user', async () => {
    const prisma = new PrismaClient() as any
    prisma.$executeRawUnsafe.mockResolvedValue(undefined)
    prisma.user.findUnique.mockResolvedValue({
      id: 'user_1',
      email: 'user@example.com',
      deletedAt: new Date(),
    })

    const app = makeApp(prisma)
    const res = await requestResetPassword(app)

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      code: 'INVALID_RESET_CODE',
      message: 'リセットコードが無効または期限切れです',
    })
  })
})

describe('POST /api/v1/auth/refresh', () => {
  it('rejects an old JWT when tokenVersion has changed', async () => {
    const prisma = new PrismaClient() as any
    prisma.user.findUnique.mockResolvedValue({
      id: 'user_1',
      tokenVersion: 1,
      deletedAt: null,
    })

    const app = makeApp(prisma)
    const staleToken = await signToken('user_1', TEST_SECRET, 0)
    const res = await app.request('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { Authorization: `Bearer ${staleToken}` },
    })

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({
      code: 'AUTH_REQUIRED',
      message: '認証が必要です',
    })
  })
})

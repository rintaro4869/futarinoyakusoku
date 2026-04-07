import { Hono } from 'hono'
import { z } from 'zod'
import { Variables } from '../../app.js'
import { generateId } from '../../lib/id.js'
import { signToken } from '../../lib/jwt.js'
import { makeError } from '../../lib/error-codes.js'
import { hashPassword, verifyPassword } from '../../lib/password.js'
import { trackEvent } from '../../services/analytics.js'
import {
  canBypassPasswordResetEmail,
  isPasswordResetEmailConfigured,
  PasswordResetEmailSendError,
  sendPasswordResetEmail,
} from '../../services/email.js'

const createSchema = z.object({
  locale: z.string().default('ja-JP'),
  timezone: z.string().default('Asia/Tokyo'),
})

const registerSchema = z.object({
  email: z.string().email('メールアドレスの形式が正しくありません'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  locale: z.string().default('ja-JP'),
  timezone: z.string().default('Asia/Tokyo'),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const requestResetSchema = z.object({
  email: z.string().email(),
})

const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(6),
  new_password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
})

async function ensurePasswordResetStorage(prisma: Variables['prisma']) {
  const execute = prisma.$executeRawUnsafe?.bind(prisma)
  if (!execute) return

  await execute(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `)
  await execute(`
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id
    ON password_reset_tokens(user_id)
  `)
  await execute(`
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_lookup
    ON password_reset_tokens(user_id, code, used_at, expires_at)
  `)
}

export function authRoutes(app: Hono<{ Variables: Variables }>) {
  app.get('/health', (c) => c.json({ ok: true }))

  // 匿名ユーザー作成（後方互換のため残す）
  app.post('/auth/anonymous', async (c) => {
    const raw = await c.req.json().catch(() => ({}))
    const body = createSchema.parse(raw)
    const prisma = c.get('prisma')
    const jwtSecret = c.get('jwtSecret')

    const userId = generateId()
    await prisma.user.create({
      data: { id: userId, locale: body.locale, timezone: body.timezone },
    })

    const token = await signToken(userId, jwtSecret, 0)

    await trackEvent(prisma, {
      eventName: 'signup_completed',
      userId,
      payload: { locale: body.locale },
    })

    return c.json({ user_id: userId, device_token: token })
  })

  // メール+パスワードで新規登録
  app.post('/auth/register', async (c) => {
    const raw = await c.req.json().catch(() => ({}))
    const body = registerSchema.parse(raw)
    const prisma = c.get('prisma')
    const jwtSecret = c.get('jwtSecret')
    const email = body.email.toLowerCase().trim()

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return c.json(makeError('EMAIL_ALREADY_EXISTS'), 409)
    }

    const userId = generateId()
    const passwordHash = await hashPassword(body.password)

    await prisma.user.create({
      data: {
        id: userId,
        email,
        passwordHash,
        locale: body.locale,
        timezone: body.timezone,
      },
    })

    const token = await signToken(userId, jwtSecret, 0)

    await trackEvent(prisma, {
      eventName: 'signup_completed',
      userId,
      payload: { locale: body.locale, method: 'email' },
    })

    return c.json({ user_id: userId, device_token: token })
  })

  // トークンリフレッシュ（有効なJWTを提示すれば新しいJWTを発行）
  app.post('/auth/refresh', async (c) => {
    const jwtSecret = c.get('jwtSecret')
    const userId = c.get('userId')
    const userTokenVersion = c.get('userTokenVersion')
    const token = await signToken(userId, jwtSecret, userTokenVersion)
    return c.json({ device_token: token })
  })

  // メール+パスワードでログイン
  app.post('/auth/login', async (c) => {
    const raw = await c.req.json().catch(() => ({}))
    const body = loginSchema.parse(raw)
    const prisma = c.get('prisma')
    const jwtSecret = c.get('jwtSecret')
    const email = body.email.toLowerCase().trim()

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || user.deletedAt || !user.passwordHash) {
      return c.json(makeError('INVALID_CREDENTIALS'), 401)
    }

    const valid = await verifyPassword(body.password, user.passwordHash)
    if (!valid) {
      return c.json(makeError('INVALID_CREDENTIALS'), 401)
    }

    const token = await signToken(user.id, jwtSecret, user.tokenVersion ?? 0)

    // ペアリング済みならcouple_idも返す
    const membership = await prisma.membership.findFirst({
      where: { userId: user.id, leftAt: null },
    })

    return c.json({
      user_id: user.id,
      device_token: token,
      couple_id: membership?.coupleId ?? null,
    })
  })

  // パスワードリセット要求（6桁コードを発行）
  app.post('/auth/request-reset', async (c) => {
    const raw = await c.req.json().catch(() => ({}))
    const body = requestResetSchema.parse(raw)
    const prisma = c.get('prisma')
    const passwordResetEmailConfig = c.get('passwordResetEmailConfig')
    const email = body.email.toLowerCase().trim()

    await ensurePasswordResetStorage(prisma)

    if (
      !canBypassPasswordResetEmail(passwordResetEmailConfig) &&
      !isPasswordResetEmailConfigured(passwordResetEmailConfig)
    ) {
      return c.json(makeError('RESET_EMAIL_UNAVAILABLE'), 503)
    }

    const user = await prisma.user.findUnique({ where: { email } })

    // ユーザーが存在しなくても同じレスポンスを返す（メール存在の漏洩防止）
    if (!user || user.deletedAt) {
      return c.json({ ok: true })
    }

    // 6桁の数字コードを生成
    const codeNum = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000
    const code = String(codeNum).padStart(6, '0')

    const resetToken = await prisma.passwordResetToken.create({
      data: {
        id: generateId(),
        userId: user.id,
        code,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15分
      },
    })

    try {
      await sendPasswordResetEmail({
        email,
        code,
        locale: user.locale,
        config: passwordResetEmailConfig,
      })
    } catch (error) {
      await prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      })

      if (error instanceof PasswordResetEmailSendError) {
        console.error('[auth] password reset email delivery failed', {
          status: error.status,
        })
        return c.json(makeError('RESET_EMAIL_UNAVAILABLE'), 503)
      }

      throw error
    }

    // メール送信に成功した最新コードだけを有効にする
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null, id: { not: resetToken.id } },
      data: { usedAt: new Date() },
    })

    await trackEvent(prisma, {
      eventName: 'password_reset_requested',
      userId: user.id,
    })

    return c.json({ ok: true })
  })

  // パスワードリセット実行
  app.post('/auth/reset-password', async (c) => {
    const raw = await c.req.json().catch(() => ({}))
    const body = resetPasswordSchema.parse(raw)
    const prisma = c.get('prisma')
    const jwtSecret = c.get('jwtSecret')
    const email = body.email.toLowerCase().trim()

    await ensurePasswordResetStorage(prisma)

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || user.deletedAt) {
      return c.json(makeError('INVALID_RESET_CODE'), 400)
    }

    // 有効な未使用トークンを検索
    const token = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        code: body.code,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    })

    if (!token) {
      return c.json(makeError('INVALID_RESET_CODE'), 400)
    }

    // トークンを使用済みにする
    await prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    })

    // パスワードを更新
    const passwordHash = await hashPassword(body.new_password)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        tokenVersion: { increment: 1 },
      },
    })

    // 新しいJWTを発行してそのままログイン
    const jwt = await signToken(updatedUser.id, jwtSecret, updatedUser.tokenVersion ?? 0)

    const membership = await prisma.membership.findFirst({
      where: { userId: user.id, leftAt: null },
    })

    await trackEvent(prisma, {
      eventName: 'password_reset_completed',
      userId: user.id,
    })

    return c.json({
      user_id: user.id,
      device_token: jwt,
      couple_id: membership?.coupleId ?? null,
    })
  })
}

import { Hono } from 'hono'
import { PrismaClient, User } from '@fny/db'
import { ZodError } from 'zod'
import { makeError } from './lib/error-codes.js'
import { verifyToken } from './lib/jwt.js'
import { PasswordResetEmailConfig } from './services/email.js'
import {
  allowedOriginsFromEnv,
  applySecurityHeaders,
  buildCorsHeaders,
  checkAuthRateLimit,
  getClientKey,
  resolveJwtSecret,
} from './lib/security.js'

// Route modules (Hono版)
import { authRoutes } from './routes/hono/auth.js'
import { coupleRoutes } from './routes/hono/couples.js'
import { ruleRoutes } from './routes/hono/rules.js'
import { eventRoutes } from './routes/hono/events.js'
import { repairRoutes, repairTemplateRoutes } from './routes/hono/repairs.js'
import { safetyRoutes } from './routes/hono/safety.js'
import { summaryRoutes } from './routes/hono/summary.js'
import { privacyRoutes } from './routes/hono/privacy.js'

export type Env = {
  JWT_SECRET: string
  WEB_URL: string
  APP_URL: string
  MAINTENANCE_MODE?: string
  RESEND_API_KEY?: string
  RESET_EMAIL_FROM?: string
  RESET_EMAIL_REPLY_TO?: string
}

// Hono context variable types
export type Variables = {
  userId: string
  userTokenVersion: number
  currentUser: User
  prisma: PrismaClient
  jwtSecret: string
  appUrl: string
  webUrl: string
  passwordResetEmailConfig: PasswordResetEmailConfig
}

const PUBLIC_PATHS = ['/api/v1/health', '/api/v1/auth/anonymous', '/api/v1/auth/register', '/api/v1/auth/login', '/api/v1/auth/request-reset', '/api/v1/auth/reset-password']

export function createApp(
  prismaFactory: () => PrismaClient,
  devEnv?: Partial<Env>
) {
  const app = new Hono<{ Variables: Variables }>()

  // Security headers + strict CORS for browser clients.
  app.use('/api/v1/*', async (c, next) => {
    const workerEnv = c.env as Env | undefined
    const appUrl = workerEnv?.APP_URL ?? devEnv?.APP_URL ?? 'http://localhost:3000'
    const webUrl = workerEnv?.WEB_URL ?? devEnv?.WEB_URL ?? 'http://localhost:3000'
    const origin = c.req.header('Origin')
    const allowedOrigins = allowedOriginsFromEnv(appUrl, webUrl)

    if (origin) {
      if (!allowedOrigins.has(origin)) {
        return c.json(makeError('FORBIDDEN'), 403)
      }

      const corsHeaders = buildCorsHeaders(origin)
      if (c.req.method === 'OPTIONS') {
        applySecurityHeaders(corsHeaders, true)
        return new Response(null, { status: 204, headers: corsHeaders })
      }

      await next()
      corsHeaders.forEach((value, key) => c.header(key, value))
      applySecurityHeaders(c.res.headers, true)
      return
    }

    await next()
    applySecurityHeaders(c.res.headers, true)
  })

  // Maintenance mode: return 503 for all endpoints except /health
  app.use('/api/v1/*', async (c, next) => {
    const workerEnv = c.env as Env | undefined
    const maintenance = workerEnv?.MAINTENANCE_MODE ?? devEnv?.MAINTENANCE_MODE
    if (maintenance === 'true') {
      const path = new URL(c.req.url).pathname
      if (path !== '/api/v1/health') {
        return c.json({ code: 'MAINTENANCE', message: 'メンテナンス中です。しばらくお待ちください。' }, 503)
      }
    }
    await next()
  })

  // Inject prisma + env into context
  // Workers: reads from c.env (wrangler bindings)
  // Node.js dev: reads from devEnv (process.env values)
  app.use('*', async (c, next) => {
    const workerEnv = c.env as Env | undefined
    const db = prismaFactory()
    const appUrl = workerEnv?.APP_URL ?? devEnv?.APP_URL ?? 'http://localhost:3000'
    const webUrl = workerEnv?.WEB_URL ?? devEnv?.WEB_URL ?? 'http://localhost:3000'
    const jwtSecret = resolveJwtSecret(workerEnv?.JWT_SECRET ?? devEnv?.JWT_SECRET, appUrl, webUrl)
    const passwordResetEmailConfig: PasswordResetEmailConfig = {
      appUrl,
      webUrl,
      resendApiKey: workerEnv?.RESEND_API_KEY ?? devEnv?.RESEND_API_KEY,
      resetEmailFrom: workerEnv?.RESET_EMAIL_FROM ?? devEnv?.RESET_EMAIL_FROM,
      resetEmailReplyTo: workerEnv?.RESET_EMAIL_REPLY_TO ?? devEnv?.RESET_EMAIL_REPLY_TO,
    }
    c.set('prisma', db)
    c.set('jwtSecret', jwtSecret)
    c.set('appUrl', appUrl)
    c.set('webUrl', webUrl)
    c.set('passwordResetEmailConfig', passwordResetEmailConfig)
    await next()
  })

  // Best-effort auth rate limiting for public auth endpoints.
  app.use('/api/v1/auth/*', async (c, next) => {
    const path = new URL(c.req.url).pathname
    const { blocked, retryAfterSeconds } = checkAuthRateLimit(path, getClientKey(c.req.raw.headers))
    if (blocked) {
      c.header('Retry-After', String(retryAfterSeconds))
      return c.json(makeError('TOO_MANY_REQUESTS'), 429)
    }
    await next()
  })

  // Auth middleware (skip public paths)
  app.use('/api/v1/*', async (c, next) => {
    const path = new URL(c.req.url).pathname
    if (PUBLIC_PATHS.includes(path)) return next()

    const auth = c.req.header('Authorization')
    if (!auth?.startsWith('Bearer ')) {
      return c.json(makeError('AUTH_REQUIRED'), 401)
    }
    const token = auth.slice(7)
    try {
      const { userId, tokenVersion } = await verifyToken(token, c.get('jwtSecret'))
      const user = await c.get('prisma').user.findUnique({ where: { id: userId } })
      if (!user || user.deletedAt || (user.tokenVersion ?? 0) !== tokenVersion) {
        return c.json(makeError('AUTH_REQUIRED'), 401)
      }
      c.set('userId', userId)
      c.set('userTokenVersion', user.tokenVersion ?? 0)
      c.set('currentUser', user)
    } catch {
      return c.json(makeError('AUTH_REQUIRED'), 401)
    }
    return next()
  })

  // Mount routes
  const v1 = new Hono<{ Variables: Variables }>()
  authRoutes(v1)
  coupleRoutes(v1)
  ruleRoutes(v1)
  eventRoutes(v1)
  repairRoutes(v1)
  repairTemplateRoutes(v1)
  safetyRoutes(v1)
  summaryRoutes(v1)
  privacyRoutes(v1)
  app.route('/api/v1', v1)

  // Error handler
  app.onError((err, c) => {
    if (err instanceof ZodError) {
      const res = c.json({ code: 'VALIDATION_ERROR', message: err.errors[0]?.message ?? 'Invalid input' }, 400)
      applySecurityHeaders(res.headers, new URL(c.req.url).pathname.startsWith('/api/v1/'))
      return res
    }
    console.error(err)
    const res = c.json(makeError('INTERNAL_ERROR'), 500)
    applySecurityHeaders(res.headers, new URL(c.req.url).pathname.startsWith('/api/v1/'))
    return res
  })

  app.notFound((c) => {
    const res = c.json(makeError('NOT_FOUND'), 404)
    applySecurityHeaders(res.headers, new URL(c.req.url).pathname.startsWith('/api/v1/'))
    return res
  })

  return app
}

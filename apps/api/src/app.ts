import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { PrismaClient } from '@fny/db'
import { makeError } from './lib/error-codes.js'
import { verifyToken } from './lib/jwt.js'

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
  DATABASE_URL: string
  JWT_SECRET: string
  WEB_URL: string
  APP_URL: string
}

// Hono context variable types
export type Variables = {
  userId: string
  prisma: PrismaClient
  jwtSecret: string
  appUrl: string
}

const PUBLIC_PATHS = ['/api/v1/health', '/api/v1/auth/anonymous']

export function createApp(
  prismaFactory: (url: string) => PrismaClient,
  devEnv?: Partial<Env>
) {
  const app = new Hono<{ Variables: Variables }>()

  // CORS
  app.use('*', cors({
    origin: (origin) => origin ?? '*',
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }))

  // Inject prisma + env into context
  // Workers: reads from c.env (wrangler bindings)
  // Node.js dev: reads from devEnv (process.env values)
  app.use('*', async (c, next) => {
    const workerEnv = c.env as Env | undefined
    const dbUrl = workerEnv?.DATABASE_URL ?? devEnv?.DATABASE_URL ?? 'postgresql://postgres:password@localhost:5432/futari_no_yakusoku'
    const db = prismaFactory(dbUrl)
    c.set('prisma', db)
    c.set('jwtSecret', workerEnv?.JWT_SECRET ?? devEnv?.JWT_SECRET ?? 'dev-secret-min-32-chars-long-xxx')
    c.set('appUrl', workerEnv?.APP_URL ?? devEnv?.APP_URL ?? 'http://localhost:3000')
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
      const userId = await verifyToken(token, c.get('jwtSecret'))
      c.set('userId', userId)
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
    console.error(err)
    return c.json(makeError('INTERNAL_ERROR'), 500)
  })

  app.notFound((c) => c.json(makeError('NOT_FOUND'), 404))

  return app
}

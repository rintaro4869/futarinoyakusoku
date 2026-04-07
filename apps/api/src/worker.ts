/**
 * Cloudflare Workers エントリポイント
 * wrangler deploy で使用される
 */
import { createApp } from './app.js'
import { getPrisma } from './lib/db.js'
import type { D1Database, ExecutionContext } from '@cloudflare/workers-types'

export interface WorkerEnv {
  DB: D1Database
  JWT_SECRET: string
  WEB_URL: string
  APP_URL: string
  MAINTENANCE_MODE?: string
  RESEND_API_KEY?: string
  RESET_EMAIL_FROM?: string
  RESET_EMAIL_REPLY_TO?: string
}

export default {
  fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext) {
    const prisma = getPrisma(env.DB)
    const app = createApp(() => prisma, {
      JWT_SECRET: env.JWT_SECRET,
      WEB_URL: env.WEB_URL,
      APP_URL: env.APP_URL,
      RESEND_API_KEY: env.RESEND_API_KEY,
      RESET_EMAIL_FROM: env.RESET_EMAIL_FROM,
      RESET_EMAIL_REPLY_TO: env.RESET_EMAIL_REPLY_TO,
    })
    return app.fetch(request, env, ctx)
  },
}

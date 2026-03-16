/**
 * Cloudflare Workers エントリポイント
 * wrangler deploy で使用される
 */
import { createApp } from './app.js'
import { createPrismaClient } from './lib/db.js'

export interface WorkerEnv {
  DATABASE_URL: string
  JWT_SECRET: string
  WEB_URL: string
  APP_URL: string
}

const app = createApp((url) => createPrismaClient(url))

export default {
  fetch: app.fetch,
}

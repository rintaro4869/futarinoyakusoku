/**
 * ローカル開発用エントリポイント（Node.js）
 * `pnpm dev` で使用される
 */
import { serve } from '@hono/node-server'
import { createApp } from './app.js'
import { getPrisma } from './lib/db.js'
import { runExpiryJob } from './services/expiry.js'

const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:password@localhost:5432/futari_no_yakusoku'
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-min-32-chars-long-xxx'
const WEB_URL = process.env.WEB_URL ?? 'http://localhost:3000'
const APP_URL = process.env.APP_URL ?? 'http://localhost:3000'

const prisma = getPrisma(DATABASE_URL)
const app = createApp(() => prisma, { DATABASE_URL, JWT_SECRET, WEB_URL, APP_URL })
const localApp = app

// Start expiry job (every 5 minutes)
setInterval(() => {
  runExpiryJob(prisma).catch(err => console.error('[expiry]', err))
}, 5 * 60 * 1000)

const port = parseInt(process.env.PORT ?? '3001', 10)

serve({ fetch: localApp.fetch, port }, () => {
  console.log(`API listening on http://localhost:${port}`)
})

export { app as default }

/**
 * ローカル開発用エントリポイント（Node.js）
 *
 * NOTE: D1 移行後は、本番環境は `wrangler dev` を使用してください。
 * `wrangler dev` を使うと D1 がローカルで SQLite としてシミュレートされます。
 *
 * このファイルはローカル Node.js サーバーとして起動する場合のみ使用します。
 * その場合、D1 は使えないため、ローカル SQLite ファイルへのアダプターが必要です。
 *
 * 推奨: `pnpm dev` の代わりに `npx wrangler dev` を使用してください。
 */
import { serve } from '@hono/node-server'
import { createApp } from './app.js'

// ローカル開発: wrangler dev を使用することを推奨
// wrangler dev は自動的に D1 をローカル SQLite でシミュレートします
//
// もし Node.js 直接起動が必要な場合は、
// @prisma/adapter-d1 の代わりに @prisma/adapter-libsql などを使用してください

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-min-32-chars-long-xxx'
const WEB_URL = process.env.WEB_URL ?? 'http://localhost:3000'
const APP_URL = process.env.APP_URL ?? 'http://localhost:3000'

// ダミーPrismaファクトリ（wrangler devを使う場合はこのファイルは不要）
// wrangler devではworker.tsが使われ、env.DBからD1が注入されます
const app = createApp(
  () => { throw new Error('Node.js直接起動はサポートされていません。`npx wrangler dev` を使用してください。') },
  { JWT_SECRET, WEB_URL, APP_URL }
)

const port = parseInt(process.env.PORT ?? '3001', 10)

serve({ fetch: app.fetch, port }, () => {
  console.log(`API listening on http://localhost:${port}`)
  console.log('NOTE: D1データベースは利用できません。`npx wrangler dev` を使用してください。')
})

export { app as default }

import { PrismaClient } from '@fny/db'

// Cloudflare Workers: Neon serverless adapter
// Node.js: direct PostgreSQL connection
export function createPrismaClient(databaseUrl: string): PrismaClient {
  const g = globalThis as Record<string, unknown>
  const nav = g['navigator'] as { userAgent?: string } | undefined
  if (typeof g['EdgeRuntime'] !== 'undefined' || nav?.userAgent === 'Cloudflare-Workers') {
    // Workers environment: use Neon serverless adapter
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { neon } = require('@neondatabase/serverless')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaNeon } = require('@prisma/adapter-neon')
    const sql = neon(databaseUrl)
    const adapter = new PrismaNeon(sql)
    return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])
  }
  // Node.js: standard connection
  return new PrismaClient({ datasources: { db: { url: databaseUrl } } })
}

// Singleton for local dev
let _prisma: PrismaClient | null = null

export function getPrisma(databaseUrl: string): PrismaClient {
  if (!_prisma) _prisma = createPrismaClient(databaseUrl)
  return _prisma
}

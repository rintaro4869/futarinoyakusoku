import { PrismaClient } from '@fny/db'
import { PrismaD1 } from '@prisma/adapter-d1'
import type { D1Database } from '@cloudflare/workers-types'

export function getPrisma(d1: D1Database): PrismaClient {
  const adapter = new PrismaD1(d1)
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])
}

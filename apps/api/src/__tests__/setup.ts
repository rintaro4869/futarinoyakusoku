// Vitest global setup
// In CI: uses real test DB. For unit tests: mocks Prisma.
import { vi } from 'vitest'

vi.mock('@fny/db', () => {
  const defaultUser = {
    id: 'user_test_1',
    email: 'user@example.com',
    passwordHash: 'hashed-password',
    tokenVersion: 0,
    locale: 'ja-JP',
    timezone: 'Asia/Tokyo',
    createdAt: new Date(),
    deletedAt: null,
  }
  const mockPrisma: Record<string, unknown> = {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(async (args?: { where?: { id?: string; email?: string } }) => {
        if (args?.where?.id) {
          return { ...defaultUser, id: args.where.id }
        }
        if (args?.where?.email) {
          return { ...defaultUser, email: args.where.email }
        }
        return defaultUser
      }),
      update: vi.fn(),
      delete: vi.fn(),
    },
    couple: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
    membership: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
    inviteCode: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
    rule: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), count: vi.fn(), deleteMany: vi.fn() },
    ruleEvent: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), updateMany: vi.fn(), count: vi.fn(), deleteMany: vi.fn() },
    ruleOccurrenceAction: { create: vi.fn(), findMany: vi.fn(), deleteMany: vi.fn() },
    pointLedger: { create: vi.fn(), aggregate: vi.fn(), deleteMany: vi.fn() },
    repairTemplate: { findUnique: vi.fn(), findMany: vi.fn() },
    repairAction: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), updateMany: vi.fn(), count: vi.fn(), deleteMany: vi.fn() },
    safetyAction: { create: vi.fn(), deleteMany: vi.fn() },
    analyticsEvent: { create: vi.fn(), deleteMany: vi.fn() },
    passwordResetToken: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
    $executeRawUnsafe: vi.fn(),
    $transaction: vi.fn(async (arg: unknown) => {
      if (typeof arg === 'function') {
        return (arg as (tx: Record<string, unknown>) => Promise<unknown>)(mockPrisma)
      }
      if (Array.isArray(arg)) {
        return Promise.all(arg)
      }
      return []
    }),
    $disconnect: vi.fn(),
  }
  return { PrismaClient: vi.fn(() => mockPrisma) }
})

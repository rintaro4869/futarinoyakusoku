// Vitest global setup
// In CI: uses real test DB. For unit tests: mocks Prisma.
import { vi } from 'vitest'

vi.mock('@fny/db', () => {
  const mockPrisma: Record<string, unknown> = {
    user: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    couple: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    membership: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    inviteCode: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    rule: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), count: vi.fn() },
    ruleEvent: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), updateMany: vi.fn(), count: vi.fn() },
    pointLedger: { create: vi.fn(), aggregate: vi.fn() },
    repairTemplate: { findUnique: vi.fn(), findMany: vi.fn() },
    repairAction: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), updateMany: vi.fn(), count: vi.fn() },
    safetyAction: { create: vi.fn() },
    analyticsEvent: { create: vi.fn() },
    $transaction: vi.fn(async (fn: (tx: Record<string, unknown>) => Promise<unknown>) => fn(mockPrisma)),
    $disconnect: vi.fn(),
  }
  return { PrismaClient: vi.fn(() => mockPrisma) }
})

import { describe, it, expect, vi } from 'vitest'
import { createCoupleWithInvite } from '../routes/hono/couples.js'

describe('createCoupleWithInvite', () => {
  it('retries when invite code creation hits a unique conflict', async () => {
    const tx = {
      couple: { create: vi.fn().mockResolvedValue(undefined) },
      membership: { create: vi.fn().mockResolvedValue(undefined) },
      inviteCode: {
        create: vi
          .fn()
          .mockRejectedValueOnce(Object.assign(new Error('duplicate'), { code: 'P2002' }))
          .mockResolvedValueOnce(undefined),
      },
    }

    const transaction = vi.fn(async (queries: Promise<unknown>[]) => Promise.all(queries))
    const prisma: Parameters<typeof createCoupleWithInvite>[0] = {
      couple: tx.couple,
      membership: tx.membership,
      inviteCode: tx.inviteCode,
      $transaction: transaction as Parameters<typeof createCoupleWithInvite>[0]['$transaction'],
    }

    const result = await createCoupleWithInvite(prisma, 'user_1', 'Rintaro')

    expect(result.code).toHaveLength(8)
    expect(transaction).toHaveBeenCalledTimes(2)
    expect(tx.inviteCode.create).toHaveBeenCalledTimes(2)
  })

  it('gives up after repeated unique conflicts', async () => {
    const tx = {
      couple: { create: vi.fn().mockResolvedValue(undefined) },
      membership: { create: vi.fn().mockResolvedValue(undefined) },
      inviteCode: {
        create: vi.fn().mockRejectedValue(Object.assign(new Error('duplicate'), { code: 'P2002' })),
      },
    }

    const transaction = vi.fn(async (queries: Promise<unknown>[]) => Promise.all(queries))
    const prisma: Parameters<typeof createCoupleWithInvite>[0] = {
      couple: tx.couple,
      membership: tx.membership,
      inviteCode: tx.inviteCode,
      $transaction: transaction as Parameters<typeof createCoupleWithInvite>[0]['$transaction'],
    }

    await expect(createCoupleWithInvite(prisma, 'user_1', 'Rintaro')).rejects.toMatchObject({
      code: 'P2002',
    })
    expect(transaction).toHaveBeenCalledTimes(5)
  })
})

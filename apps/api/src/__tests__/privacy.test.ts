import { describe, expect, it, vi } from 'vitest'
import { PrismaClient } from '@fny/db'
import { createApp } from '../app.js'
import { signToken } from '../lib/jwt.js'

const TEST_SECRET = 'test-secret-min-32-chars-long-xxxx'

describe('DELETE /api/v1/users/:user_id/data', () => {
  it('deletes the user and related shared data', async () => {
    const prisma = new PrismaClient() as any
    prisma.user.findUnique.mockResolvedValue({ id: 'user_1' })
    prisma.user.delete.mockResolvedValue({ id: 'user_1' })
    prisma.membership.findMany.mockResolvedValue([{ coupleId: 'couple_1' }])
    prisma.rule.findMany.mockResolvedValue([{ id: 'rule_1' }])
    prisma.ruleEvent.findMany.mockResolvedValue([{ id: 'event_1' }])
    prisma.analyticsEvent.create.mockResolvedValue({ id: 1n })
    prisma.$transaction.mockImplementation(async (queries: Promise<unknown>[]) => Promise.all(queries))

    const app = createApp(() => prisma as PrismaClient, {
      JWT_SECRET: TEST_SECRET,
      APP_URL: 'http://localhost:3000',
      WEB_URL: 'http://localhost:3000',
    })
    const token = await signToken('user_1', TEST_SECRET)

    const res = await app.request('/api/v1/users/user_1/data', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.status).toBe(204)
    expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user_1' },
    })
    expect(prisma.ruleOccurrenceAction.deleteMany).toHaveBeenCalledWith({
      where: { ruleId: { in: ['rule_1'] } },
    })
    expect(prisma.couple.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['couple_1'] } },
    })
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: 'user_1' },
    })
  })

  it('rejects deletion when the authenticated user does not match', async () => {
    const prisma = new PrismaClient() as any
    const app = createApp(() => prisma as PrismaClient, {
      JWT_SECRET: TEST_SECRET,
      APP_URL: 'http://localhost:3000',
      WEB_URL: 'http://localhost:3000',
    })
    const token = await signToken('user_2', TEST_SECRET)

    const res = await app.request('/api/v1/users/user_1/data', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.status).toBe(403)
  })
})

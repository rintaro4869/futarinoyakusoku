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

describe('GET /api/v1/users/:user_id/export', () => {
  it('exports only active shared couples and the authenticated user’s own history', async () => {
    const prisma = new PrismaClient() as any
    prisma.membership.findMany.mockResolvedValue([{ coupleId: 'couple_1', displayName: 'Me', role: 'member', joinedAt: new Date() }])
    prisma.diaryEntry.findMany
      .mockResolvedValueOnce([{ id: 'own_old', coupleId: 'former_couple', body: 'Mine', createdAt: new Date() }])
      .mockResolvedValueOnce([{ id: 'shared', coupleId: 'couple_1', body: 'Shared', createdAt: new Date() }])
    prisma.analyticsEvent.findMany.mockResolvedValue([])
    prisma.rule.findMany.mockResolvedValue([{ id: 'rule_1', coupleId: 'couple_1' }])
    prisma.couple.findUnique.mockResolvedValue({ id: 'couple_1', status: 'active' })
    prisma.ruleEvent.findMany.mockResolvedValue([])
    prisma.ruleOccurrenceAction.findMany.mockResolvedValue([])
    prisma.pointLedger.findMany.mockResolvedValue([])
    prisma.repairAction.findMany.mockResolvedValue([])
    prisma.safetyAction.findMany.mockResolvedValue([])

    const app = createApp(() => prisma as PrismaClient, {
      JWT_SECRET: TEST_SECRET,
      APP_URL: 'http://localhost:3000',
      WEB_URL: 'http://localhost:3000',
    })
    const token = await signToken('user_1', TEST_SECRET)
    const res = await app.request('/api/v1/users/user_1/export', {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(prisma.membership.findMany).toHaveBeenCalledWith({
      where: { userId: 'user_1', leftAt: null },
      select: { coupleId: true, displayName: true, role: true, joinedAt: true },
    })
    expect(prisma.rule.findMany).toHaveBeenCalledWith({ where: { coupleId: 'couple_1' }, orderBy: { createdAt: 'asc' } })
    expect(prisma.diaryEntry.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { authorUserId: 'user_1' } }))
    const payload = await res.json() as any
    expect(payload.account.id).toBe('user_1')
    expect(payload.account.passwordHash).toBeUndefined()
    expect(payload.ownDiaryEntries[0].id).toBe('own_old')
    expect(payload.couples).toHaveLength(1)
    expect(payload.couples[0].diaryEntries[0].id).toBe('shared')
  })

  it('does not return another user’s export', async () => {
    const prisma = new PrismaClient() as any
    prisma.membership.findMany.mockClear()
    const app = createApp(() => prisma as PrismaClient, {
      JWT_SECRET: TEST_SECRET,
      APP_URL: 'http://localhost:3000',
      WEB_URL: 'http://localhost:3000',
    })
    const token = await signToken('user_2', TEST_SECRET)
    const res = await app.request('/api/v1/users/user_1/export', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(403)
    expect(prisma.membership.findMany).not.toHaveBeenCalled()
  })

  it('does not export former or unrelated couples when no active membership remains', async () => {
    const prisma = new PrismaClient() as any
    prisma.membership.findMany.mockResolvedValue([])
    prisma.diaryEntry.findMany.mockResolvedValue([{ id: 'mine', coupleId: 'former_couple', body: 'My text' }])
    prisma.analyticsEvent.findMany.mockResolvedValue([])
    prisma.couple.findUnique.mockClear()
    prisma.rule.findMany.mockClear()
    const app = createApp(() => prisma as PrismaClient, {
      JWT_SECRET: TEST_SECRET,
      APP_URL: 'http://localhost:3000',
      WEB_URL: 'http://localhost:3000',
    })
    const token = await signToken('user_1', TEST_SECRET)
    const res = await app.request('/api/v1/users/user_1/export', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(200)
    const payload = await res.json() as any
    expect(payload.ownDiaryEntries).toHaveLength(1)
    expect(payload.couples).toEqual([])
    expect(prisma.couple.findUnique).not.toHaveBeenCalled()
    expect(prisma.rule.findMany).not.toHaveBeenCalled()
  })
})

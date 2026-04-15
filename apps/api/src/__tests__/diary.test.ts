import { describe, expect, it } from 'vitest'
import { PrismaClient } from '@fny/db'
import { createApp } from '../app.js'
import { signToken } from '../lib/jwt.js'

const JWT_SECRET = 'test-secret-min-32-chars-long-xxxx'
const TEST_USER_ID = 'user_test_1'
const TEST_PARTNER_ID = 'user_test_2'
const TEST_COUPLE_ID = 'couple_test_1'

async function makeAuthedApp() {
  const prisma = new PrismaClient() as any
  const app = createApp(() => prisma, {
    JWT_SECRET,
    APP_URL: 'http://localhost:3000',
    WEB_URL: 'http://localhost:3000',
  })
  const token = await signToken(TEST_USER_ID, JWT_SECRET)
  return { app, prisma, token }
}

describe('POST /api/v1/couples/:couple_id/diary', () => {
  it('creates a diary entry for an active couple member', async () => {
    const { app, prisma, token } = await makeAuthedApp()

    prisma.membership.findFirst.mockResolvedValue({ coupleId: TEST_COUPLE_ID, userId: TEST_USER_ID, leftAt: null })
    prisma.couple.findUnique.mockResolvedValue({ id: TEST_COUPLE_ID, status: 'active' })
    prisma.diaryEntry.create.mockResolvedValue({
      id: 'diary_1',
      coupleId: TEST_COUPLE_ID,
      authorUserId: TEST_USER_ID,
      body: '今日も一緒に映画を見た。',
      createdAt: new Date('2026-04-14T12:30:00.000Z'),
    })

    const res = await app.request(`/api/v1/couples/${TEST_COUPLE_ID}/diary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ body: '今日も一緒に映画を見た。' }),
    })

    expect(res.status).toBe(201)
    expect(prisma.diaryEntry.create).toHaveBeenCalledWith({
      data: {
        id: expect.any(String),
        coupleId: TEST_COUPLE_ID,
        authorUserId: TEST_USER_ID,
        body: '今日も一緒に映画を見た。',
      },
    })
    const body = await res.json() as any
    expect(body.author_user_id).toBe(TEST_USER_ID)
    expect(body.couple_id).toBe(TEST_COUPLE_ID)
    expect(body.body).toBe('今日も一緒に映画を見た。')
  })

  it('returns COUPLE_CLOSED when the couple is already closed', async () => {
    const { app, prisma, token } = await makeAuthedApp()

    prisma.membership.findFirst.mockResolvedValue({ coupleId: TEST_COUPLE_ID, userId: TEST_USER_ID, leftAt: null })
    prisma.couple.findUnique.mockResolvedValue({ id: TEST_COUPLE_ID, status: 'closed' })

    const res = await app.request(`/api/v1/couples/${TEST_COUPLE_ID}/diary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ body: '閉じたペアには書けない' }),
    })

    expect(res.status).toBe(403)
    expect(await res.json()).toMatchObject({ code: 'COUPLE_CLOSED' })
  })
})

describe('GET /api/v1/couples/:couple_id/diary', () => {
  it('lists the latest diary entries for the couple', async () => {
    const { app, prisma, token } = await makeAuthedApp()

    prisma.membership.findFirst.mockResolvedValue({ coupleId: TEST_COUPLE_ID, userId: TEST_USER_ID, leftAt: null })
    prisma.diaryEntry.findMany.mockResolvedValue([
      {
        id: 'diary_2',
        coupleId: TEST_COUPLE_ID,
        authorUserId: TEST_PARTNER_ID,
        body: '夕飯を作ってくれた',
        createdAt: new Date('2026-04-14T10:00:00.000Z'),
      },
      {
        id: 'diary_1',
        coupleId: TEST_COUPLE_ID,
        authorUserId: TEST_USER_ID,
        body: '週末ゆっくり過ごせた。',
        createdAt: new Date('2026-04-13T13:00:00.000Z'),
      },
    ])

    const res = await app.request(`/api/v1/couples/${TEST_COUPLE_ID}/diary`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    expect(res.status).toBe(200)
    expect(prisma.diaryEntry.findMany).toHaveBeenCalledWith({
      where: { coupleId: TEST_COUPLE_ID },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    const body = await res.json() as any
    expect(body.items).toHaveLength(2)
    expect(body.items[0]).toMatchObject({
      id: 'diary_2',
      author_user_id: TEST_PARTNER_ID,
      body: '夕飯を作ってくれた',
    })
  })
})

describe('PATCH /api/v1/diary/:entry_id', () => {
  it('updates the body for the author of the diary entry', async () => {
    const { app, prisma, token } = await makeAuthedApp()

    prisma.diaryEntry.findUnique.mockResolvedValue({
      id: 'diary_1',
      coupleId: TEST_COUPLE_ID,
      authorUserId: TEST_USER_ID,
      body: 'before',
      createdAt: new Date('2026-04-14T12:30:00.000Z'),
    })
    prisma.membership.findFirst.mockResolvedValue({ coupleId: TEST_COUPLE_ID, userId: TEST_USER_ID, leftAt: null })
    prisma.couple.findUnique.mockResolvedValue({ id: TEST_COUPLE_ID, status: 'active' })
    prisma.diaryEntry.update.mockResolvedValue({
      id: 'diary_1',
      coupleId: TEST_COUPLE_ID,
      authorUserId: TEST_USER_ID,
      body: 'after',
      createdAt: new Date('2026-04-14T12:30:00.000Z'),
    })

    const res = await app.request('/api/v1/diary/diary_1', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ body: 'after' }),
    })

    expect(res.status).toBe(200)
    expect(prisma.diaryEntry.update).toHaveBeenCalledWith({
      where: { id: 'diary_1' },
      data: { body: 'after' },
    })
    expect(await res.json()).toMatchObject({ id: 'diary_1', body: 'after' })
  })

  it('rejects updates from a non-author member', async () => {
    const { app, prisma, token } = await makeAuthedApp()

    prisma.diaryEntry.findUnique.mockResolvedValue({
      id: 'diary_1',
      coupleId: TEST_COUPLE_ID,
      authorUserId: TEST_PARTNER_ID,
      body: 'before',
      createdAt: new Date('2026-04-14T12:30:00.000Z'),
    })
    prisma.membership.findFirst.mockResolvedValue({ coupleId: TEST_COUPLE_ID, userId: TEST_USER_ID, leftAt: null })

    const res = await app.request('/api/v1/diary/diary_1', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ body: 'after' }),
    })

    expect(res.status).toBe(403)
    expect(await res.json()).toMatchObject({ code: 'FORBIDDEN' })
  })
})

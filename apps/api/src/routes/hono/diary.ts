import { Hono } from 'hono'
import { z } from 'zod'
import { Variables } from '../../app.js'
import { generateId } from '../../lib/id.js'
import { makeError } from '../../lib/error-codes.js'

const createSchema = z.object({
  body: z.string().min(1).max(2000),
})

function toDiaryEntry(entry: {
  id: string
  coupleId: string
  authorUserId: string
  body: string
  createdAt: Date
}) {
  return {
    id: entry.id,
    couple_id: entry.coupleId,
    author_user_id: entry.authorUserId,
    body: entry.body,
    created_at: entry.createdAt.toISOString(),
  }
}

export function diaryRoutes(app: Hono<{ Variables: Variables }>) {
  app.post('/couples/:couple_id/diary', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const coupleId = c.req.param('couple_id')

    const membership = await prisma.membership.findFirst({ where: { coupleId, userId, leftAt: null } })
    if (!membership) return c.json(makeError('FORBIDDEN'), 403)

    const couple = await prisma.couple.findUnique({ where: { id: coupleId } })
    if (!couple || couple.status === 'closed') return c.json(makeError('COUPLE_CLOSED'), 403)
    if (couple.status === 'paused') return c.json(makeError('COUPLE_LOCKED'), 423)

    const body = createSchema.parse(await c.req.json().catch(() => ({})))
    const entry = await prisma.diaryEntry.create({
      data: {
        id: generateId(),
        coupleId,
        authorUserId: userId,
        body: body.body,
      },
    })

    return c.json(toDiaryEntry(entry), 201)
  })

  app.get('/couples/:couple_id/diary', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const coupleId = c.req.param('couple_id')

    const membership = await prisma.membership.findFirst({ where: { coupleId, userId, leftAt: null } })
    if (!membership) return c.json(makeError('FORBIDDEN'), 403)

    const entries = await prisma.diaryEntry.findMany({
      where: { coupleId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return c.json({
      items: entries.map((entry) => toDiaryEntry(entry)),
    })
  })

  app.patch('/diary/:entry_id', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const entryId = c.req.param('entry_id')

    const entry = await prisma.diaryEntry.findUnique({ where: { id: entryId } })
    if (!entry) return c.json(makeError('NOT_FOUND'), 404)

    const membership = await prisma.membership.findFirst({
      where: { coupleId: entry.coupleId, userId, leftAt: null },
    })
    if (!membership) return c.json(makeError('FORBIDDEN'), 403)
    if (entry.authorUserId !== userId) return c.json(makeError('FORBIDDEN'), 403)

    const couple = await prisma.couple.findUnique({ where: { id: entry.coupleId } })
    if (!couple || couple.status === 'closed') return c.json(makeError('COUPLE_CLOSED'), 403)
    if (couple.status === 'paused') return c.json(makeError('COUPLE_LOCKED'), 423)

    const body = createSchema.parse(await c.req.json().catch(() => ({})))
    const updated = await prisma.diaryEntry.update({
      where: { id: entryId },
      data: { body: body.body },
    })

    return c.json(toDiaryEntry(updated))
  })
}

import { Hono } from 'hono'
import { Variables } from '../../app.js'
import { generateId } from '../../lib/id.js'
import { makeError } from '../../lib/error-codes.js'
import { trackEvent } from '../../services/analytics.js'

export function safetyRoutes(app: Hono<{ Variables: Variables }>) {
  app.post('/couples/:couple_id/safety/pause', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const coupleId = c.req.param('couple_id')

    const couple = await prisma.couple.findUnique({ where: { id: coupleId } })
    if (!couple) return c.json(makeError('NOT_FOUND'), 404)
    const membership = await prisma.membership.findFirst({ where: { coupleId, userId, leftAt: null } })
    if (!membership) return c.json(makeError('FORBIDDEN'), 403)
    if (couple.status === 'closed') return c.json(makeError('COUPLE_CLOSED'), 403)

    await prisma.$transaction(async (tx) => {
      await tx.couple.update({ where: { id: coupleId }, data: { status: 'paused' } })
      await tx.safetyAction.create({ data: { id: generateId(), coupleId, actorUserId: userId, actionType: 'pause' } })
    })

    await trackEvent(prisma, { eventName: 'safety_pause_enabled', userId, coupleId })
    return c.json({ status: 'paused' })
  })

  app.post('/couples/:couple_id/safety/unpause', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const coupleId = c.req.param('couple_id')

    const couple = await prisma.couple.findUnique({ where: { id: coupleId } })
    if (!couple) return c.json(makeError('NOT_FOUND'), 404)
    const membership = await prisma.membership.findFirst({ where: { coupleId, userId, leftAt: null } })
    if (!membership) return c.json(makeError('FORBIDDEN'), 403)
    if (couple.status === 'closed') return c.json(makeError('COUPLE_CLOSED'), 403)

    await prisma.$transaction(async (tx) => {
      await tx.couple.update({ where: { id: coupleId }, data: { status: 'active' } })
      await tx.safetyAction.create({ data: { id: generateId(), coupleId, actorUserId: userId, actionType: 'unpause' } })
    })

    await trackEvent(prisma, { eventName: 'safety_pause_disabled', userId, coupleId })
    return c.json({ status: 'active' })
  })

  app.post('/support/help-link-clicked', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const raw = await c.req.json().catch(() => ({}))
    const coupleId = (raw as { couple_id?: string }).couple_id

    if (coupleId) {
      await prisma.safetyAction.create({
        data: { id: generateId(), coupleId, actorUserId: userId, actionType: 'help_click' },
      }).catch(() => {})
    }

    await trackEvent(prisma, { eventName: 'data_deletion_requested', userId, coupleId: coupleId ?? null })
    return new Response(null, { status: 204 })
  })
}

import { Hono } from 'hono'
import { z } from 'zod'
import { PrismaClient } from '@fny/db'
import { Variables } from '../../app.js'
import { generateId } from '../../lib/id.js'
import { makeError } from '../../lib/error-codes.js'
import { trackEvent } from '../../services/analytics.js'
import { getWeekKey } from '../../lib/week-key.js'

const createSchema = z.object({
  target_user_id: z.string().min(1),
  report_type: z.enum(['self', 'partner']),
  note: z.string().max(200).optional(),
})

function toEvent(e: { id: string; ruleId: string; status: string; reportType: string; note: string | null; createdAt: Date }) {
  return { id: e.id, rule_id: e.ruleId, status: e.status, report_type: e.reportType, note: e.note, created_at: e.createdAt.toISOString() }
}

type PointKind = 'thank_you' | 'nobishiro'

function modeToPointKind(mode: string): PointKind {
  return mode === 'adhoc' ? 'thank_you' : 'nobishiro'
}

async function addPointLedger(prisma: PrismaClient, eventId: string, coupleId: string, userId: string, points: number, coupleStatus: string, pointKind: PointKind) {
  if (coupleStatus === 'paused' || coupleStatus === 'closed') return
  try {
    await prisma.pointLedger.create({
      data: { id: generateId(), coupleId, userId, sourceEventId: eventId, points, pointKind, weekKey: getWeekKey() },
    })
    await checkThreshold(prisma, coupleId, userId, eventId, pointKind)
  } catch (err: unknown) {
    if ((err as { code?: string })?.code !== 'P2002') throw err
  }
}

async function checkThreshold(prisma: PrismaClient, coupleId: string, userId: string, triggerEventId: string, pointKind: PointKind) {
  const weekKey = getWeekKey()
  const total = (await prisma.pointLedger.aggregate({ where: { coupleId, userId, weekKey, pointKind }, _sum: { points: true } }))._sum.points ?? 0
  const event = await prisma.ruleEvent.findUnique({ where: { id: triggerEventId }, include: { rule: true } })
  if (!event) return
  const threshold = pointKind === 'thank_you' ? event.rule.thankYouThreshold : event.rule.nobishiroThreshold
  if (total >= threshold) {
    await trackEvent(prisma, { eventName: 'threshold_reached', userId, coupleId, payload: { week_key: weekKey, total_points: total, rule_id: event.ruleId, point_kind: pointKind } })
  }
}

export function eventRoutes(app: Hono<{ Variables: Variables }>) {
  app.post('/rules/:rule_id/events', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const ruleId = c.req.param('rule_id')

    const rule = await prisma.rule.findUnique({ where: { id: ruleId } })
    if (!rule || rule.archivedAt) return c.json(makeError('NOT_FOUND'), 404)

    const couple = await prisma.couple.findUnique({ where: { id: rule.coupleId } })
    if (!couple) return c.json(makeError('NOT_FOUND'), 404)
    if (couple.status === 'closed') return c.json(makeError('COUPLE_CLOSED'), 403)
    if (couple.status === 'paused') return c.json(makeError('COUPLE_LOCKED'), 423)

    const membership = await prisma.membership.findFirst({ where: { coupleId: rule.coupleId, userId, leftAt: null } })
    if (!membership) return c.json(makeError('FORBIDDEN'), 403)

    const body = createSchema.parse(await c.req.json())
    const isSelf = body.report_type === 'self'
    const now = new Date()
    const eventId = generateId()

    const ruleEvent = await prisma.ruleEvent.create({
      data: {
        id: eventId, ruleId, coupleId: rule.coupleId,
        reporterUserId: userId, targetUserId: body.target_user_id,
        reportType: body.report_type, note: body.note ?? null,
        status: isSelf ? 'approved' : 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        ...(isSelf && { approvedBy: userId, approvedAt: now }),
      },
    })

    const pointKind = modeToPointKind(rule.mode)
    if (isSelf) await addPointLedger(prisma, eventId, rule.coupleId, body.target_user_id, rule.pointValue, couple.status, pointKind)

    await trackEvent(prisma, { eventName: isSelf ? 'event_reported_self' : 'event_reported_partner', userId, coupleId: rule.coupleId, payload: { event_id: eventId, rule_id: ruleId } })
    return c.json(toEvent(ruleEvent), 201)
  })

  app.get('/couples/:couple_id/events', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const coupleId = c.req.param('couple_id')
    const status = c.req.query('status')

    const membership = await prisma.membership.findFirst({ where: { coupleId, userId, leftAt: null } })
    if (!membership) return c.json(makeError('FORBIDDEN'), 403)

    const events = await prisma.ruleEvent.findMany({
      where: { coupleId, ...(status && { status: status as 'pending' | 'approved' | 'rejected' | 'expired' }) },
      orderBy: { createdAt: 'desc' },
    })
    return c.json({ items: events.map(toEvent) })
  })

  app.post('/events/:event_id/approve', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const eventId = c.req.param('event_id')

    const ruleEvent = await prisma.ruleEvent.findUnique({ where: { id: eventId } })
    if (!ruleEvent) return c.json(makeError('NOT_FOUND'), 404)

    const membership = await prisma.membership.findFirst({ where: { coupleId: ruleEvent.coupleId, userId, leftAt: null } })
    if (!membership) return c.json(makeError('FORBIDDEN'), 403)
    if (ruleEvent.status !== 'pending') return c.json(makeError('DUPLICATE_ACTION'), 409)
    if (ruleEvent.expiresAt < new Date()) {
      await prisma.ruleEvent.update({ where: { id: eventId }, data: { status: 'expired' } })
      return c.json(makeError('DUPLICATE_ACTION'), 409)
    }

    const couple = await prisma.couple.findUnique({ where: { id: ruleEvent.coupleId } })
    if (couple?.status === 'paused') return c.json(makeError('COUPLE_LOCKED'), 423)
    if (couple?.status === 'closed') return c.json(makeError('COUPLE_CLOSED'), 403)

    const updated = await prisma.ruleEvent.update({ where: { id: eventId }, data: { status: 'approved', approvedBy: userId, approvedAt: new Date() } })
    const rule = await prisma.rule.findUnique({ where: { id: ruleEvent.ruleId } })
    if (rule && couple) await addPointLedger(prisma, eventId, ruleEvent.coupleId, ruleEvent.targetUserId, rule.pointValue, couple.status, modeToPointKind(rule.mode))

    await trackEvent(prisma, { eventName: 'event_approved', userId, coupleId: ruleEvent.coupleId, payload: { event_id: eventId } })
    return c.json(toEvent(updated))
  })

  app.post('/events/:event_id/reject', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const eventId = c.req.param('event_id')

    const ruleEvent = await prisma.ruleEvent.findUnique({ where: { id: eventId } })
    if (!ruleEvent) return c.json(makeError('NOT_FOUND'), 404)

    const membership = await prisma.membership.findFirst({ where: { coupleId: ruleEvent.coupleId, userId, leftAt: null } })
    if (!membership) return c.json(makeError('FORBIDDEN'), 403)
    if (ruleEvent.status !== 'pending') return c.json(makeError('DUPLICATE_ACTION'), 409)

    const updated = await prisma.ruleEvent.update({ where: { id: eventId }, data: { status: 'rejected', rejectedBy: userId, rejectedAt: new Date() } })
    await trackEvent(prisma, { eventName: 'event_rejected', userId, coupleId: ruleEvent.coupleId, payload: { event_id: eventId } })
    return c.json(toEvent(updated))
  })
}

import { Hono } from 'hono'
import { z } from 'zod'
import { PrismaClient } from '@fny/db'
import { Variables } from '../../app.js'
import { generateId } from '../../lib/id.js'
import { makeError } from '../../lib/error-codes.js'
import { fetchRuleByIdCompat } from '../../lib/rule-compat.js'
import { trackEvent } from '../../services/analytics.js'
import { getWeekKey } from '../../lib/week-key.js'

const createSchema = z.object({
  note: z.string().max(200).optional(),
  occurred_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

function formatDateOnlyUTC(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseOccurredOn(dateOnly: string): Date {
  const [year, month, day] = dateOnly.split('-').map((value) => Number(value))
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0))
}

function toOccurrenceNote(eventId: string): string {
  return `event:${eventId}`
}

function toEvent(
  e: { id: string; ruleId: string; status: string; reportType: string; note: string | null; createdAt: Date },
  occurredOn?: Date | null
) {
  return {
    id: e.id,
    rule_id: e.ruleId,
    status: e.status,
    report_type: e.reportType,
    note: e.note,
    created_at: e.createdAt.toISOString(),
    occurred_on: occurredOn ? formatDateOnlyUTC(occurredOn) : null,
  }
}

type PointKind = 'thank_you' | 'nobishiro'

function modeToPointKind(mode: string): PointKind {
  return mode === 'adhoc' ? 'thank_you' : 'nobishiro'
}

async function addPointLedger(
  prisma: PrismaClient,
  eventId: string,
  coupleId: string,
  userId: string,
  points: number,
  coupleStatus: string,
  pointKind: PointKind,
  referenceDate: Date
) {
  if (coupleStatus === 'paused' || coupleStatus === 'closed') return
  try {
    await prisma.pointLedger.create({
      data: { id: generateId(), coupleId, userId, sourceEventId: eventId, points, pointKind, weekKey: getWeekKey(referenceDate) },
    })
    await checkThreshold(prisma, coupleId, userId, eventId, pointKind, referenceDate)
  } catch (err: unknown) {
    // P2002: unique constraint violation (重複付与を無視)
    if ((err as { code?: string })?.code !== 'P2002') throw err
  }
}

async function resolveTargetUserIds(prisma: PrismaClient, rule: { assignee: string; creatorUserId: string | null; coupleId: string }): Promise<string[]> {
  const members = await prisma.membership.findMany({ where: { coupleId: rule.coupleId, leftAt: null } })
  const creatorId = rule.creatorUserId
  const partnerOfCreator = members.find((m) => m.userId !== creatorId)?.userId ?? null
  if (rule.assignee === 'self' && creatorId) return [creatorId]
  if (rule.assignee === 'partner' && partnerOfCreator) return [partnerOfCreator]
  // 'both' またはcreatorIdが不明
  return members.map((m) => m.userId)
}

async function checkThreshold(
  prisma: PrismaClient,
  coupleId: string,
  userId: string,
  triggerEventId: string,
  pointKind: PointKind,
  referenceDate: Date
) {
  const weekKey = getWeekKey(referenceDate)
  const total = (await prisma.pointLedger.aggregate({ where: { coupleId, userId, weekKey, pointKind }, _sum: { points: true } }))._sum.points ?? 0
  const event = await prisma.ruleEvent.findUnique({ where: { id: triggerEventId }, select: { ruleId: true } })
  if (!event) return
  const rule = await fetchRuleByIdCompat(prisma, event.ruleId)
  if (!rule) return
  const threshold = pointKind === 'thank_you' ? rule.thankYouThreshold : rule.nobishiroThreshold
  if (total >= threshold) {
    await trackEvent(prisma, { eventName: 'threshold_reached', userId, coupleId, payload: { week_key: weekKey, total_points: total, rule_id: event.ruleId, point_kind: pointKind } })
  }
}

export function eventRoutes(app: Hono<{ Variables: Variables }>) {
  app.post('/rules/:rule_id/events', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const ruleId = c.req.param('rule_id')

    const rule = await fetchRuleByIdCompat(prisma, ruleId)
    if (!rule || rule.archivedAt) return c.json(makeError('NOT_FOUND'), 404)

    const couple = await prisma.couple.findUnique({ where: { id: rule.coupleId } })
    if (!couple) return c.json(makeError('NOT_FOUND'), 404)
    if (couple.status === 'closed') return c.json(makeError('COUPLE_CLOSED'), 403)
    if (couple.status === 'paused') return c.json(makeError('COUPLE_LOCKED'), 423)

    const membership = await prisma.membership.findFirst({ where: { coupleId: rule.coupleId, userId, leftAt: null } })
    if (!membership) return c.json(makeError('FORBIDDEN'), 403)

    const body = createSchema.parse(await c.req.json().catch(() => ({})))
    const occurredOn = body.occurred_on ? parseOccurredOn(body.occurred_on) : null

    // 担当者（ポイント対象）を解決
    const targetUserIds = await resolveTargetUserIds(prisma, rule)
    const recorder = rule.recorder

    // 自動承認かどうか：recorderが設定した人が押しているか判断
    const isAssignee = targetUserIds.includes(userId)
    const autoApprove =
      (recorder === 'self' && isAssignee) ||
      (recorder === 'partner' && !isAssignee)

    const reportType = autoApprove ? 'self' : 'partner'
    const now = new Date()
    const eventId = generateId()
    const primaryTarget = targetUserIds[0] ?? userId
    const pointKind = modeToPointKind(rule.mode)
    const ledgerDate = occurredOn ?? now
    const occurrenceNote = toOccurrenceNote(eventId)

    const createRuleEvent = prisma.ruleEvent.create({
      data: {
        id: eventId, ruleId, coupleId: rule.coupleId,
        reporterUserId: userId, targetUserId: primaryTarget,
        reportType, note: body.note ?? null,
        status: autoApprove ? 'approved' : 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        ...(autoApprove && { approvedBy: userId, approvedAt: now }),
      },
    })
    const operations = [
      createRuleEvent,
      ...(occurredOn
        ? [prisma.ruleOccurrenceAction.create({
            data: {
              id: generateId(),
              ruleId,
              occurrenceDate: occurredOn,
              actionType: 'recorded',
              note: occurrenceNote,
            },
          })]
        : []),
      ...(autoApprove
        ? targetUserIds.map((targetId) =>
            prisma.pointLedger.create({
              data: {
                id: generateId(),
                coupleId: rule.coupleId,
                userId: targetId,
                sourceEventId: eventId,
                points: rule.pointValue,
                pointKind,
                weekKey: getWeekKey(ledgerDate),
              },
            })
          )
        : []),
    ]
    let ruleEvent: Awaited<typeof createRuleEvent>
    try {
      ;[ruleEvent] = await prisma.$transaction(operations) as [Awaited<typeof createRuleEvent>, ...unknown[]]
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === 'P2002') {
        return c.json(makeError('DUPLICATE_ACTION'), 409)
      }
      throw err
    }

    if (autoApprove) {
      for (const targetId of targetUserIds) {
        await checkThreshold(prisma, rule.coupleId, targetId, eventId, pointKind, ledgerDate)
      }
    }

    await trackEvent(prisma, { eventName: autoApprove ? 'event_reported_self' : 'event_reported_partner', userId, coupleId: rule.coupleId, payload: { event_id: eventId, rule_id: ruleId } })
    return c.json(toEvent(ruleEvent, occurredOn), 201)
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
    const ruleIds = Array.from(new Set(events.map((event) => event.ruleId)))
    const occurrenceActions = ruleIds.length > 0
      ? await prisma.ruleOccurrenceAction.findMany({
          where: { ruleId: { in: ruleIds }, actionType: 'recorded' },
        })
      : []
    const occurredOnMap = new Map<string, Date>()
    for (const action of occurrenceActions) {
      if (typeof action.note === 'string' && action.note.startsWith('event:')) {
        occurredOnMap.set(action.note.slice(6), action.occurrenceDate)
      }
    }
    return c.json({ items: events.map((event) => toEvent(event, occurredOnMap.get(event.id) ?? null)) })
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
      await prisma.ruleOccurrenceAction.deleteMany({ where: { note: toOccurrenceNote(eventId) } })
      return c.json(makeError('DUPLICATE_ACTION'), 409)
    }

    const couple = await prisma.couple.findUnique({ where: { id: ruleEvent.coupleId } })
    if (couple?.status === 'paused') return c.json(makeError('COUPLE_LOCKED'), 423)
    if (couple?.status === 'closed') return c.json(makeError('COUPLE_CLOSED'), 403)

    const rule = await fetchRuleByIdCompat(prisma, ruleEvent.ruleId)
    const targetUserIds = rule ? await resolveTargetUserIds(prisma, rule) : [ruleEvent.targetUserId]
    const pointKind = rule ? modeToPointKind(rule.mode) : null
    const occurrenceActions = await prisma.ruleOccurrenceAction.findMany({ where: { note: toOccurrenceNote(eventId) } })
    const occurredOn = occurrenceActions[0]?.occurrenceDate ?? null
    const ledgerDate = occurredOn ?? ruleEvent.createdAt
    const updateRuleEvent = prisma.ruleEvent.update({
      where: { id: eventId },
      data: { status: 'approved', approvedBy: userId, approvedAt: new Date() },
    })
    const operations = [
      updateRuleEvent,
      ...(rule && couple && pointKind
        ? targetUserIds.map((targetId) =>
            prisma.pointLedger.create({
              data: {
                id: generateId(),
                coupleId: ruleEvent.coupleId,
                userId: targetId,
                sourceEventId: eventId,
                points: rule.pointValue,
                pointKind,
                weekKey: getWeekKey(ledgerDate),
              },
            })
          )
        : []),
    ]
    const [updated] = await prisma.$transaction(operations) as [Awaited<typeof updateRuleEvent>, ...unknown[]]

    if (rule && couple && pointKind) {
      for (const targetId of targetUserIds) {
        await checkThreshold(prisma, ruleEvent.coupleId, targetId, eventId, pointKind, ledgerDate)
      }
    }

    await trackEvent(prisma, { eventName: 'event_approved', userId, coupleId: ruleEvent.coupleId, payload: { event_id: eventId } })
    return c.json(toEvent(updated, occurredOn))
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
    await prisma.ruleOccurrenceAction.deleteMany({ where: { note: toOccurrenceNote(eventId) } })
    await trackEvent(prisma, { eventName: 'event_rejected', userId, coupleId: ruleEvent.coupleId, payload: { event_id: eventId } })
    return c.json(toEvent(updated))
  })
}

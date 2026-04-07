import { Hono } from 'hono'
import { Variables } from '../../app.js'
import { makeError } from '../../lib/error-codes.js'
import { fetchRulesCompat } from '../../lib/rule-compat.js'
import { getWeekKey, weekKeyToRange } from '../../lib/week-key.js'

function parseDaysOfWeek(days?: string | null): number[] | null {
  if (!days) return null
  try {
    const parsed = JSON.parse(days)
    return Array.isArray(parsed)
      ? parsed.filter((value) => Number.isInteger(value) && value >= 0 && value <= 6)
      : null
  } catch {
    return null
  }
}

export function summaryRoutes(app: Hono<{ Variables: Variables }>) {
  app.get('/couples/:couple_id/home', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const coupleId = c.req.param('couple_id')

    const membership = await prisma.membership.findFirst({ where: { coupleId, userId, leftAt: null } })
    if (!membership) return c.json(makeError('FORBIDDEN'), 403)

    const weekKey = getWeekKey()
    const { start, end } = weekKeyToRange(weekKey)

    // 自分とパートナーのメンバー情報を取得
    const myMembership = await prisma.membership.findFirst({
      where: { coupleId, userId, leftAt: null },
    })
    const partnerMembership = await prisma.membership.findFirst({
      where: { coupleId, leftAt: null, userId: { not: userId } },
    })
    const partnerId = partnerMembership?.userId

    const [myThankYou, myNobishiro, partnerThankYou, partnerNobishiro, pendingEvents, openRepairs, rules, approvedEvents] = await Promise.all([
      prisma.pointLedger.aggregate({ where: { coupleId, userId, weekKey, pointKind: 'thank_you' }, _sum: { points: true } }),
      prisma.pointLedger.aggregate({ where: { coupleId, userId, weekKey, pointKind: 'nobishiro' }, _sum: { points: true } }),
      partnerId
        ? prisma.pointLedger.aggregate({ where: { coupleId, userId: partnerId, weekKey, pointKind: 'thank_you' }, _sum: { points: true } })
        : Promise.resolve({ _sum: { points: null } }),
      partnerId
        ? prisma.pointLedger.aggregate({ where: { coupleId, userId: partnerId, weekKey, pointKind: 'nobishiro' }, _sum: { points: true } })
        : Promise.resolve({ _sum: { points: null } }),
      prisma.ruleEvent.count({ where: { coupleId, status: 'pending' } }),
      prisma.repairAction.count({ where: { coupleId, status: 'open' } }),
      fetchRulesCompat(prisma, coupleId),
      prisma.ruleEvent.findMany({
        where: { coupleId, status: 'approved', createdAt: { gte: start, lte: end } },
        select: { ruleId: true },
      }),
    ])

    const approvedCountByRule = approvedEvents.reduce<Record<string, number>>((acc, event) => {
      acc[event.ruleId] = (acc[event.ruleId] ?? 0) + 1
      return acc
    }, {})

    return c.json({
      week_key: weekKey,
      my_name: myMembership?.displayName ?? 'わたし',
      partner_name: partnerMembership?.displayName ?? 'パートナー',
      my_thank_you: myThankYou._sum.points ?? 0,
      my_nobishiro: myNobishiro._sum.points ?? 0,
      partner_thank_you: partnerThankYou._sum.points ?? 0,
      partner_nobishiro: partnerNobishiro._sum.points ?? 0,
      pending_events: pendingEvents,
      open_repairs: openRepairs,
      rules: rules.map(r => ({
        rule_id: r.id,
        title: r.title,
        mode: r.mode,
        category: r.category ?? null,
        start_date: r.startDate ? r.startDate.toISOString().slice(0, 10) : null,
        recurrence_type: r.recurrenceType ?? null,
        recurrence_interval: r.recurrenceInterval ?? 1,
        days_of_week: parseDaysOfWeek(r.daysOfWeek),
        day_of_month: r.dayOfMonth ?? null,
        time_of_day: r.timeOfDay ?? null,
        count: approvedCountByRule[r.id] ?? 0,
        point_value: r.pointValue,
        thank_you_threshold: r.thankYouThreshold,
        nobishiro_threshold: r.nobishiroThreshold,
      })),
    })
  })

  app.get('/couples/:couple_id/weekly-summary', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const coupleId = c.req.param('couple_id')
    const week = c.req.query('week')

    const membership = await prisma.membership.findFirst({ where: { coupleId, userId, leftAt: null } })
    if (!membership) return c.json(makeError('FORBIDDEN'), 403)

    const weekKey = week ?? getWeekKey()
    const { start, end } = weekKeyToRange(weekKey)

    const [thankYouPoints, nobishiroPoints, rules, repairActions, ruleEvents] = await Promise.all([
      prisma.pointLedger.aggregate({ where: { coupleId, weekKey, pointKind: 'thank_you' }, _sum: { points: true } }),
      prisma.pointLedger.aggregate({ where: { coupleId, weekKey, pointKind: 'nobishiro' }, _sum: { points: true } }),
      fetchRulesCompat(prisma, coupleId, { includeArchived: true }),
      prisma.repairAction.findMany({ where: { coupleId, createdAt: { gte: start, lte: end } } }),
      prisma.ruleEvent.findMany({
        where: { coupleId, createdAt: { gte: start, lte: end } },
        select: { ruleId: true, status: true, reporterUserId: true },
      }),
    ])

    const eventsByRule = ruleEvents.reduce<Record<string, typeof ruleEvents>>((acc, event) => {
      if (!acc[event.ruleId]) acc[event.ruleId] = []
      acc[event.ruleId].push(event)
      return acc
    }, {})

    const allEvents = ruleEvents
    const approvedCount = allEvents.filter(e => e.status === 'approved').length
    const settledCount = allEvents.filter(e => ['approved', 'rejected', 'expired'].includes(e.status)).length
    const completedRepairs = repairActions.filter(r => r.status === 'completed').length

    // 偏りアラート: 承認済みイベントが1人のみ記録していないか
    const reporterIds = new Set(allEvents.filter(e => e.status === 'approved').map(e => e.reporterUserId))
    const biasAlert = approvedCount >= 3 && reporterIds.size === 1

    return c.json({
      week_key: weekKey,
      thank_you_total: thankYouPoints._sum.points ?? 0,
      nobishiro_total: nobishiroPoints._sum.points ?? 0,
      approval_rate: settledCount > 0 ? approvedCount / settledCount : 0,
      repair_completion_rate: repairActions.length > 0 ? completedRepairs / repairActions.length : 0,
      bias_alert: biasAlert,
      by_rule: rules.map(r => ({
        rule_id: r.id, title: r.title, mode: r.mode,
        approved_count: (eventsByRule[r.id] ?? []).filter(e => e.status === 'approved').length,
        rejected_count: (eventsByRule[r.id] ?? []).filter(e => e.status === 'rejected').length,
        expired_count: (eventsByRule[r.id] ?? []).filter(e => e.status === 'expired').length,
      })),
    })
  })
}

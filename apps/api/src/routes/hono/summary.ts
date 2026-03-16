import { Hono } from 'hono'
import { Variables } from '../../app.js'
import { makeError } from '../../lib/error-codes.js'
import { getWeekKey, weekKeyToRange } from '../../lib/week-key.js'

export function summaryRoutes(app: Hono<{ Variables: Variables }>) {
  app.get('/couples/:couple_id/home', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const coupleId = c.req.param('couple_id')

    const membership = await prisma.membership.findFirst({ where: { coupleId, userId, leftAt: null } })
    if (!membership) return c.json(makeError('FORBIDDEN'), 403)

    const weekKey = getWeekKey()
    const { start, end } = weekKeyToRange(weekKey)

    const [thankYouPoints, nobishiroPoints, pendingEvents, openRepairs, rules] = await Promise.all([
      prisma.pointLedger.aggregate({ where: { coupleId, weekKey, pointKind: 'thank_you' }, _sum: { points: true } }),
      prisma.pointLedger.aggregate({ where: { coupleId, weekKey, pointKind: 'nobishiro' }, _sum: { points: true } }),
      prisma.ruleEvent.count({ where: { coupleId, status: 'pending' } }),
      prisma.repairAction.count({ where: { coupleId, status: 'open' } }),
      prisma.rule.findMany({ where: { coupleId, archivedAt: null }, include: { events: { where: { status: 'approved', createdAt: { gte: start, lte: end } } } } }),
    ])

    return c.json({
      week_key: weekKey,
      thank_you_total: thankYouPoints._sum.points ?? 0,
      nobishiro_total: nobishiroPoints._sum.points ?? 0,
      pending_events: pendingEvents,
      open_repairs: openRepairs,
      rules: rules.map(r => ({ rule_id: r.id, title: r.title, mode: r.mode, count: r.events.length, thank_you_threshold: r.thankYouThreshold, nobishiro_threshold: r.nobishiroThreshold })),
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

    const [thankYouPoints, nobishiroPoints, rules, repairActions] = await Promise.all([
      prisma.pointLedger.aggregate({ where: { coupleId, weekKey, pointKind: 'thank_you' }, _sum: { points: true } }),
      prisma.pointLedger.aggregate({ where: { coupleId, weekKey, pointKind: 'nobishiro' }, _sum: { points: true } }),
      prisma.rule.findMany({ where: { coupleId }, include: { events: { where: { createdAt: { gte: start, lte: end } } } } }),
      prisma.repairAction.findMany({ where: { coupleId, createdAt: { gte: start, lte: end } } }),
    ])

    const allEvents = rules.flatMap(r => r.events)
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
        approved_count: r.events.filter(e => e.status === 'approved').length,
        rejected_count: r.events.filter(e => e.status === 'rejected').length,
        expired_count: r.events.filter(e => e.status === 'expired').length,
      })),
    })
  })
}

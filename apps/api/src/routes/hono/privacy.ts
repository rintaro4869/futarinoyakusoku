import { Hono } from 'hono'
import { Variables } from '../../app.js'
import { makeError } from '../../lib/error-codes.js'
import { trackEvent } from '../../services/analytics.js'

function uniqueIds(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}

export function privacyRoutes(app: Hono<{ Variables: Variables }>) {
  app.get('/users/:user_id/export', async (c) => {
    const userId = c.get('userId')
    if (userId !== c.req.param('user_id')) return c.json(makeError('FORBIDDEN'), 403)

    const prisma = c.get('prisma')
    const user = c.get('currentUser')
    const memberships = await prisma.membership.findMany({
      where: { userId, leftAt: null },
      select: { coupleId: true, displayName: true, role: true, joinedAt: true },
    })
    const coupleIds = uniqueIds(memberships.map((membership) => membership.coupleId))

    const [ownDiaryEntries, ownAnalyticsEvents] = await Promise.all([
      prisma.diaryEntry.findMany({
        where: { authorUserId: userId },
        orderBy: { createdAt: 'asc' },
        select: { id: true, coupleId: true, body: true, createdAt: true },
      }),
      prisma.analyticsEvent.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        select: { eventName: true, payload: true, createdAt: true },
      }),
    ])

    const couples: Record<string, unknown>[] = []
    for (const coupleId of coupleIds) {
      const rules = await prisma.rule.findMany({ where: { coupleId }, orderBy: { createdAt: 'asc' } })
      const ruleIds = rules.map((rule) => rule.id)
      const [couple, diaryEntries, ruleEvents, occurrenceActions, pointLedger, repairActions, safetyActions] = await Promise.all([
        prisma.couple.findUnique({ where: { id: coupleId }, select: { id: true, status: true, createdAt: true, closedAt: true } }),
        prisma.diaryEntry.findMany({ where: { coupleId }, orderBy: { createdAt: 'asc' } }),
        prisma.ruleEvent.findMany({ where: { coupleId }, orderBy: { createdAt: 'asc' } }),
        ruleIds.length
          ? prisma.ruleOccurrenceAction.findMany({ where: { ruleId: { in: ruleIds } }, orderBy: { createdAt: 'asc' } })
          : Promise.resolve([]),
        prisma.pointLedger.findMany({ where: { coupleId }, orderBy: { createdAt: 'asc' } }),
        prisma.repairAction.findMany({ where: { coupleId }, orderBy: { createdAt: 'asc' } }),
        prisma.safetyAction.findMany({ where: { coupleId }, orderBy: { createdAt: 'asc' } }),
      ])
      if (!couple) continue
      couples.push({ couple, rules, diaryEntries, ruleEvents, occurrenceActions, pointLedger, repairActions, safetyActions })
    }

    c.header('Cache-Control', 'no-store')
    c.header('Content-Disposition', 'attachment; filename="pairlog-export.json"')
    return c.json({
      format_version: 1,
      exported_at: new Date().toISOString(),
      scope: 'Own account and authored diary entries; shared records for couples with an active membership at export time.',
      account: {
        id: user.id,
        email: user.email,
        locale: user.locale,
        timezone: user.timezone,
        createdAt: user.createdAt,
      },
      memberships,
      ownDiaryEntries,
      ownAnalyticsEvents,
      couples,
    })
  })

  app.delete('/users/:user_id/data', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const targetUserId = c.req.param('user_id')

    if (userId !== targetUserId) return c.json(makeError('FORBIDDEN'), 403)

    const user = await prisma.user.findUnique({ where: { id: targetUserId } })
    if (!user) return c.json(makeError('NOT_FOUND'), 404)

    const memberships = await prisma.membership.findMany({
      where: { userId: targetUserId },
      select: { coupleId: true },
    })
    const coupleIds = uniqueIds(memberships.map((membership) => membership.coupleId))

    const rules = coupleIds.length
      ? await prisma.rule.findMany({
          where: { coupleId: { in: coupleIds } },
          select: { id: true },
        })
      : []
    const ruleIds = uniqueIds(rules.map((rule) => rule.id))

    const relatedEvents = await prisma.ruleEvent.findMany({
      where: {
        OR: [
          ...(coupleIds.length ? [{ coupleId: { in: coupleIds } }] : []),
          { reporterUserId: targetUserId },
          { targetUserId: targetUserId },
          { approvedBy: targetUserId },
          { rejectedBy: targetUserId },
        ],
      },
      select: { id: true },
    })
    const eventIds = uniqueIds(relatedEvents.map((event) => event.id))

    // 削除イベントを先に記録（この後 analytics 自体も消す）
    await trackEvent(prisma, { eventName: 'data_deletion_requested', userId })

    const operations = [
      prisma.pointLedger.deleteMany({
        where: {
          OR: [
            { userId: targetUserId },
            ...(coupleIds.length ? [{ coupleId: { in: coupleIds } }] : []),
            ...(eventIds.length ? [{ sourceEventId: { in: eventIds } }] : []),
          ],
        },
      }),
      prisma.repairAction.deleteMany({
        where: {
          OR: [
            { assigneeUserId: targetUserId },
            ...(coupleIds.length ? [{ coupleId: { in: coupleIds } }] : []),
            ...(eventIds.length ? [{ triggerEventId: { in: eventIds } }] : []),
          ],
        },
      }),
      prisma.safetyAction.deleteMany({
        where: {
          OR: [
            { actorUserId: targetUserId },
            ...(coupleIds.length ? [{ coupleId: { in: coupleIds } }] : []),
          ],
        },
      }),
      prisma.analyticsEvent.deleteMany({
        where: {
          OR: [
            { userId: targetUserId },
            ...(coupleIds.length ? [{ coupleId: { in: coupleIds } }] : []),
          ],
        },
      }),
      prisma.inviteCode.deleteMany({
        where: {
          OR: [
            { createdBy: targetUserId },
            ...(coupleIds.length ? [{ coupleId: { in: coupleIds } }] : []),
          ],
        },
      }),
      prisma.passwordResetToken.deleteMany({ where: { userId: targetUserId } }),
      ...(ruleIds.length
        ? [
            prisma.ruleOccurrenceAction.deleteMany({
              where: { ruleId: { in: ruleIds } },
            }),
          ]
        : []),
      ...(eventIds.length || coupleIds.length
        ? [
            prisma.ruleEvent.deleteMany({
              where: {
                OR: [
                  ...(eventIds.length ? [{ id: { in: eventIds } }] : []),
                  ...(coupleIds.length ? [{ coupleId: { in: coupleIds } }] : []),
                ],
              },
            }),
          ]
        : []),
      ...(coupleIds.length
        ? [prisma.rule.deleteMany({ where: { coupleId: { in: coupleIds } } })]
        : []),
      prisma.membership.deleteMany({
        where: {
          OR: [
            { userId: targetUserId },
            ...(coupleIds.length ? [{ coupleId: { in: coupleIds } }] : []),
          ],
        },
      }),
      ...(coupleIds.length
        ? [prisma.couple.deleteMany({ where: { id: { in: coupleIds } } })]
        : []),
      prisma.user.delete({ where: { id: targetUserId } }),
    ]

    await prisma.$transaction(operations)

    return new Response(null, { status: 204 })
  })
}

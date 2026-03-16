import { PrismaClient } from '@fny/db'
import { trackEvent } from './analytics.js'

/**
 * Expire pending events and open repairs that have passed their deadline.
 * This should run periodically (e.g., via cron or setInterval).
 */
export async function runExpiryJob(prisma: PrismaClient) {
  const now = new Date()

  // Expire pending events older than 24h
  const expiredEvents = await prisma.ruleEvent.findMany({
    where: {
      status: 'pending',
      expiresAt: { lt: now },
    },
    select: { id: true, coupleId: true, reporterUserId: true },
  })

  if (expiredEvents.length > 0) {
    await prisma.ruleEvent.updateMany({
      where: { id: { in: expiredEvents.map(e => e.id) } },
      data: { status: 'expired' },
    })

    for (const event of expiredEvents) {
      await trackEvent(prisma, {
        eventName: 'event_expired',
        userId: event.reporterUserId,
        coupleId: event.coupleId,
        payload: { event_id: event.id },
      })
    }
  }

  // Expire open repairs past due_at
  const expiredRepairs = await prisma.repairAction.findMany({
    where: {
      status: 'open',
      dueAt: { lt: now, not: null },
    },
    select: { id: true },
  })

  if (expiredRepairs.length > 0) {
    await prisma.repairAction.updateMany({
      where: { id: { in: expiredRepairs.map(r => r.id) } },
      data: { status: 'expired' },
    })
  }

  return { expiredEvents: expiredEvents.length, expiredRepairs: expiredRepairs.length }
}

import { Hono } from 'hono'
import { z } from 'zod'
import { Variables } from '../../app.js'
import { generateId, generateInviteCode } from '../../lib/id.js'
import { makeError } from '../../lib/error-codes.js'
import { signToken } from '../../lib/jwt.js'
import { trackEvent } from '../../services/analytics.js'

const createSchema = z.object({ display_name: z.string().min(1).max(30) })
const joinSchema = z.object({
  invite_code: z.string().min(1),
  display_name: z.string().min(1).max(30),
})

export function coupleRoutes(app: Hono<{ Variables: Variables }>) {
  app.post('/couples', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const appUrl = c.get('appUrl')

    const body = createSchema.parse(await c.req.json())
    const coupleId = generateId()
    const code = generateInviteCode()
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000)

    await prisma.$transaction(async (tx) => {
      await tx.couple.create({ data: { id: coupleId, status: 'pending' } })
      await tx.membership.create({
        data: { coupleId, userId, displayName: body.display_name, role: 'owner' },
      })
      await tx.inviteCode.create({ data: { code, coupleId, createdBy: userId, expiresAt } })
    })

    await trackEvent(prisma, { eventName: 'invite_created', userId, coupleId })

    return c.json({ couple_id: coupleId, invite_code: code, invite_url: `${appUrl}/pair?code=${code}` }, 201)
  })

  app.post('/couples/join', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const jwtSecret = c.get('jwtSecret')

    const body = joinSchema.parse(await c.req.json())
    const invite = await prisma.inviteCode.findUnique({ where: { code: body.invite_code } })
    if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
      return c.json(makeError('INVITE_EXPIRED'), 410)
    }

    const couple = await prisma.couple.findUnique({ where: { id: invite.coupleId } })
    if (!couple || couple.status === 'closed') return c.json(makeError('COUPLE_CLOSED'), 403)

    const existing = await prisma.membership.findFirst({
      where: { coupleId: invite.coupleId, userId, leftAt: null },
    })
    if (existing) return c.json(makeError('DUPLICATE_ACTION'), 409)

    const token = await signToken(userId, jwtSecret)

    await prisma.$transaction(async (tx) => {
      await tx.membership.create({
        data: { coupleId: invite.coupleId, userId, displayName: body.display_name, role: 'partner' },
      })
      await tx.couple.update({ where: { id: invite.coupleId }, data: { status: 'active' } })
      await tx.inviteCode.update({ where: { code: body.invite_code }, data: { usedAt: new Date() } })
    })

    await trackEvent(prisma, { eventName: 'invite_joined', userId, coupleId: invite.coupleId })

    return c.json({ couple_id: invite.coupleId, member_token: token, status: 'active' })
  })

  app.post('/couples/:couple_id/leave', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const coupleId = c.req.param('couple_id')

    const membership = await prisma.membership.findFirst({ where: { coupleId, userId, leftAt: null } })
    if (!membership) return c.json(makeError('FORBIDDEN'), 403)

    await prisma.$transaction(async (tx) => {
      await tx.membership.update({ where: { coupleId_userId: { coupleId, userId } }, data: { leftAt: new Date() } })
      await tx.couple.update({ where: { id: coupleId }, data: { status: 'closed', closedAt: new Date() } })
      await tx.safetyAction.create({
        data: { id: generateId(), coupleId, actorUserId: userId, actionType: 'leave' },
      })
    })

    await trackEvent(prisma, { eventName: 'pair_unlinked', userId, coupleId })
    return c.json({ status: 'closed' })
  })
}

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
const INVITE_CODE_RETRY_LIMIT = 5

type InviteCreatePrisma = {
  couple: {
    create: (args: { data: { id: string; status: string } }) => Promise<unknown>
  }
  membership: {
    create: (args: {
      data: { coupleId: string; userId: string; displayName: string; role: string }
    }) => Promise<unknown>
  }
  inviteCode: {
    create: (args: {
      data: { code: string; coupleId: string; createdBy: string; expiresAt: Date }
    }) => Promise<unknown>
  }
  $transaction: <T>(queries: Promise<T>[]) => Promise<T[]>
}

function isUniqueConflict(error: unknown) {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2002'
}

export async function createCoupleWithInvite(
  prisma: InviteCreatePrisma,
  userId: string,
  displayName: string
) {
  for (let attempt = 0; attempt < INVITE_CODE_RETRY_LIMIT; attempt += 1) {
    const coupleId = generateId()
    const code = generateInviteCode()
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000)

    try {
      await prisma.$transaction([
        prisma.couple.create({ data: { id: coupleId, status: 'pending' } }),
        prisma.membership.create({
          data: { coupleId, userId, displayName, role: 'owner' },
        }),
        prisma.inviteCode.create({ data: { code, coupleId, createdBy: userId, expiresAt } }),
      ])

      return { coupleId, code }
    } catch (error) {
      if (isUniqueConflict(error)) continue
      throw error
    }
  }

  throw Object.assign(new Error('invite code collision retry exceeded'), { code: 'P2002' })
}

export function coupleRoutes(app: Hono<{ Variables: Variables }>) {
  app.post('/couples', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const appUrl = c.get('appUrl')

    const body = createSchema.parse(await c.req.json())
    let created: { coupleId: string; code: string }
    try {
      created = await createCoupleWithInvite(prisma, userId, body.display_name)
    } catch (error) {
      if (isUniqueConflict(error)) {
        return c.json(makeError('INTERNAL_ERROR'), 500)
      }
      throw error
    }

    await trackEvent(prisma, { eventName: 'invite_created', userId, coupleId: created.coupleId })

    return c.json({
      couple_id: created.coupleId,
      invite_code: created.code,
      invite_url: `${appUrl}/pair?code=${created.code}`,
    }, 201)
  })

  app.post('/couples/join', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const jwtSecret = c.get('jwtSecret')
    const userTokenVersion = c.get('userTokenVersion')

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

    const token = await signToken(userId, jwtSecret, userTokenVersion)

    await prisma.$transaction([
      prisma.membership.create({
        data: { coupleId: invite.coupleId, userId, displayName: body.display_name, role: 'partner' },
      }),
      prisma.couple.update({ where: { id: invite.coupleId }, data: { status: 'active' } }),
      prisma.inviteCode.update({ where: { code: body.invite_code }, data: { usedAt: new Date() } }),
    ])

    await trackEvent(prisma, { eventName: 'invite_joined', userId, coupleId: invite.coupleId })

    return c.json({ couple_id: invite.coupleId, member_token: token, status: 'active' })
  })

  app.get('/couples/:couple_id', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const coupleId = c.req.param('couple_id')

    const membership = await prisma.membership.findFirst({ where: { coupleId, userId, leftAt: null } })
    if (!membership) return c.json(makeError('FORBIDDEN'), 403)

    const couple = await prisma.couple.findUnique({ where: { id: coupleId } })
    if (!couple) return c.json(makeError('NOT_FOUND'), 404)

    const activeInvite = await prisma.inviteCode.findFirst({
      where: { coupleId, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: 'desc' },
    })

    const appUrl = c.get('appUrl')

    return c.json({
      couple_id: coupleId,
      status: couple.status,
      invite_code: activeInvite?.code ?? null,
      invite_url: activeInvite ? `${appUrl}/pair?code=${activeInvite.code}` : null,
    })
  })

  app.post('/couples/:couple_id/leave', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const coupleId = c.req.param('couple_id')

    const membership = await prisma.membership.findFirst({ where: { coupleId, userId, leftAt: null } })
    if (!membership) return c.json(makeError('FORBIDDEN'), 403)

    await prisma.$transaction([
      prisma.membership.update({ where: { coupleId_userId: { coupleId, userId } }, data: { leftAt: new Date() } }),
      prisma.couple.update({ where: { id: coupleId }, data: { status: 'closed', closedAt: new Date() } }),
      prisma.safetyAction.create({
        data: { id: generateId(), coupleId, actorUserId: userId, actionType: 'leave' },
      }),
    ])

    await trackEvent(prisma, { eventName: 'pair_unlinked', userId, coupleId })
    return c.json({ status: 'closed' })
  })
}

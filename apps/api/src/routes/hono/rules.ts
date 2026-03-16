import { Hono } from 'hono'
import { z } from 'zod'
import { PrismaClient } from '@fny/db'
import { Variables } from '../../app.js'
import { generateId } from '../../lib/id.js'
import { makeError } from '../../lib/error-codes.js'
import { trackEvent } from '../../services/analytics.js'

const RULE_LIMIT = 3

const createSchema = z.object({
  title: z.string().min(1).max(60),
  objective: z.string().max(120).optional(),
  mode: z.enum(['routine', 'adhoc']).default('routine'),
  point_value: z.number().int().min(1).max(5),
  threshold: z.number().int().min(3).max(20),
  thank_you_threshold: z.number().int().min(3).max(30).default(5),
  nobishiro_threshold: z.number().int().min(3).max(30).default(3),
})

const updateSchema = z.object({
  title: z.string().min(1).max(60).optional(),
  objective: z.string().max(120).optional(),
  mode: z.enum(['routine', 'adhoc']).optional(),
  point_value: z.number().int().min(1).max(5).optional(),
  threshold: z.number().int().min(3).max(20).optional(),
  thank_you_threshold: z.number().int().min(3).max(30).optional(),
  nobishiro_threshold: z.number().int().min(3).max(30).optional(),
  active: z.boolean().optional(),
})

async function assertMember(prisma: PrismaClient, coupleId: string, userId: string) {
  return !!(await prisma.membership.findFirst({ where: { coupleId, userId, leftAt: null } }))
}

function toRule(r: { id: string; title: string; objective: string | null; mode: string; pointValue: number; threshold: number; thankYouThreshold: number; nobishiroThreshold: number; active: boolean }) {
  return { id: r.id, title: r.title, objective: r.objective, mode: r.mode, point_value: r.pointValue, threshold: r.threshold, thank_you_threshold: r.thankYouThreshold, nobishiro_threshold: r.nobishiroThreshold, active: r.active }
}

export function ruleRoutes(app: Hono<{ Variables: Variables }>) {
  app.get('/couples/:couple_id/rules', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const coupleId = c.req.param('couple_id')

    if (!(await assertMember(prisma, coupleId, userId))) return c.json(makeError('FORBIDDEN'), 403)

    const rules = await prisma.rule.findMany({ where: { coupleId, archivedAt: null }, orderBy: { createdAt: 'asc' } })
    return c.json({ items: rules.map(toRule) })
  })

  app.post('/couples/:couple_id/rules', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const coupleId = c.req.param('couple_id')

    if (!(await assertMember(prisma, coupleId, userId))) return c.json(makeError('FORBIDDEN'), 403)

    const couple = await prisma.couple.findUnique({ where: { id: coupleId } })
    if (!couple) return c.json(makeError('NOT_FOUND'), 404)
    if (couple.status === 'closed') return c.json(makeError('COUPLE_CLOSED'), 403)

    const activeCount = await prisma.rule.count({ where: { coupleId, archivedAt: null } })
    if (activeCount >= RULE_LIMIT) return c.json(makeError('RULE_LIMIT_REACHED'), 422)

    const body = createSchema.parse(await c.req.json())
    const rule = await prisma.rule.create({
      data: {
        id: generateId(), coupleId, title: body.title, objective: body.objective ?? null,
        mode: body.mode, pointValue: body.point_value, threshold: body.threshold,
        thankYouThreshold: body.thank_you_threshold, nobishiroThreshold: body.nobishiro_threshold,
      },
    })

    await trackEvent(prisma, { eventName: 'rule_created', userId, coupleId, payload: { rule_id: rule.id } })
    return c.json(toRule(rule), 201)
  })

  app.patch('/rules/:rule_id', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const ruleId = c.req.param('rule_id')

    const rule = await prisma.rule.findUnique({ where: { id: ruleId } })
    if (!rule || rule.archivedAt) return c.json(makeError('NOT_FOUND'), 404)
    if (!(await assertMember(prisma, rule.coupleId, userId))) return c.json(makeError('FORBIDDEN'), 403)

    const body = updateSchema.parse(await c.req.json())
    const updated = await prisma.rule.update({
      where: { id: ruleId },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.objective !== undefined && { objective: body.objective }),
        ...(body.mode !== undefined && { mode: body.mode }),
        ...(body.point_value !== undefined && { pointValue: body.point_value }),
        ...(body.threshold !== undefined && { threshold: body.threshold }),
        ...(body.thank_you_threshold !== undefined && { thankYouThreshold: body.thank_you_threshold }),
        ...(body.nobishiro_threshold !== undefined && { nobishiroThreshold: body.nobishiro_threshold }),
        ...(body.active !== undefined && { active: body.active }),
      },
    })

    await trackEvent(prisma, { eventName: 'rule_updated', userId, coupleId: rule.coupleId, payload: { rule_id: ruleId } })
    return c.json(toRule(updated))
  })

  app.delete('/rules/:rule_id', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const ruleId = c.req.param('rule_id')

    const rule = await prisma.rule.findUnique({ where: { id: ruleId } })
    if (!rule || rule.archivedAt) return c.json(makeError('NOT_FOUND'), 404)
    if (!(await assertMember(prisma, rule.coupleId, userId))) return c.json(makeError('FORBIDDEN'), 403)

    await prisma.rule.update({ where: { id: ruleId }, data: { archivedAt: new Date(), active: false } })
    await trackEvent(prisma, { eventName: 'rule_archived', userId, coupleId: rule.coupleId, payload: { rule_id: ruleId } })
    return new Response(null, { status: 204 })
  })
}

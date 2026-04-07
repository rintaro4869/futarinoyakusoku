import { Hono } from 'hono'
import { z } from 'zod'
import { Variables } from '../../app.js'
import { generateId } from '../../lib/id.js'
import { makeError } from '../../lib/error-codes.js'
import { trackEvent } from '../../services/analytics.js'

const createSchema = z.object({
  trigger_event_id: z.string().min(1).optional().nullable(),
  template_id: z.string().min(1),
  assignee_user_id: z.string().min(1),
  due_at: z.string().datetime().optional().nullable(),
})

function toRepair(r: { id: string; triggerEventId: string | null; templateId: string; assigneeUserId: string; status: string; dueAt: Date | null }) {
  return { id: r.id, trigger_event_id: r.triggerEventId, template_id: r.templateId, assignee_user_id: r.assigneeUserId, status: r.status, due_at: r.dueAt?.toISOString() ?? null }
}

export function repairRoutes(app: Hono<{ Variables: Variables }>) {
  app.post('/couples/:couple_id/repairs', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const coupleId = c.req.param('couple_id')

    const membership = await prisma.membership.findFirst({ where: { coupleId, userId, leftAt: null } })
    if (!membership) return c.json(makeError('FORBIDDEN'), 403)

    const body = createSchema.parse(await c.req.json())
    const template = await prisma.repairTemplate.findUnique({ where: { id: body.template_id } })
    if (!template || !template.active) return c.json(makeError('NOT_FOUND'), 404)

    const repair = await prisma.repairAction.create({
      data: { id: generateId(), coupleId, triggerEventId: body.trigger_event_id ?? null, templateId: body.template_id, assigneeUserId: body.assignee_user_id, dueAt: body.due_at ? new Date(body.due_at) : null, status: 'open' },
    })

    await trackEvent(prisma, { eventName: 'repair_selected', userId, coupleId, payload: { repair_id: repair.id, template_id: body.template_id } })
    return c.json(toRepair(repair), 201)
  })

  app.get('/couples/:couple_id/repairs', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const coupleId = c.req.param('couple_id')
    const status = c.req.query('status')

    const membership = await prisma.membership.findFirst({ where: { coupleId, userId, leftAt: null } })
    if (!membership) return c.json(makeError('FORBIDDEN'), 403)

    const repairs = await prisma.repairAction.findMany({
      where: { coupleId, ...(status && { status: status as 'open' | 'completed' | 'skipped' | 'expired' }) },
      orderBy: { createdAt: 'desc' },
    })
    return c.json({ items: repairs.map(toRepair) })
  })

  app.post('/repairs/:repair_id/complete', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const repairId = c.req.param('repair_id')

    const repair = await prisma.repairAction.findUnique({ where: { id: repairId } })
    if (!repair) return c.json(makeError('NOT_FOUND'), 404)

    const membership = await prisma.membership.findFirst({ where: { coupleId: repair.coupleId, userId, leftAt: null } })
    if (!membership) return c.json(makeError('FORBIDDEN'), 403)
    if (repair.status !== 'open') return c.json(makeError('DUPLICATE_ACTION'), 409)

    const updated = await prisma.repairAction.update({ where: { id: repairId }, data: { status: 'completed', completedAt: new Date() } })
    await trackEvent(prisma, { eventName: 'repair_completed', userId, coupleId: repair.coupleId, payload: { repair_id: repairId } })
    return c.json(toRepair(updated))
  })
}

export function repairTemplateRoutes(app: Hono<{ Variables: Variables }>) {
  app.get('/repair-templates', async (c) => {
    const prisma = c.get('prisma')
    const templates = await prisma.repairTemplate.findMany({ where: { active: true } })
    return c.json({ items: templates })
  })
}

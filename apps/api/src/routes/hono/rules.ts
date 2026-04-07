import { Hono } from 'hono'
import { z } from 'zod'
import { PrismaClient } from '@fny/db'
import { Variables } from '../../app.js'
import { generateId } from '../../lib/id.js'
import { makeError } from '../../lib/error-codes.js'
import {
  CompatRule,
  createRuleCompat,
  fetchRuleByIdCompat,
  fetchRulesCompat,
  getRuleWriteCompatibility,
  updateRuleCompat,
} from '../../lib/rule-compat.js'
import { trackEvent } from '../../services/analytics.js'

// const RULE_LIMIT = 5  // TODO: マネタイズ時にプランごとの上限として復活させる
const pointValueSchema = z.number().int().min(10, {
  message: 'point_value must be at least 10',
})

const createSchema = z.object({
  title: z.string().min(1).max(60),
  objective: z.string().max(120).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  recurrence_type: z.enum(['daily', 'weekly', 'monthly']).nullable().optional(),
  recurrence_interval: z.number().int().min(1).max(12).default(1),
  days_of_week: z.array(z.number().int().min(0).max(6)).max(7).nullable().optional(),
  day_of_month: z.number().int().min(1).max(31).nullable().optional(),
  time_of_day: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  mode: z.enum(['routine', 'adhoc']).default('routine'),
  category: z.string().max(30).optional(),
  point_value: pointValueSchema,
  threshold: z.number().int().min(3).max(20),
  thank_you_threshold: z.number().int().min(3).max(30).default(5),
  nobishiro_threshold: z.number().int().min(3).max(30).default(3),
  assignee: z.enum(['self', 'partner', 'both']).default('both'),
  recorder: z.enum(['self', 'partner']).default('self'),
  reminder_enabled: z.boolean().default(false),
  reminder_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
})

const updateSchema = z.object({
  title: z.string().min(1).max(60).optional(),
  objective: z.string().max(120).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  recurrence_type: z.enum(['daily', 'weekly', 'monthly']).nullable().optional(),
  recurrence_interval: z.number().int().min(1).max(12).optional(),
  days_of_week: z.array(z.number().int().min(0).max(6)).max(7).nullable().optional(),
  day_of_month: z.number().int().min(1).max(31).nullable().optional(),
  time_of_day: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  mode: z.enum(['routine', 'adhoc']).optional(),
  category: z.string().max(30).nullable().optional(),
  point_value: pointValueSchema.optional(),
  threshold: z.number().int().min(3).max(20).optional(),
  thank_you_threshold: z.number().int().min(3).max(30).optional(),
  nobishiro_threshold: z.number().int().min(3).max(30).optional(),
  assignee: z.enum(['self', 'partner', 'both']).optional(),
  recorder: z.enum(['self', 'partner']).optional(),
  active: z.boolean().optional(),
  reminder_enabled: z.boolean().optional(),
  reminder_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
})

async function assertMember(prisma: PrismaClient, coupleId: string, userId: string) {
  return !!(await prisma.membership.findFirst({ where: { coupleId, userId, leftAt: null } }))
}

function serializeDaysOfWeek(days?: number[] | null) {
  if (!days || days.length === 0) return null
  return JSON.stringify([...new Set(days)].sort((a, b) => a - b))
}

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

function resolveCreateRuleInput(
  body: z.infer<typeof createSchema>,
  coupleId: string,
  userId: string
) {
  return {
    id: generateId(),
    coupleId,
    title: body.title,
    objective: body.objective ?? null,
    startDate: body.start_date ? new Date(`${body.start_date}T00:00:00.000Z`) : null,
    recurrenceType: body.mode === 'routine' ? body.recurrence_type ?? null : null,
    recurrenceInterval: body.mode === 'routine' ? body.recurrence_interval : 1,
    daysOfWeek: body.mode === 'routine' ? serializeDaysOfWeek(body.days_of_week ?? null) : null,
    dayOfMonth: body.mode === 'routine' ? body.day_of_month ?? null : null,
    timeOfDay: body.mode === 'routine' ? body.time_of_day ?? null : null,
    mode: body.mode,
    category: body.category ?? null,
    pointValue: body.point_value,
    threshold: body.threshold,
    thankYouThreshold: body.thank_you_threshold,
    nobishiroThreshold: body.nobishiro_threshold,
    creatorUserId: userId,
    assignee: body.assignee,
    recorder: body.recorder,
    active: true,
    reminderEnabled: body.reminder_enabled,
    reminderTime: body.reminder_time ?? null,
  }
}

function resolveRuleStateAfterPatch(rule: CompatRule, body: z.infer<typeof updateSchema>) {
  const nextMode = body.mode ?? rule.mode
  const becomesAdhoc = nextMode === 'adhoc'

  return {
    title: body.title ?? rule.title,
    objective: body.objective ?? rule.objective,
    startDate: becomesAdhoc
      ? null
      : body.start_date !== undefined
      ? (body.start_date ? new Date(`${body.start_date}T00:00:00.000Z`) : null)
      : rule.startDate,
    recurrenceType: becomesAdhoc
      ? null
      : body.recurrence_type !== undefined
      ? body.recurrence_type
      : rule.recurrenceType,
    recurrenceInterval: becomesAdhoc ? 1 : body.recurrence_interval ?? rule.recurrenceInterval,
    daysOfWeek: becomesAdhoc
      ? null
      : body.days_of_week !== undefined
      ? serializeDaysOfWeek(body.days_of_week)
      : rule.daysOfWeek,
    dayOfMonth: becomesAdhoc
      ? null
      : body.day_of_month !== undefined
      ? body.day_of_month
      : rule.dayOfMonth,
    timeOfDay: becomesAdhoc
      ? null
      : body.time_of_day !== undefined
      ? body.time_of_day
      : rule.timeOfDay,
    mode: nextMode,
    category: body.category !== undefined ? body.category : rule.category,
    pointValue: body.point_value ?? rule.pointValue,
    threshold: body.threshold ?? rule.threshold,
    thankYouThreshold: body.thank_you_threshold ?? rule.thankYouThreshold,
    nobishiroThreshold: body.nobishiro_threshold ?? rule.nobishiroThreshold,
    creatorUserId: rule.creatorUserId,
    assignee: body.assignee ?? rule.assignee,
    recorder: body.recorder ?? rule.recorder,
    active: body.active ?? rule.active,
    reminderEnabled: body.reminder_enabled ?? rule.reminderEnabled,
    reminderTime: body.reminder_time !== undefined ? body.reminder_time : rule.reminderTime,
    archivedAt: rule.archivedAt,
  }
}

function resolveRulePatchInput(body: z.infer<typeof updateSchema>) {
  return {
    ...(body.title !== undefined && { title: body.title }),
    ...(body.objective !== undefined && { objective: body.objective }),
    ...(body.start_date !== undefined && { startDate: body.start_date ? new Date(`${body.start_date}T00:00:00.000Z`) : null }),
    ...(body.recurrence_type !== undefined && { recurrenceType: body.recurrence_type }),
    ...(body.recurrence_interval !== undefined && { recurrenceInterval: body.recurrence_interval }),
    ...(body.days_of_week !== undefined && { daysOfWeek: serializeDaysOfWeek(body.days_of_week) }),
    ...(body.day_of_month !== undefined && { dayOfMonth: body.day_of_month }),
    ...(body.time_of_day !== undefined && { timeOfDay: body.time_of_day }),
    ...(body.mode !== undefined && { mode: body.mode }),
    ...(body.mode === 'adhoc' && {
      recurrenceType: null,
      recurrenceInterval: 1,
      daysOfWeek: null,
      dayOfMonth: null,
      timeOfDay: null,
      startDate: null,
    }),
    ...(body.category !== undefined && { category: body.category }),
    ...(body.point_value !== undefined && { pointValue: body.point_value }),
    ...(body.threshold !== undefined && { threshold: body.threshold }),
    ...(body.thank_you_threshold !== undefined && { thankYouThreshold: body.thank_you_threshold }),
    ...(body.nobishiro_threshold !== undefined && { nobishiroThreshold: body.nobishiro_threshold }),
    ...(body.assignee !== undefined && { assignee: body.assignee }),
    ...(body.recorder !== undefined && { recorder: body.recorder }),
    ...(body.active !== undefined && { active: body.active }),
    ...(body.reminder_enabled !== undefined && { reminderEnabled: body.reminder_enabled }),
    ...(body.reminder_time !== undefined && { reminderTime: body.reminder_time }),
  }
}

function toRule(r: { id: string; title: string; objective: string | null; startDate?: Date | string | null; recurrenceType?: string | null; recurrenceInterval?: number | null; daysOfWeek?: string | null; dayOfMonth?: number | null; timeOfDay?: string | null; mode: string; category?: string | null; pointValue: number; threshold: number; thankYouThreshold: number; nobishiroThreshold: number; creatorUserId?: string | null; assignee: string; recorder: string; active: boolean | number; reminderEnabled: boolean | number; reminderTime: string | null }) {
  const startDate = r.startDate ? new Date(r.startDate) : null
  return {
    id: r.id,
    title: r.title,
    objective: r.objective,
    start_date: startDate ? startDate.toISOString().slice(0, 10) : null,
    recurrence_type: r.recurrenceType ?? null,
    recurrence_interval: r.recurrenceInterval ?? 1,
    days_of_week: parseDaysOfWeek(r.daysOfWeek),
    day_of_month: r.dayOfMonth ?? null,
    time_of_day: r.timeOfDay ?? null,
    mode: r.mode,
    category: r.category ?? null,
    point_value: r.pointValue,
    threshold: r.threshold,
    thank_you_threshold: r.thankYouThreshold,
    nobishiro_threshold: r.nobishiroThreshold,
    creator_user_id: r.creatorUserId ?? null,
    assignee: r.assignee,
    recorder: r.recorder,
    active: !!r.active,
    reminder_enabled: !!r.reminderEnabled,
    reminder_time: r.reminderTime,
  }
}

export function ruleRoutes(app: Hono<{ Variables: Variables }>) {
  app.get('/couples/:couple_id/rules', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const coupleId = c.req.param('couple_id')

    if (!(await assertMember(prisma, coupleId, userId))) return c.json(makeError('FORBIDDEN'), 403)

    const rules = await fetchRulesCompat(prisma, coupleId)
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

    const body = createSchema.parse(await c.req.json())

    // TODO: マネタイズ時にプランごとの上限チェックをここに追加
    const createInput = resolveCreateRuleInput(body, coupleId, userId)
    const compatibility = await getRuleWriteCompatibility(prisma, createInput)
    if (!compatibility.ok) return c.json(makeError('SCHEMA_MISMATCH'), 503)

    const rule = await createRuleCompat(prisma, createInput)

    await trackEvent(prisma, { eventName: 'rule_created', userId, coupleId, payload: { rule_id: rule.id } })
    return c.json(toRule(rule), 201)
  })

  app.patch('/rules/:rule_id', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const ruleId = c.req.param('rule_id')

    const rule = await fetchRuleByIdCompat(prisma, ruleId)
    if (!rule || rule.archivedAt) return c.json(makeError('NOT_FOUND'), 404)
    if (!(await assertMember(prisma, rule.coupleId, userId))) return c.json(makeError('FORBIDDEN'), 403)

    const body = updateSchema.parse(await c.req.json())
    const nextRuleState = resolveRuleStateAfterPatch(rule, body)
    const compatibility = await getRuleWriteCompatibility(prisma, nextRuleState)
    if (!compatibility.ok) return c.json(makeError('SCHEMA_MISMATCH'), 503)

    const updated = await updateRuleCompat(prisma, ruleId, resolveRulePatchInput(body))
    if (!updated) return c.json(makeError('NOT_FOUND'), 404)

    await trackEvent(prisma, { eventName: 'rule_updated', userId, coupleId: rule.coupleId, payload: { rule_id: ruleId } })
    return c.json(toRule(updated))
  })

  app.delete('/rules/:rule_id', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const ruleId = c.req.param('rule_id')

    const rule = await fetchRuleByIdCompat(prisma, ruleId)
    if (!rule || rule.archivedAt) return c.json(makeError('NOT_FOUND'), 404)
    if (!(await assertMember(prisma, rule.coupleId, userId))) return c.json(makeError('FORBIDDEN'), 403)

    await updateRuleCompat(prisma, ruleId, { archivedAt: new Date(), active: false })
    await trackEvent(prisma, { eventName: 'rule_archived', userId, coupleId: rule.coupleId, payload: { rule_id: ruleId } })
    return new Response(null, { status: 204 })
  })
}

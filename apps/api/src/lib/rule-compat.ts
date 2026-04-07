import { PrismaClient } from '@fny/db'
import { DEFAULT_RULE_POINT_VALUE } from './point-values.js'

type RawQueryCapablePrisma = PrismaClient & {
  $queryRawUnsafe: <T = unknown>(query: string, ...values: unknown[]) => Promise<T>
}

type RawWriteCapablePrisma = RawQueryCapablePrisma & {
  $executeRawUnsafe: (query: string, ...values: unknown[]) => Promise<number>
}

type RawRuleRow = {
  id: string
  coupleId: string
  title: string
  objective: string | null
  startDate: string | Date | null
  recurrenceType: string | null
  recurrenceInterval: number | null
  daysOfWeek: string | null
  dayOfMonth: number | null
  timeOfDay: string | null
  mode: string | null
  category: string | null
  pointValue: number | null
  threshold: number | null
  thankYouThreshold: number | null
  nobishiroThreshold: number | null
  creatorUserId: string | null
  assignee: string | null
  recorder: string | null
  active: number | boolean | null
  reminderEnabled: number | boolean | null
  reminderTime: string | null
  createdAt: string | Date | null
  archivedAt: string | Date | null
}

export type CompatRule = {
  id: string
  coupleId: string
  title: string
  objective: string | null
  startDate: Date | null
  recurrenceType: string | null
  recurrenceInterval: number
  daysOfWeek: string | null
  dayOfMonth: number | null
  timeOfDay: string | null
  mode: string
  category: string | null
  pointValue: number
  threshold: number
  thankYouThreshold: number
  nobishiroThreshold: number
  creatorUserId: string | null
  assignee: string
  recorder: string
  active: boolean
  reminderEnabled: boolean
  reminderTime: string | null
  createdAt: Date | null
  archivedAt: Date | null
}

export type CompatRuleMutationInput = {
  id?: string
  coupleId?: string
  title?: string
  objective?: string | null
  startDate?: Date | null
  recurrenceType?: string | null
  recurrenceInterval?: number
  daysOfWeek?: string | null
  dayOfMonth?: number | null
  timeOfDay?: string | null
  mode?: string
  category?: string | null
  pointValue?: number
  threshold?: number
  thankYouThreshold?: number
  nobishiroThreshold?: number
  creatorUserId?: string | null
  assignee?: string
  recorder?: string
  active?: boolean
  reminderEnabled?: boolean
  reminderTime?: string | null
  archivedAt?: Date | null
}

export type CompatRuleCreateInput = CompatRuleMutationInput & {
  id: string
  coupleId: string
  title: string
  mode: string
  pointValue: number
  threshold: number
  thankYouThreshold: number
  nobishiroThreshold: number
  active: boolean
}

const BASE_RULE_COLUMNS = new Set([
  'id',
  'couple_id',
  'title',
  'objective',
  'mode',
  'point_value',
  'threshold',
  'thank_you_threshold',
  'nobishiro_threshold',
  'active',
  'created_at',
  'archived_at',
])

const FULL_RULE_COLUMNS = new Set([
  ...BASE_RULE_COLUMNS,
  'start_date',
  'recurrence_type',
  'recurrence_interval',
  'days_of_week',
  'day_of_month',
  'time_of_day',
  'category',
  'creator_user_id',
  'assignee',
  'recorder',
  'reminder_enabled',
  'reminder_time',
])

const RULE_WRITE_FIELDS: Array<{
  key: keyof CompatRuleMutationInput
  column: string
  serialize?: (value: CompatRuleMutationInput[keyof CompatRuleMutationInput]) => unknown
}> = [
  { key: 'id', column: 'id' },
  { key: 'coupleId', column: 'couple_id' },
  { key: 'title', column: 'title' },
  { key: 'objective', column: 'objective' },
  { key: 'startDate', column: 'start_date', serialize: toSqlDateTime },
  { key: 'recurrenceType', column: 'recurrence_type' },
  { key: 'recurrenceInterval', column: 'recurrence_interval' },
  { key: 'daysOfWeek', column: 'days_of_week' },
  { key: 'dayOfMonth', column: 'day_of_month' },
  { key: 'timeOfDay', column: 'time_of_day' },
  { key: 'mode', column: 'mode' },
  { key: 'category', column: 'category' },
  { key: 'pointValue', column: 'point_value' },
  { key: 'threshold', column: 'threshold' },
  { key: 'thankYouThreshold', column: 'thank_you_threshold' },
  { key: 'nobishiroThreshold', column: 'nobishiro_threshold' },
  { key: 'creatorUserId', column: 'creator_user_id' },
  { key: 'assignee', column: 'assignee' },
  { key: 'recorder', column: 'recorder' },
  { key: 'active', column: 'active', serialize: toSqlBoolean },
  { key: 'reminderEnabled', column: 'reminder_enabled', serialize: toSqlBoolean },
  { key: 'reminderTime', column: 'reminder_time' },
  { key: 'archivedAt', column: 'archived_at', serialize: toSqlDateTime },
]

let cachedRuleColumns: Set<string> | null = null

function getRawQueryClient(prisma: PrismaClient): RawQueryCapablePrisma | null {
  return typeof (prisma as Partial<RawQueryCapablePrisma>).$queryRawUnsafe === 'function'
    ? (prisma as RawQueryCapablePrisma)
    : null
}

function getRawWriteClient(prisma: PrismaClient): RawWriteCapablePrisma | null {
  return typeof (prisma as Partial<RawWriteCapablePrisma>).$queryRawUnsafe === 'function'
    && typeof (prisma as Partial<RawWriteCapablePrisma>).$executeRawUnsafe === 'function'
    ? (prisma as RawWriteCapablePrisma)
    : null
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function toSqlDateTime(value: CompatRuleMutationInput[keyof CompatRuleMutationInput]): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  return null
}

function toInt(value: unknown, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function toBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value
  if (value === 1 || value === '1') return true
  if (value === 0 || value === '0') return false
  return fallback
}

function toSqlBoolean(value: CompatRuleMutationInput[keyof CompatRuleMutationInput]): number {
  return value ? 1 : 0
}

function selectExpr(columns: Set<string>, column: string, alias: string, fallbackSql: string) {
  return columns.has(column) ? `"${column}" AS "${alias}"` : `${fallbackSql} AS "${alias}"`
}

function buildRuleSelect(columns: Set<string>) {
  return `
    SELECT
      "id" AS "id",
      "couple_id" AS "coupleId",
      "title" AS "title",
      "objective" AS "objective",
      ${selectExpr(columns, 'start_date', 'startDate', 'NULL')}
      , ${selectExpr(columns, 'recurrence_type', 'recurrenceType', 'NULL')}
      , ${selectExpr(columns, 'recurrence_interval', 'recurrenceInterval', '1')}
      , ${selectExpr(columns, 'days_of_week', 'daysOfWeek', 'NULL')}
      , ${selectExpr(columns, 'day_of_month', 'dayOfMonth', 'NULL')}
      , ${selectExpr(columns, 'time_of_day', 'timeOfDay', 'NULL')}
      , "mode" AS "mode"
      , ${selectExpr(columns, 'category', 'category', 'NULL')}
      , "point_value" AS "pointValue"
      , "threshold" AS "threshold"
      , "thank_you_threshold" AS "thankYouThreshold"
      , "nobishiro_threshold" AS "nobishiroThreshold"
      , ${selectExpr(columns, 'creator_user_id', 'creatorUserId', 'NULL')}
      , ${selectExpr(columns, 'assignee', 'assignee', "'both'")}
      , ${selectExpr(columns, 'recorder', 'recorder', "'self'")}
      , "active" AS "active"
      , ${selectExpr(columns, 'reminder_enabled', 'reminderEnabled', '0')}
      , ${selectExpr(columns, 'reminder_time', 'reminderTime', 'NULL')}
      , "created_at" AS "createdAt"
      , "archived_at" AS "archivedAt"
    FROM "rules"
  `
}

function buildMutationEntries(columns: Set<string>, data: CompatRuleMutationInput) {
  const entries: Array<{ column: string; value: unknown }> = []

  for (const field of RULE_WRITE_FIELDS) {
    if (!(field.key in data)) continue
    if (!columns.has(field.column)) continue

    const rawValue = data[field.key]
    const value = field.serialize ? field.serialize(rawValue) : rawValue
    entries.push({ column: field.column, value })
  }

  return entries
}

function normalizeRule(row: RawRuleRow): CompatRule {
  return {
    id: row.id,
    coupleId: row.coupleId,
    title: row.title,
    objective: row.objective ?? null,
    startDate: toDate(row.startDate),
    recurrenceType: row.recurrenceType ?? null,
    recurrenceInterval: toInt(row.recurrenceInterval, 1),
    daysOfWeek: row.daysOfWeek ?? null,
    dayOfMonth: row.dayOfMonth ?? null,
    timeOfDay: row.timeOfDay ?? null,
    mode: row.mode ?? 'routine',
    category: row.category ?? null,
    pointValue: toInt(row.pointValue, DEFAULT_RULE_POINT_VALUE),
    threshold: toInt(row.threshold, 3),
    thankYouThreshold: toInt(row.thankYouThreshold, 5),
    nobishiroThreshold: toInt(row.nobishiroThreshold, 3),
    creatorUserId: row.creatorUserId ?? null,
    assignee: row.assignee ?? 'both',
    recorder: row.recorder ?? 'self',
    active: toBool(row.active, true),
    reminderEnabled: toBool(row.reminderEnabled, false),
    reminderTime: row.reminderTime ?? null,
    createdAt: toDate(row.createdAt),
    archivedAt: toDate(row.archivedAt),
  }
}

export function resetRuleCompatCacheForTests() {
  cachedRuleColumns = null
}

export async function getRuleColumns(prisma: PrismaClient): Promise<Set<string>> {
  if (cachedRuleColumns) return cachedRuleColumns

  const rawQueryClient = getRawQueryClient(prisma)
  if (!rawQueryClient) {
    cachedRuleColumns = FULL_RULE_COLUMNS
    return cachedRuleColumns
  }

  try {
    const rows = await rawQueryClient.$queryRawUnsafe<Array<{ name?: string }>>(`PRAGMA table_info("rules")`)
    const discovered = new Set(rows.map((row) => row.name).filter((name): name is string => Boolean(name)))
    cachedRuleColumns = discovered.size > 0 ? discovered : FULL_RULE_COLUMNS
  } catch {
    cachedRuleColumns = FULL_RULE_COLUMNS
  }

  return cachedRuleColumns
}

function getRequiredColumnsForMeaningfulRuleWrite(input: CompatRuleMutationInput): string[] {
  const required = new Set<string>()

  if (input.startDate) required.add('start_date')
  if (input.recurrenceType) required.add('recurrence_type')
  if (input.recurrenceInterval !== undefined && input.recurrenceInterval !== 1) required.add('recurrence_interval')
  if (input.daysOfWeek) required.add('days_of_week')
  if (input.dayOfMonth !== undefined && input.dayOfMonth !== null) required.add('day_of_month')
  if (input.timeOfDay) required.add('time_of_day')
  if (input.assignee && input.assignee !== 'both') {
    required.add('assignee')
    required.add('creator_user_id')
  }
  if (input.recorder && input.recorder !== 'self') required.add('recorder')
  if (input.reminderEnabled) required.add('reminder_enabled')
  if (input.reminderTime) required.add('reminder_time')

  return [...required]
}

export async function getRuleWriteCompatibility(
  prisma: PrismaClient,
  input: CompatRuleMutationInput
): Promise<{ ok: boolean; missingColumns: string[] }> {
  const columns = await getRuleColumns(prisma)
  const missingColumns = getRequiredColumnsForMeaningfulRuleWrite(input).filter((column) => !columns.has(column))
  return { ok: missingColumns.length === 0, missingColumns }
}

export async function fetchRulesCompat(
  prisma: PrismaClient,
  coupleId: string,
  options?: { includeArchived?: boolean }
): Promise<CompatRule[]> {
  const includeArchived = options?.includeArchived ?? false

  const rawQueryClient = getRawQueryClient(prisma)
  if (!rawQueryClient) {
    const rows = await prisma.rule.findMany({
      where: includeArchived ? { coupleId } : { coupleId, archivedAt: null },
      orderBy: { createdAt: 'asc' },
    })
    return rows.map((row) => normalizeRule(row as unknown as RawRuleRow))
  }

  const columns = await getRuleColumns(prisma)
  const sql = `
    ${buildRuleSelect(columns)}
    WHERE "couple_id" = ?
      ${includeArchived ? '' : 'AND "archived_at" IS NULL'}
    ORDER BY "created_at" ASC
  `

  const rows = await rawQueryClient.$queryRawUnsafe<RawRuleRow[]>(sql, coupleId)
  return rows.map(normalizeRule)
}

export async function fetchRuleByIdCompat(
  prisma: PrismaClient,
  ruleId: string
): Promise<CompatRule | null> {
  const rawQueryClient = getRawQueryClient(prisma)
  if (!rawQueryClient) {
    const row = await prisma.rule.findUnique({ where: { id: ruleId } })
    return row ? normalizeRule(row as unknown as RawRuleRow) : null
  }

  const columns = await getRuleColumns(prisma)
  const sql = `
    ${buildRuleSelect(columns)}
    WHERE "id" = ?
    LIMIT 1
  `

  const rows = await rawQueryClient.$queryRawUnsafe<RawRuleRow[]>(sql, ruleId)
  return rows[0] ? normalizeRule(rows[0]) : null
}

export async function createRuleCompat(
  prisma: PrismaClient,
  data: CompatRuleCreateInput
): Promise<CompatRule> {
  const rawWriteClient = getRawWriteClient(prisma)
  if (!rawWriteClient) {
    const row = await prisma.rule.create({ data })
    return normalizeRule(row as unknown as RawRuleRow)
  }

  const columns = await getRuleColumns(prisma)
  const entries = buildMutationEntries(columns, data)
  const placeholders = entries.map(() => '?').join(', ')
  const sql = `
    INSERT INTO "rules" (${entries.map((entry) => `"${entry.column}"`).join(', ')})
    VALUES (${placeholders})
  `

  await rawWriteClient.$executeRawUnsafe(sql, ...entries.map((entry) => entry.value))

  const created = data.id ? await fetchRuleByIdCompat(prisma, data.id) : null
  if (!created) throw new Error('Created rule could not be loaded')
  return created
}

export async function updateRuleCompat(
  prisma: PrismaClient,
  ruleId: string,
  data: CompatRuleMutationInput
): Promise<CompatRule | null> {
  const rawWriteClient = getRawWriteClient(prisma)
  if (!rawWriteClient) {
    const row = await prisma.rule.update({ where: { id: ruleId }, data })
    return normalizeRule(row as unknown as RawRuleRow)
  }

  const columns = await getRuleColumns(prisma)
  const entries = buildMutationEntries(columns, data)
  if (entries.length > 0) {
    const sql = `
      UPDATE "rules"
      SET ${entries.map((entry) => `"${entry.column}" = ?`).join(', ')}
      WHERE "id" = ?
    `

    await rawWriteClient.$executeRawUnsafe(sql, ...entries.map((entry) => entry.value), ruleId)
  }

  return fetchRuleByIdCompat(prisma, ruleId)
}

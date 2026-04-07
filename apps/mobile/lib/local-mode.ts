import * as SecureStore from 'expo-secure-store'
import type { CreateRuleInput, Event, Rule } from './api'

const KEY_LOCAL_RULES = 'fny_local_rules'
const KEY_LOCAL_EVENTS = 'fny_local_events'

function scopedKey(base: string, userId: string | null) {
  return `${base}_${userId ?? 'guest'}`
}

function buildLocalId(prefix: 'rule' | 'event') {
  return `local_${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function safeParseArray<T>(raw: string | null): T[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function getLocalRules(userId: string | null): Promise<Rule[]> {
  const raw = await SecureStore.getItemAsync(scopedKey(KEY_LOCAL_RULES, userId))
  return safeParseArray<Rule>(raw)
}

export async function setLocalRules(userId: string | null, rules: Rule[]): Promise<void> {
  await SecureStore.setItemAsync(scopedKey(KEY_LOCAL_RULES, userId), JSON.stringify(rules))
}

export async function getLocalEvents(userId: string | null): Promise<Event[]> {
  const raw = await SecureStore.getItemAsync(scopedKey(KEY_LOCAL_EVENTS, userId))
  return safeParseArray<Event>(raw)
}

export async function setLocalEvents(userId: string | null, events: Event[]): Promise<void> {
  await SecureStore.setItemAsync(scopedKey(KEY_LOCAL_EVENTS, userId), JSON.stringify(events))
}

export async function createLocalRule(input: CreateRuleInput, userId: string | null): Promise<Rule> {
  const rules = await getLocalRules(userId)
  const rule: Rule = {
    id: buildLocalId('rule'),
    title: input.title.trim(),
    objective: input.objective ?? null,
    start_date: input.start_date ?? null,
    recurrence_type: input.recurrence_type ?? null,
    recurrence_interval: input.recurrence_interval ?? 1,
    days_of_week: input.days_of_week ?? null,
    day_of_month: input.day_of_month ?? null,
    time_of_day: input.time_of_day ?? null,
    mode: input.mode ?? 'routine',
    category: input.category ?? null,
    point_value: input.point_value,
    threshold: input.threshold,
    thank_you_threshold: input.thank_you_threshold ?? 5,
    nobishiro_threshold: input.nobishiro_threshold ?? 3,
    creator_user_id: userId,
    assignee: input.assignee ?? 'both',
    recorder: input.recorder ?? 'self',
    active: true,
    reminder_enabled: input.reminder_enabled ?? false,
    reminder_time: input.reminder_time ?? null,
  }

  await setLocalRules(userId, [rule, ...rules])
  return rule
}

export async function updateLocalRule(
  userId: string | null,
  ruleId: string,
  input: Partial<CreateRuleInput & { active: boolean }>
): Promise<Rule | null> {
  const rules = await getLocalRules(userId)
  let updatedRule: Rule | null = null

  const updated = rules.map((rule) => {
    if (rule.id !== ruleId) return rule
    updatedRule = {
      ...rule,
      title: input.title?.trim() ?? rule.title,
      objective: input.objective ?? rule.objective,
      start_date: input.start_date === undefined ? rule.start_date : input.start_date,
      recurrence_type:
        input.recurrence_type === undefined ? rule.recurrence_type : input.recurrence_type,
      recurrence_interval: input.recurrence_interval ?? rule.recurrence_interval,
      days_of_week: input.days_of_week === undefined ? rule.days_of_week : input.days_of_week,
      day_of_month: input.day_of_month === undefined ? rule.day_of_month : input.day_of_month,
      time_of_day: input.time_of_day === undefined ? rule.time_of_day : input.time_of_day,
      mode: input.mode ?? rule.mode,
      category: input.category === undefined ? rule.category : input.category ?? null,
      point_value: input.point_value ?? rule.point_value,
      assignee: input.assignee ?? rule.assignee,
      recorder: input.recorder ?? rule.recorder,
      active: input.active ?? rule.active,
      reminder_enabled: input.reminder_enabled ?? rule.reminder_enabled,
      reminder_time: input.reminder_time === undefined ? rule.reminder_time : input.reminder_time,
    }
    return updatedRule
  })

  await setLocalRules(userId, updated)
  return updatedRule
}

export async function archiveLocalRule(userId: string | null, ruleId: string): Promise<void> {
  await updateLocalRule(userId, ruleId, { active: false })
}

export async function createLocalEvent(
  userId: string | null,
  ruleId: string,
  note?: string | null,
  occurredOn?: string | null
): Promise<Event> {
  const events = await getLocalEvents(userId)
  const event: Event = {
    id: buildLocalId('event'),
    rule_id: ruleId,
    status: 'approved',
    report_type: 'self',
    note: note ?? null,
    created_at: new Date().toISOString(),
    occurred_on: occurredOn ?? null,
  }
  await setLocalEvents(userId, [event, ...events])
  return event
}

export async function clearLocalModeData(userId: string | null): Promise<void> {
  await SecureStore.deleteItemAsync(scopedKey(KEY_LOCAL_RULES, userId))
  await SecureStore.deleteItemAsync(scopedKey(KEY_LOCAL_EVENTS, userId))
}

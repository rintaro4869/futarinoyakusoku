import { getToken, setToken, setUserId, setCoupleId } from './storage'
import { getLocaleTag } from './i18n'

const API_BASE = 'https://pairlog-api.rintaro4869.workers.dev/api/v1'

let isRefreshing = false

async function rawFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined ?? {}),
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    return await fetch(`${API_BASE}${path}`, { ...options, headers, signal: controller.signal })
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      throw Object.assign(new Error('通信がタイムアウトしました'), { code: 'TIMEOUT' })
    }
    throw Object.assign(new Error('通信エラー'), { code: 'NETWORK_ERROR' })
  } finally {
    clearTimeout(timeoutId)
  }
}

async function tryRefreshToken(): Promise<boolean> {
  if (isRefreshing) return false
  isRefreshing = true
  try {
    const res = await rawFetch('/auth/refresh', { method: 'POST' })
    if (!res.ok) return false
    const data = await res.json() as { device_token: string }
    await setToken(data.device_token)
    return true
  } catch {
    return false
  } finally {
    isRefreshing = false
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let res = await rawFetch(path, options)

  // 401 かつリフレッシュ対象外パスなら自動リフレッシュを試行
  if (res.status === 401 && path !== '/auth/refresh' && path !== '/auth/login') {
    const refreshed = await tryRefreshToken()
    if (refreshed) {
      res = await rawFetch(path, options)
    }
  }

  // 503 メンテナンスモード
  if (res.status === 503) {
    const err = await res.json().catch(() => ({ code: 'MAINTENANCE', message: 'メンテナンス中です' }))
    throw Object.assign(new Error(err.message ?? 'メンテナンス中です'), { code: 'MAINTENANCE', status: 503 })
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ code: 'NETWORK_ERROR', message: '通信エラー' }))
    throw Object.assign(new Error(err.message ?? 'API Error'), { code: err.code, status: res.status })
  }
  if (res.status === 204) return undefined as unknown as T
  return res.json()
}

// Auth
export async function createAnonymousUser(locale = getLocaleTag(), timezone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  const data = await apiFetch<{ user_id: string; device_token: string }>('/auth/anonymous', {
    method: 'POST',
    body: JSON.stringify({ locale, timezone }),
  })
  await setToken(data.device_token)
  await setUserId(data.user_id)
  return data
}

// メール+パスワードで新規登録
export async function registerUser(email: string, password: string, locale = getLocaleTag(), timezone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  const data = await apiFetch<{ user_id: string; device_token: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, locale, timezone }),
  })
  await setToken(data.device_token)
  await setUserId(data.user_id)
  return data
}

// メール+パスワードでログイン
export async function loginUser(email: string, password: string) {
  const data = await apiFetch<{ user_id: string; device_token: string; couple_id: string | null }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  await setToken(data.device_token)
  await setUserId(data.user_id)
  await setCoupleId(data.couple_id ?? null)
  return data
}

// Couple
export async function createCouple(displayName: string) {
  const data = await apiFetch<{ couple_id: string; invite_code: string; invite_url: string }>('/couples', {
    method: 'POST',
    body: JSON.stringify({ display_name: displayName }),
  })
  await setCoupleId(data.couple_id)
  return data
}

export async function joinCouple(inviteCode: string, displayName: string) {
  const data = await apiFetch<{ couple_id: string; member_token: string; status: string }>('/couples/join', {
    method: 'POST',
    body: JSON.stringify({ invite_code: inviteCode, display_name: displayName }),
  })
  await setToken(data.member_token)
  await setCoupleId(data.couple_id)
  return data
}

export async function getCoupleStatus(coupleId: string) {
  return apiFetch<{ couple_id: string; status: string; invite_code: string | null; invite_url: string | null }>(`/couples/${coupleId}`)
}

export async function leaveCouple(coupleId: string) {
  return apiFetch<{ status: string }>(`/couples/${coupleId}/leave`, { method: 'POST' })
}

// Rules
export async function getRules(coupleId: string) {
  return apiFetch<{ items: Rule[] }>(`/couples/${coupleId}/rules`)
}

export async function createRule(coupleId: string, data: CreateRuleInput) {
  return apiFetch<Rule>(`/couples/${coupleId}/rules`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateRule(ruleId: string, data: Partial<CreateRuleInput & { active: boolean }>) {
  return apiFetch<Rule>(`/rules/${ruleId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function archiveRule(ruleId: string) {
  return apiFetch<void>(`/rules/${ruleId}`, { method: 'DELETE' })
}

// Events
export async function getEvents(coupleId: string, status?: string) {
  const q = status ? `?status=${status}` : ''
  return apiFetch<{ items: Event[] }>(`/couples/${coupleId}/events${q}`)
}

export async function createEvent(ruleId: string, data: CreateEventInput) {
  return apiFetch<Event>(`/rules/${ruleId}/events`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function approveEvent(eventId: string) {
  return apiFetch<Event>(`/events/${eventId}/approve`, { method: 'POST' })
}

export async function rejectEvent(eventId: string) {
  return apiFetch<Event>(`/events/${eventId}/reject`, { method: 'POST' })
}

// Repairs
export async function getRepairs(coupleId: string, status?: string) {
  const q = status ? `?status=${status}` : ''
  return apiFetch<{ items: RepairAction[] }>(`/couples/${coupleId}/repairs${q}`)
}

export async function createRepair(coupleId: string, data: CreateRepairInput) {
  return apiFetch<RepairAction>(`/couples/${coupleId}/repairs`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function completeRepair(repairId: string) {
  return apiFetch<RepairAction>(`/repairs/${repairId}/complete`, { method: 'POST' })
}

export async function getRepairTemplates() {
  return apiFetch<{ items: RepairTemplate[] }>('/repair-templates')
}

// Summary
export async function getHomeSummary(coupleId: string) {
  return apiFetch<HomeSummary>(`/couples/${coupleId}/home`)
}

export async function getWeeklySummary(coupleId: string, week?: string) {
  const q = week ? `?week=${week}` : ''
  return apiFetch<WeeklySummary>(`/couples/${coupleId}/weekly-summary${q}`)
}

// Safety
export async function pauseCouple(coupleId: string) {
  return apiFetch<{ status: string }>(`/couples/${coupleId}/safety/pause`, { method: 'POST' })
}

export async function unpauseCouple(coupleId: string) {
  return apiFetch<{ status: string }>(`/couples/${coupleId}/safety/unpause`, { method: 'POST' })
}

// Privacy
export async function deleteUserData(userId: string) {
  return apiFetch<void>(`/users/${userId}/data`, { method: 'DELETE' })
}

// Password Reset
export async function requestPasswordReset(email: string) {
  return apiFetch<{ ok: true }>('/auth/request-reset', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function resetPassword(email: string, code: string, newPassword: string) {
  const data = await apiFetch<{ user_id: string; device_token: string; couple_id: string | null }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, code, new_password: newPassword }),
  })
  await setToken(data.device_token)
  await setUserId(data.user_id)
  await setCoupleId(data.couple_id ?? null)
  return data
}

// Types
export interface Rule {
  id: string
  title: string
  objective: string | null
  start_date: string | null
  recurrence_type: 'daily' | 'weekly' | 'monthly' | null
  recurrence_interval: number
  days_of_week: number[] | null
  day_of_month: number | null
  time_of_day: string | null
  mode: 'routine' | 'adhoc'
  category: string | null
  point_value: number
  threshold: number
  thank_you_threshold: number
  nobishiro_threshold: number
  creator_user_id: string | null
  assignee: 'self' | 'partner' | 'both'
  recorder: 'self' | 'partner'
  active: boolean
  reminder_enabled: boolean
  reminder_time: string | null
}

export interface CreateRuleInput {
  title: string
  objective?: string
  start_date?: string | null
  recurrence_type?: 'daily' | 'weekly' | 'monthly' | null
  recurrence_interval?: number
  days_of_week?: number[] | null
  day_of_month?: number | null
  time_of_day?: string | null
  mode?: 'routine' | 'adhoc'
  category?: string
  point_value: number
  threshold: number
  thank_you_threshold?: number
  nobishiro_threshold?: number
  assignee?: 'self' | 'partner' | 'both'
  recorder?: 'self' | 'partner'
  reminder_enabled?: boolean
  reminder_time?: string | null
}

export interface Event {
  id: string
  rule_id: string
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  report_type: 'self' | 'partner'
  note: string | null
  created_at: string
  occurred_on?: string | null
}

export interface CreateEventInput {
  note?: string
  occurred_on?: string
}

export interface RepairAction {
  id: string
  trigger_event_id: string | null
  template_id: string
  assignee_user_id: string
  status: 'open' | 'completed' | 'skipped' | 'expired'
  due_at: string | null
}

export interface CreateRepairInput {
  trigger_event_id?: string | null
  template_id: string
  assignee_user_id: string
  due_at?: string
}

export interface RepairTemplate {
  id: string
  category: 'thank_you' | 'nobishiro' | string
  label: string
  description: string
  active: boolean
}

export interface HomeSummary {
  week_key: string
  my_name: string
  partner_name: string
  my_thank_you: number
  my_nobishiro: number
  partner_thank_you: number
  partner_nobishiro: number
  pending_events: number
  open_repairs: number
  rules: Array<{
    rule_id: string
    title: string
    mode: string
    category: string | null
    start_date: string | null
    recurrence_type: 'daily' | 'weekly' | 'monthly' | null
    recurrence_interval: number
    days_of_week: number[] | null
    day_of_month: number | null
    time_of_day: string | null
    count: number
    point_value: number
    thank_you_threshold: number
    nobishiro_threshold: number
  }>
}

export interface WeeklySummary {
  week_key: string
  thank_you_total: number
  nobishiro_total: number
  approval_rate: number
  repair_completion_rate: number
  bias_alert: boolean
  by_rule: Array<{
    rule_id: string
    title: string
    mode: string
    approved_count: number
    rejected_count: number
    expired_count: number
  }>
}

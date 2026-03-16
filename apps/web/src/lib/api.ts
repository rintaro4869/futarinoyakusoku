function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') {
      // Local dev: route through Next.js rewrite to avoid browser CORS/network issues.
      return '/api/v1'
    }
  }
  return process.env.NEXT_PUBLIC_API_URL ?? 'https://pairlog-api.rintaro4869.workers.dev/api/v1'
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('fny_token')
}

function setToken(token: string) {
  localStorage.setItem('fny_token', token)
}

function getUserId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('fny_user_id')
}

function setUserId(id: string) {
  localStorage.setItem('fny_user_id', id)
}

function getCoupleId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('fny_couple_id')
}

function setCoupleId(id: string) {
  localStorage.setItem('fny_couple_id', id)
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${getApiBase()}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ code: 'NETWORK_ERROR', message: '通信エラー' }))
    throw Object.assign(new Error(err.message ?? 'API Error'), { code: err.code, status: res.status })
  }
  if (res.status === 204) return undefined as unknown as T
  return res.json()
}

// Auth
export async function createAnonymousUser(locale = 'ja-JP', timezone = 'Asia/Tokyo') {
  const data = await apiFetch<{ user_id: string; device_token: string }>('/auth/anonymous', {
    method: 'POST',
    body: JSON.stringify({ locale, timezone }),
  })
  setToken(data.device_token)
  setUserId(data.user_id)
  return data
}

// Couple
export async function createCouple(displayName: string) {
  const data = await apiFetch<{ couple_id: string; invite_code: string; invite_url: string }>('/couples', {
    method: 'POST',
    body: JSON.stringify({ display_name: displayName }),
  })
  setCoupleId(data.couple_id)
  return data
}

export async function joinCouple(inviteCode: string, displayName: string) {
  const data = await apiFetch<{ couple_id: string; member_token: string; status: string }>('/couples/join', {
    method: 'POST',
    body: JSON.stringify({ invite_code: inviteCode, display_name: displayName }),
  })
  setToken(data.member_token)
  setCoupleId(data.couple_id)
  return data
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

export async function trackHelpClick(coupleId?: string) {
  return apiFetch<void>('/support/help-link-clicked', {
    method: 'POST',
    body: JSON.stringify({ couple_id: coupleId }),
  })
}

// Privacy
export async function deleteUserData(userId: string) {
  return apiFetch<void>(`/users/${userId}/data`, { method: 'DELETE' })
}

// Storage helpers
export { getToken, setToken, getUserId, setUserId, getCoupleId, setCoupleId }

// Types
export interface Rule {
  id: string
  title: string
  objective: string | null
  mode: 'routine' | 'adhoc'
  point_value: number
  threshold: number
  thank_you_threshold: number
  nobishiro_threshold: number
  active: boolean
}

export interface CreateRuleInput {
  title: string
  objective?: string
  mode?: 'routine' | 'adhoc'
  point_value: number
  threshold: number
  thank_you_threshold?: number
  nobishiro_threshold?: number
}

export interface Event {
  id: string
  rule_id: string
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  report_type: 'self' | 'partner'
  note: string | null
  created_at: string
}

export interface CreateEventInput {
  target_user_id: string
  report_type: 'self' | 'partner'
  note?: string
}

export interface RepairAction {
  id: string
  trigger_event_id: string
  template_id: string
  assignee_user_id: string
  status: 'open' | 'completed' | 'skipped' | 'expired'
  due_at: string | null
}

export interface CreateRepairInput {
  trigger_event_id: string
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
  thank_you_total: number
  nobishiro_total: number
  pending_events: number
  open_repairs: number
  rules: Array<{ rule_id: string; title: string; mode: string; count: number; thank_you_threshold: number; nobishiro_threshold: number }>
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

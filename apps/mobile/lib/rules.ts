export type RuleMode = 'routine' | 'adhoc'
export type RuleFrequency = '毎日' | '毎週' | '平日のみ' | '週末' | '毎月'

export const DAYS = ['月', '火', '水', '木', '金', '土', '日'] as const
export const WEEKDAY_INDICES = [0, 1, 2, 3, 4]
export const WEEKEND_INDICES = [5, 6]

export type RuleCategory =
  | '連絡・共有'
  | '予定変更'
  | '子育て'
  | '家事分担'
  | '感謝'
  | 'ふりかえり'
  | '生活リズム'

export type RuleSuggestion = {
  id: string
  title: string
  mode: RuleMode
  freq: RuleFrequency
  selectedDays: number[]
  helper: string
  category: RuleCategory
}

// ─── i18n マッピング定数 ──────────────────────────────────
// 内部キー（日本語）→ i18nの辞書キー の対応表。
// rules.ts 自体は i18n モジュールをインポートしない（テスト互換性のため）。
// コンポーネント側で t(CATEGORY_I18N_KEY[cat]) のように使う。

export const CATEGORY_I18N_KEY: Record<RuleCategory, string> = {
  '連絡・共有': 'categories.communication',
  '予定変更': 'categories.schedule_change',
  '子育て': 'categories.childcare',
  '家事分担': 'categories.housework',
  '感謝': 'categories.gratitude',
  'ふりかえり': 'categories.reflection',
  '生活リズム': 'categories.lifestyle',
}

export const FREQ_I18N_KEY: Record<RuleFrequency, string> = {
  '毎日': 'rule.freq_daily',
  '毎週': 'rule.freq_weekly',
  '平日のみ': 'rule.freq_weekdays',
  '週末': 'rule.freq_weekend',
  '毎月': 'rule.freq_monthly',
}

export const DAY_I18N_KEYS = [
  'days.mon', 'days.tue', 'days.wed', 'days.thu',
  'days.fri', 'days.sat', 'days.sun',
] as const

export type RecurrenceType = 'daily' | 'weekly' | 'monthly'

export type RuleScheduleConfig = {
  recurrenceType: RecurrenceType | null
  recurrenceInterval: number
  daysOfWeek: number[]
  dayOfMonth: number | null
  timeOfDay: string | null
}

export function toDateOnlyString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDaysToDateOnly(dateOnly: string, days: number) {
  const [year, month, day] = dateOnly.split('-').map(Number)
  const date = new Date(year, (month ?? 1) - 1, day ?? 1)
  date.setDate(date.getDate() + days)
  return toDateOnlyString(date)
}

export function formatDateOnlyLabel(dateOnly?: string | null, translate?: (key: string, params?: Record<string, string | number>) => string) {
  if (!dateOnly) return translate ? translate('rule.date_no_start') : '開始日未設定'
  const [year, month, day] = dateOnly.split('-').map(Number)
  if (!year || !month || !day) return dateOnly
  const date = new Date(year, month - 1, day)
  const jsDay = date.getDay()
  const dayIndex = jsDay === 0 ? 6 : jsDay - 1
  if (translate) {
    const dayName = translate(DAY_I18N_KEYS[dayIndex])
    return translate('rule.date_format', { month, day, dayName })
  }
  const dayLabel = DAYS[dayIndex]
  return `${month}/${day}（${dayLabel}）`
}

function normalizeDaysOfWeek(days?: number[] | string | null) {
  if (!days) return []
  const raw = Array.isArray(days)
    ? days
    : days.split(',').map((value) => Number(value.trim()))

  return [...new Set(
    raw.filter((value) => Number.isInteger(value) && value >= 0 && value <= 6)
  )].sort((a, b) => a - b)
}

function isOnOrAfterStartDate(date: Date, startDate?: string | null) {
  if (!startDate) return true
  const [year, month, day] = startDate.split('-').map(Number)
  if (!year || !month || !day) return true
  const start = new Date(year, month - 1, day)
  start.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  return target >= start
}

// suggestion の構造データ（タイトル・ヘルパーは i18n キーで参照）
const SUGGESTION_DATA: Array<Omit<RuleSuggestion, 'title' | 'helper'> & { titleKey: string; helperKey: string }> = [
  { id: 'reply-same-day', titleKey: 'suggestions.reply_same_day_title', helperKey: 'suggestions.reply_same_day_helper', mode: 'routine', freq: '毎日', selectedDays: [], category: '連絡・共有' },
  { id: 'share-plan-morning', titleKey: 'suggestions.share_plan_morning_title', helperKey: 'suggestions.share_plan_morning_helper', mode: 'routine', freq: '平日のみ', selectedDays: [0, 1, 2, 3, 4], category: '連絡・共有' },
  { id: 'weekly-check-in', titleKey: 'suggestions.weekly_check_in_title', helperKey: 'suggestions.weekly_check_in_helper', mode: 'routine', freq: '毎週', selectedDays: [6], category: '連絡・共有' },
  { id: 'share-schedule-change', titleKey: 'suggestions.share_schedule_change_title', helperKey: 'suggestions.share_schedule_change_helper', mode: 'adhoc', freq: '毎日', selectedDays: [], category: '予定変更' },
  { id: 'late-home-notify', titleKey: 'suggestions.late_home_notify_title', helperKey: 'suggestions.late_home_notify_helper', mode: 'adhoc', freq: '毎日', selectedDays: [], category: '予定変更' },
  { id: 'nursery-pickup', titleKey: 'suggestions.nursery_pickup_title', helperKey: 'suggestions.nursery_pickup_helper', mode: 'routine', freq: '毎週', selectedDays: [1, 3], category: '子育て' },
  { id: 'school-bag-check', titleKey: 'suggestions.school_bag_check_title', helperKey: 'suggestions.school_bag_check_helper', mode: 'routine', freq: '平日のみ', selectedDays: [0, 1, 2, 3, 4], category: '子育て' },
  { id: 'bedtime-together', titleKey: 'suggestions.bedtime_together_title', helperKey: 'suggestions.bedtime_together_helper', mode: 'routine', freq: '毎週', selectedDays: [0, 2, 4], category: '子育て' },
  { id: 'weekly-meal', titleKey: 'suggestions.weekly_meal_title', helperKey: 'suggestions.weekly_meal_helper', mode: 'routine', freq: '毎週', selectedDays: [5], category: '家事分担' },
  { id: 'grocery-shopping', titleKey: 'suggestions.grocery_shopping_title', helperKey: 'suggestions.grocery_shopping_helper', mode: 'routine', freq: '毎週', selectedDays: [5], category: '家事分担' },
  { id: 'trash-out', titleKey: 'suggestions.trash_out_title', helperKey: 'suggestions.trash_out_helper', mode: 'routine', freq: '毎週', selectedDays: [0, 3], category: '家事分担' },
  { id: 'say-thanks', titleKey: 'suggestions.say_thanks_title', helperKey: 'suggestions.say_thanks_helper', mode: 'adhoc', freq: '毎日', selectedDays: [], category: '感謝' },
  { id: 'notice-effort', titleKey: 'suggestions.notice_effort_title', helperKey: 'suggestions.notice_effort_helper', mode: 'adhoc', freq: '毎日', selectedDays: [], category: '感謝' },
  { id: 'weekly-review', titleKey: 'suggestions.weekly_review_title', helperKey: 'suggestions.weekly_review_helper', mode: 'routine', freq: '毎週', selectedDays: [6], category: 'ふりかえり' },
  { id: 'monthly-review', titleKey: 'suggestions.monthly_review_title', helperKey: 'suggestions.monthly_review_helper', mode: 'routine', freq: '毎週', selectedDays: [6], category: 'ふりかえり' },
  { id: 'lights-out', titleKey: 'suggestions.lights_out_title', helperKey: 'suggestions.lights_out_helper', mode: 'routine', freq: '平日のみ', selectedDays: [0, 1, 2, 3, 4], category: '生活リズム' },
  { id: 'no-phone-dinner', titleKey: 'suggestions.no_phone_dinner_title', helperKey: 'suggestions.no_phone_dinner_helper', mode: 'routine', freq: '毎日', selectedDays: [], category: '生活リズム' },
]

/**
 * ローカライズ済みの提案一覧を返す。
 * translate に t() を渡すことで、表示言語に応じたタイトル・ヘルパーを生成する。
 */
export function getRuleSuggestions(translate: (key: string) => string): RuleSuggestion[] {
  return SUGGESTION_DATA.map((s) => ({
    id: s.id,
    title: translate(s.titleKey),
    mode: s.mode,
    freq: s.freq,
    selectedDays: [...s.selectedDays],
    helper: translate(s.helperKey),
    category: s.category,
  }))
}

export function buildObjective(mode: RuleMode, freq: string, days: number[], monthDay?: number): string | undefined {
  if (mode === 'adhoc') return undefined
  if (freq === '毎日') return '毎日'
  if (freq === '平日のみ') return '平日のみ（月〜金）'
  if (freq === '週末') return '週末（土・日）'
  if (freq === '毎月') return `毎月 ${monthDay ?? 1}日`
  if (freq === '毎週' && days.length > 0) {
    const labels = [...days].sort().map((i) => DAYS[i]).join('・')
    return `毎週 ${labels}`
  }
  return '毎週'
}

export function buildScheduleConfig(
  mode: RuleMode,
  freq: RuleFrequency,
  days: number[],
  monthDay?: number,
  timeOfDay?: string | null
): RuleScheduleConfig {
  if (mode === 'adhoc') {
    return {
      recurrenceType: null,
      recurrenceInterval: 1,
      daysOfWeek: [],
      dayOfMonth: null,
      timeOfDay: null,
    }
  }

  if (freq === '毎月') {
    return {
      recurrenceType: 'monthly',
      recurrenceInterval: 1,
      daysOfWeek: [],
      dayOfMonth: monthDay ?? 1,
      timeOfDay: timeOfDay ?? null,
    }
  }

  if (freq === '毎週' || freq === '平日のみ' || freq === '週末') {
    return {
      recurrenceType: 'weekly',
      recurrenceInterval: 1,
      daysOfWeek: normalizeDaysOfWeek(days),
      dayOfMonth: null,
      timeOfDay: timeOfDay ?? null,
    }
  }

  return {
    recurrenceType: 'daily',
    recurrenceInterval: 1,
    daysOfWeek: [],
    dayOfMonth: null,
    timeOfDay: timeOfDay ?? null,
  }
}

export function parseObjective(
  objective: string,
  mode: string
): { freq: RuleFrequency; selectedDays: number[]; monthDay?: number } {
  if (mode === 'adhoc') return { freq: '毎日', selectedDays: [] }
  if (!objective || objective === '毎日') return { freq: '毎日', selectedDays: [] }
  if (objective.includes('平日のみ')) return { freq: '平日のみ', selectedDays: [...WEEKDAY_INDICES] }
  if (objective.includes('週末')) return { freq: '週末', selectedDays: [...WEEKEND_INDICES] }
  if (objective.startsWith('毎月')) {
    const match = objective.match(/毎月\s*(\d+)日/)
    const monthDay = match ? parseInt(match[1], 10) : 1
    return { freq: '毎月', selectedDays: [], monthDay }
  }
  if (objective.startsWith('毎週')) {
    const dayPart = objective.replace('毎週', '').trim()
    if (!dayPart) return { freq: '毎週', selectedDays: [] }
    const dayLabels = dayPart.split('・')
    const selectedDays = dayLabels
      .map((d) => (DAYS as readonly string[]).indexOf(d))
      .filter((i) => i !== -1)
    return { freq: '毎週', selectedDays }
  }
  return { freq: '毎日', selectedDays: [] }
}

export function parseRuleSchedule(input: {
  objective?: string | null
  mode: string
  recurrenceType?: string | null
  recurrenceInterval?: number | null
  daysOfWeek?: number[] | string | null
  dayOfMonth?: number | null
  timeOfDay?: string | null
}): {
  freq: RuleFrequency
  selectedDays: number[]
  monthDay?: number
  timeOfDay: string | null
  recurrenceType: RecurrenceType | null
  recurrenceInterval: number
} {
  if (input.mode === 'adhoc') {
    return {
      freq: '毎日',
      selectedDays: [],
      timeOfDay: null,
      recurrenceType: null,
      recurrenceInterval: 1,
    }
  }

  const recurrenceType = (input.recurrenceType ?? null) as RecurrenceType | null
  const recurrenceInterval = input.recurrenceInterval && input.recurrenceInterval > 0
    ? input.recurrenceInterval
    : 1

  if (recurrenceType === 'monthly') {
    return {
      freq: '毎月',
      selectedDays: [],
      monthDay: input.dayOfMonth ?? 1,
      timeOfDay: input.timeOfDay ?? null,
      recurrenceType,
      recurrenceInterval,
    }
  }

  if (recurrenceType === 'weekly') {
    const selectedDays = normalizeDaysOfWeek(input.daysOfWeek)
    const isWeekdays = selectedDays.length === WEEKDAY_INDICES.length && selectedDays.every((day, idx) => day === WEEKDAY_INDICES[idx])
    const isWeekends = selectedDays.length === WEEKEND_INDICES.length && selectedDays.every((day, idx) => day === WEEKEND_INDICES[idx])

    return {
      freq: isWeekdays ? '平日のみ' : isWeekends ? '週末' : '毎週',
      selectedDays,
      timeOfDay: input.timeOfDay ?? null,
      recurrenceType,
      recurrenceInterval,
    }
  }

  if (recurrenceType === 'daily') {
    return {
      freq: '毎日',
      selectedDays: [],
      timeOfDay: input.timeOfDay ?? null,
      recurrenceType,
      recurrenceInterval,
    }
  }

  const parsed = parseObjective(input.objective ?? '', input.mode)
  return {
    ...parsed,
    timeOfDay: input.timeOfDay ?? null,
    recurrenceType: buildScheduleConfig(input.mode as RuleMode, parsed.freq, parsed.selectedDays, parsed.monthDay, input.timeOfDay ?? null).recurrenceType,
    recurrenceInterval,
  }
}

export function getRuleModeLabel(mode: RuleMode, translate?: (key: string) => string) {
  if (translate) return translate(mode === 'routine' ? 'rule.mode_label_routine' : 'rule.mode_label_adhoc')
  return mode === 'routine' ? '約束' : 'ありがとう'
}

// 0=月, 1=火, ..., 5=土, 6=日  (JS: 0=日→6, 1=月→0 に変換)
export function getTodayDayIndex(): number {
  const jsDay = new Date().getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  return jsDay === 0 ? 6 : jsDay - 1  // 0=月, ..., 6=日
}

export function isRuleActiveOnDate(
  objective: string | null,
  mode: RuleMode,
  date: Date,
  startDate?: string | null,
  options?: {
    recurrenceType?: string | null
    recurrenceInterval?: number | null
    daysOfWeek?: number[] | string | null
    dayOfMonth?: number | null
  }
): boolean {
  if (!isOnOrAfterStartDate(date, startDate)) return false
  if (mode === 'adhoc') return true
  if (!objective && !options?.recurrenceType) return false
  const { freq, selectedDays, monthDay } = parseRuleSchedule({
    objective,
    mode,
    recurrenceType: options?.recurrenceType,
    recurrenceInterval: options?.recurrenceInterval,
    daysOfWeek: options?.daysOfWeek,
    dayOfMonth: options?.dayOfMonth,
  })
  const jsDay = date.getDay()
  const today = jsDay === 0 ? 6 : jsDay - 1
  if (freq === '毎日') return true
  if (freq === '平日のみ') return today <= 4  // 月〜金
  if (freq === '週末') return today >= 5       // 土・日
  if (freq === '毎月') {
    return date.getDate() === (monthDay ?? 1)
  }
  if (freq === '毎週') return selectedDays.includes(today)
  return false
}

export function isRuleActiveToday(
  objective: string | null,
  mode: RuleMode,
  startDate?: string | null,
  options?: {
    recurrenceType?: string | null
    recurrenceInterval?: number | null
    daysOfWeek?: number[] | string | null
    dayOfMonth?: number | null
  }
): boolean {
  return isRuleActiveOnDate(objective, mode, new Date(), startDate, options)
}

export function getRuleNextAction(mode: RuleMode, pointValue: number, translate?: (key: string, params?: Record<string, string | number>) => string) {
  if (translate) {
    if (mode === 'adhoc') {
      return { title: translate('rule.next_adhoc_title', { n: pointValue }), body: translate('rule.next_adhoc_body') }
    }
    return { title: translate('rule.next_routine_title', { n: pointValue }), body: translate('rule.next_routine_body') }
  }
  if (mode === 'adhoc') {
    return {
      title: `ありがとうを記録 +${pointValue}`,
      body: '相手の嬉しかった行動に気づいたら記録しましょう',
    }
  }
  return {
    title: `約束を記録 +${pointValue}`,
    body: 'ふたりで決めた約束を守れたら記録しましょう',
  }
}

export function getRuleScheduleSummary(
  mode: RuleMode,
  objective?: string | null,
  options?: {
    startDate?: string | null
    recurrenceType?: string | null
    recurrenceInterval?: number | null
    daysOfWeek?: number[] | string | null
    dayOfMonth?: number | null
    timeOfDay?: string | null
    reminderEnabled?: boolean
    reminderTime?: string | null
  },
  translate?: (key: string, params?: Record<string, string | number>) => string,
) {
  const tt = translate
  let base = tt ? tt('rule.schedule_not_set') : '予定はまだ決まっていません'

  if (mode === 'adhoc') {
    base = tt ? tt('rule.schedule_anytime') : 'いつでも記録'
  } else {
    const parsed = parseRuleSchedule({
      objective,
      mode,
      recurrenceType: options?.recurrenceType,
      recurrenceInterval: options?.recurrenceInterval,
      daysOfWeek: options?.daysOfWeek,
      dayOfMonth: options?.dayOfMonth,
      timeOfDay: options?.timeOfDay,
    })

    if (parsed.freq === '毎日') base = tt ? tt('rule.freq_daily') : '毎日'
    else if (parsed.freq === '平日のみ') base = tt ? tt('rule.schedule_weekdays_full') : '平日のみ（月〜金）'
    else if (parsed.freq === '週末') base = tt ? tt('rule.schedule_weekends_full') : '週末（土・日）'
    else if (parsed.freq === '毎月') base = tt ? tt('rule.schedule_monthly_day', { day: parsed.monthDay ?? 1 }) : `毎月 ${parsed.monthDay ?? 1}日`
    else if (parsed.freq === '毎週' && parsed.selectedDays.length > 0) {
      const daysLabel = tt
        ? parsed.selectedDays.map((d) => tt(DAY_I18N_KEYS[d])).join('・')
        : parsed.selectedDays.map((d) => DAYS[d]).join('・')
      base = tt ? tt('rule.schedule_weekly_days', { days: daysLabel }) : `毎週 ${daysLabel}`
    } else if (objective?.trim()) {
      base = objective.trim()
    }

    if (parsed.timeOfDay) {
      base = `${base} ${parsed.timeOfDay}`
    }
  }

  const withStartDate = options?.startDate
    ? `${formatDateOnlyLabel(options.startDate, tt)}から ${base}`
    : base

  if (options?.reminderEnabled && options?.reminderTime) {
    return tt
      ? `${withStartDate} • ${tt('rule.schedule_notify', { time: options.reminderTime })}`
      : `${withStartDate} • ${options.reminderTime}に通知`
  }

  return withStartDate
}

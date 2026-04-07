import { getLocale, t } from './i18n'

const DAY_KEYS = [
  'days.mon',
  'days.tue',
  'days.wed',
  'days.thu',
  'days.fri',
  'days.sat',
  'days.sun',
] as const

function getDayIndex(date: Date): number {
  const jsDay = date.getDay()
  return jsDay === 0 ? 6 : jsDay - 1
}

function getWeekdayLabel(date: Date): string {
  return t(DAY_KEYS[getDayIndex(date)])
}

function formatShortMonthDay(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function formatLongMonthDay(date: Date): string {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const locale = getLocale()

  if (locale === 'ko') {
    return `${month}월 ${day}일`
  }

  if (locale === 'ja' || locale.startsWith('zh')) {
    return `${month}月${day}日`
  }

  return `${month}/${day}`
}

export function formatHomeDateLabel(date: Date): string {
  const locale = getLocale()
  const dateLabel = formatLongMonthDay(date)
  const weekday = getWeekdayLabel(date)

  if (locale === 'en' || locale === 'ko') {
    return `${dateLabel} (${weekday})`
  }

  return `${dateLabel}（${weekday}）`
}

export function formatCalendarDateLabel(date: Date): string {
  const locale = getLocale()
  const dateLabel = formatShortMonthDay(date)
  const weekday = getWeekdayLabel(date)

  if (locale === 'en' || locale === 'ko') {
    return `${dateLabel} (${weekday})`
  }

  return `${dateLabel}（${weekday}）`
}

export function formatWeekRangeLabel(start: Date, end: Date): string {
  const separator = getLocale() === 'en' ? ' - ' : '〜'
  return `${formatShortMonthDay(start)}${separator}${formatShortMonthDay(end)}`
}

export function formatIsoWeekRangeLabel(weekKey: string): string {
  try {
    const [yearStr, weekPart] = weekKey.split('-W')
    const year = parseInt(yearStr, 10)
    const week = parseInt(weekPart, 10)
    const jan4 = new Date(year, 0, 4)
    const startOfWeek = new Date(jan4)
    startOfWeek.setDate(jan4.getDate() - jan4.getDay() + 1 + (week - 1) * 7)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    return formatWeekRangeLabel(startOfWeek, endOfWeek)
  } catch {
    return weekKey
  }
}

import { getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek } from 'date-fns'

/** Returns ISO week key like "2026-W11" */
export function getWeekKey(date: Date = new Date()): string {
  const year = getISOWeekYear(date)
  const week = getISOWeek(date)
  return `${year}-W${String(week).padStart(2, '0')}`
}

export function weekKeyToRange(weekKey: string): { start: Date; end: Date } {
  // Parse "2026-W11"
  const [yearStr, wStr] = weekKey.split('-W')
  const year = parseInt(yearStr, 10)
  const week = parseInt(wStr, 10)

  // Find first Thursday of the year, then compute week start
  const jan4 = new Date(year, 0, 4) // Jan 4 is always in week 1
  const startOfWeek1 = startOfISOWeek(jan4)
  const start = new Date(startOfWeek1.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000)
  const end = endOfISOWeek(start)
  return { start, end }
}

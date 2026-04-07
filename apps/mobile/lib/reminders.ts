import { Rule } from './api'
import { isRuleActiveOnDate } from './rules'

export function buildReminderDates(rule: Rule, daysAhead = 30): Date[] {
  if (!rule.reminder_enabled || !rule.reminder_time) return []

  const [hourStr, minuteStr] = rule.reminder_time.split(':')
  const hour = parseInt(hourStr, 10)
  const minute = parseInt(minuteStr, 10)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return []

  const now = new Date()
  const results: Date[] = []

  for (let offset = 0; offset <= daysAhead; offset += 1) {
    const day = new Date(now)
    day.setHours(0, 0, 0, 0)
    day.setDate(day.getDate() + offset)

    if (!isRuleActiveOnDate(rule.objective, rule.mode, day, rule.start_date, {
      recurrenceType: rule.recurrence_type,
      recurrenceInterval: rule.recurrence_interval,
      daysOfWeek: rule.days_of_week,
      dayOfMonth: rule.day_of_month,
    })) {
      continue
    }

    const reminderDate = new Date(day)
    reminderDate.setHours(hour, minute, 0, 0)
    if (reminderDate > now) {
      results.push(reminderDate)
    }
  }

  return results
}

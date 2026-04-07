import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Rule } from '../api'
import { buildReminderDates } from '../reminders'

function makeRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: 'rule_1',
    title: '週1で一緒にごはんを食べる',
    objective: '週1回一緒にごはんを食べる',
    start_date: '2026-03-01',
    recurrence_type: 'weekly',
    recurrence_interval: 1,
    days_of_week: [5],
    day_of_month: null,
    time_of_day: '19:00',
    mode: 'routine',
    category: '家事分担',
    point_value: 10,
    threshold: 5,
    thank_you_threshold: 5,
    nobishiro_threshold: 3,
    creator_user_id: 'user_1',
    assignee: 'both',
    recorder: 'self',
    active: true,
    reminder_enabled: true,
    reminder_time: '18:30',
    ...overrides,
  }
}

describe('buildReminderDates', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('builds upcoming weekly reminders from structured schedule', () => {
    vi.setSystemTime(new Date(2026, 2, 22, 9, 0, 0))

    const reminders = buildReminderDates(
      makeRule({
        recurrence_type: 'weekly',
        days_of_week: [5],
        reminder_time: '19:30',
      }),
      14
    )

    expect(reminders).toHaveLength(2)
    expect(reminders[0].getFullYear()).toBe(2026)
    expect(reminders[0].getMonth()).toBe(2)
    expect(reminders[0].getDate()).toBe(28)
    expect(reminders[0].getHours()).toBe(19)
    expect(reminders[0].getMinutes()).toBe(30)
    expect(reminders[1].getFullYear()).toBe(2026)
    expect(reminders[1].getMonth()).toBe(3)
    expect(reminders[1].getDate()).toBe(4)
    expect(reminders[1].getHours()).toBe(19)
    expect(reminders[1].getMinutes()).toBe(30)
  })

  it('skips reminder times that are already in the past today', () => {
    vi.setSystemTime(new Date(2026, 2, 22, 20, 0, 0))

    const reminders = buildReminderDates(
      makeRule({
        recurrence_type: 'daily',
        days_of_week: null,
        day_of_month: null,
        reminder_time: '19:30',
      }),
      2
    )

    expect(reminders).toHaveLength(2)
    expect(reminders[0].getDate()).toBe(23)
    expect(reminders[0].getHours()).toBe(19)
    expect(reminders[0].getMinutes()).toBe(30)
    expect(reminders[1].getDate()).toBe(24)
    expect(reminders[1].getHours()).toBe(19)
    expect(reminders[1].getMinutes()).toBe(30)
  })

  it('supports monthly reminders from day_of_month', () => {
    vi.setSystemTime(new Date(2026, 2, 22, 9, 0, 0))

    const reminders = buildReminderDates(
      makeRule({
        recurrence_type: 'monthly',
        days_of_week: null,
        day_of_month: 25,
        reminder_time: '08:15',
      }),
      40
    )

    expect(reminders[0].getMonth()).toBe(2)
    expect(reminders[0].getDate()).toBe(25)
    expect(reminders[0].getHours()).toBe(8)
    expect(reminders[0].getMinutes()).toBe(15)
    expect(reminders[1].getMonth()).toBe(3)
    expect(reminders[1].getDate()).toBe(25)
    expect(reminders[1].getHours()).toBe(8)
    expect(reminders[1].getMinutes()).toBe(15)
  })

  it('returns empty when reminders are disabled', () => {
    vi.setSystemTime(new Date(2026, 2, 22, 9, 0, 0))

    expect(buildReminderDates(makeRule({ reminder_enabled: false }), 7)).toEqual([])
  })
})

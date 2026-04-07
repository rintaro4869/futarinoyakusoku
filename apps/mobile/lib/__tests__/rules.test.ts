import { describe, it, expect, vi, afterEach } from 'vitest'
import { getRuleScheduleSummary, isRuleActiveToday, getTodayDayIndex, parseRuleSchedule } from '../rules'

afterEach(() => { vi.useRealTimers() })

// 曜日インデックス: 0=月, 1=火, 2=水, 3=木, 4=金, 5=土, 6=日
// JS の Date.getDay(): 0=日, 1=月, ..., 6=土

// YYYY-MM-DD の月曜=2026-01-05, 火=06, 水=07, 木=08, 金=09, 土=10, 日=11
const DATES = {
  Mon: new Date('2026-01-05').getTime(), // 月
  Tue: new Date('2026-01-06').getTime(), // 火
  Wed: new Date('2026-01-07').getTime(), // 水
  Thu: new Date('2026-01-08').getTime(), // 木
  Fri: new Date('2026-01-09').getTime(), // 金
  Sat: new Date('2026-01-10').getTime(), // 土
  Sun: new Date('2026-01-11').getTime(), // 日
}

function mockDate(ts: number) {
  vi.useFakeTimers()
  vi.setSystemTime(ts)
}

describe('getTodayDayIndex', () => {
  it('日曜 → 6', () => { mockDate(DATES.Sun); expect(getTodayDayIndex()).toBe(6) })
  it('月曜 → 0', () => { mockDate(DATES.Mon); expect(getTodayDayIndex()).toBe(0) })
  it('土曜 → 5', () => { mockDate(DATES.Sat); expect(getTodayDayIndex()).toBe(5) })
  it('水曜 → 2', () => { mockDate(DATES.Wed); expect(getTodayDayIndex()).toBe(2) })
})

describe('isRuleActiveToday', () => {
  it('adhoc は常に true', () => {
    mockDate(DATES.Thu)
    expect(isRuleActiveToday(null, 'adhoc')).toBe(true)
    expect(isRuleActiveToday('毎日', 'adhoc')).toBe(true)
  })

  it('毎日 は常に true', () => {
    mockDate(DATES.Thu)
    expect(isRuleActiveToday('毎日', 'routine')).toBe(true)
  })

  it('平日のみ：月〜金は true', () => {
    mockDate(DATES.Mon); expect(isRuleActiveToday('平日のみ（月〜金）', 'routine')).toBe(true)
    mockDate(DATES.Fri); expect(isRuleActiveToday('平日のみ（月〜金）', 'routine')).toBe(true)
  })

  it('平日のみ：土日は false', () => {
    mockDate(DATES.Sat); expect(isRuleActiveToday('平日のみ（月〜金）', 'routine')).toBe(false)
    mockDate(DATES.Sun); expect(isRuleActiveToday('平日のみ（月〜金）', 'routine')).toBe(false)
  })

  it('週末：土日は true', () => {
    mockDate(DATES.Sat); expect(isRuleActiveToday('週末（土・日）', 'routine')).toBe(true)
    mockDate(DATES.Sun); expect(isRuleActiveToday('週末（土・日）', 'routine')).toBe(true)
  })

  it('週末：平日は false', () => {
    mockDate(DATES.Mon); expect(isRuleActiveToday('週末（土・日）', 'routine')).toBe(false)
  })

  it('毎週 水・金：水曜は true', () => {
    mockDate(DATES.Wed); expect(isRuleActiveToday('毎週 水・金', 'routine')).toBe(true)
    mockDate(DATES.Fri); expect(isRuleActiveToday('毎週 水・金', 'routine')).toBe(true)
  })

  it('毎週 水・金：月曜は false', () => {
    mockDate(DATES.Mon); expect(isRuleActiveToday('毎週 水・金', 'routine')).toBe(false)
  })

  it('objective が null の routine は false', () => {
    mockDate(DATES.Mon)
    expect(isRuleActiveToday(null, 'routine')).toBe(false)
  })

  it('開始日前は false', () => {
    mockDate(DATES.Mon)
    expect(isRuleActiveToday('毎日', 'routine', '2026-01-06')).toBe(false)
  })

  it('開始日当日以降は true', () => {
    mockDate(DATES.Tue)
    expect(isRuleActiveToday('毎日', 'routine', '2026-01-06')).toBe(true)
    mockDate(DATES.Wed)
    expect(isRuleActiveToday('毎日', 'routine', '2026-01-06')).toBe(true)
  })

  it('曜日条件と開始日を両方満たす日にだけ true', () => {
    mockDate(DATES.Mon)
    expect(isRuleActiveToday('毎週 水・金', 'routine', '2026-01-01')).toBe(false)
    mockDate(DATES.Wed)
    expect(isRuleActiveToday('毎週 水・金', 'routine', '2026-01-08')).toBe(false)
    expect(isRuleActiveToday('毎週 水・金', 'routine', '2026-01-07')).toBe(true)
  })

  it('構造化された weekly schedule を優先して判定できる', () => {
    mockDate(DATES.Fri)
    expect(isRuleActiveToday(null, 'routine', '2026-01-01', {
      recurrenceType: 'weekly',
      daysOfWeek: [4],
    })).toBe(true)
    mockDate(DATES.Mon)
    expect(isRuleActiveToday(null, 'routine', '2026-01-01', {
      recurrenceType: 'weekly',
      daysOfWeek: [4],
    })).toBe(false)
  })

  it('構造化された monthly schedule を優先して判定できる', () => {
    mockDate(new Date('2026-01-15').getTime())
    expect(isRuleActiveToday(null, 'routine', '2026-01-01', {
      recurrenceType: 'monthly',
      dayOfMonth: 15,
    })).toBe(true)
  })
})

describe('parseRuleSchedule', () => {
  it('weekly + weekdays を UI 用 frequency に戻せる', () => {
    expect(parseRuleSchedule({
      mode: 'routine',
      recurrenceType: 'weekly',
      daysOfWeek: [0, 1, 2, 3, 4],
    }).freq).toBe('平日のみ')
  })

  it('monthly を monthDay 付きで戻せる', () => {
    const parsed = parseRuleSchedule({
      mode: 'routine',
      recurrenceType: 'monthly',
      dayOfMonth: 12,
      timeOfDay: '19:30',
    })
    expect(parsed.freq).toBe('毎月')
    expect(parsed.monthDay).toBe(12)
    expect(parsed.timeOfDay).toBe('19:30')
  })
})

describe('getRuleScheduleSummary', () => {
  it('構造化 schedule から自然文を作れる', () => {
    expect(getRuleScheduleSummary('routine', null, {
      startDate: '2026-01-05',
      recurrenceType: 'weekly',
      daysOfWeek: [2, 4],
      timeOfDay: '19:00',
    })).toContain('毎週 水・金 19:00')
  })
})

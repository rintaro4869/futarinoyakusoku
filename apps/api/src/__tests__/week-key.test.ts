import { describe, it, expect } from 'vitest'
import { getWeekKey, weekKeyToRange } from '../lib/week-key.js'

describe('getWeekKey', () => {
  it('returns ISO week format YYYY-WNN', () => {
    const key = getWeekKey(new Date('2026-03-10'))
    expect(key).toMatch(/^\d{4}-W\d{2}$/)
    expect(key).toBe('2026-W11')
  })
})

describe('weekKeyToRange', () => {
  it('returns start and end of week', () => {
    const { start, end } = weekKeyToRange('2026-W11')
    expect(start).toBeInstanceOf(Date)
    expect(end).toBeInstanceOf(Date)
    expect(end.getTime()).toBeGreaterThan(start.getTime())
  })
})

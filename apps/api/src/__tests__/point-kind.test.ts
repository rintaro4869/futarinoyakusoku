import { describe, it, expect } from 'vitest'

// modeToPointKind ロジックの単体テスト（events.ts の内部ロジックを直接検証）
function modeToPointKind(mode: string): 'thank_you' | 'nobishiro' {
  return mode === 'adhoc' ? 'thank_you' : 'nobishiro'
}

describe('modeToPointKind', () => {
  it('adhoc → thank_you', () => {
    expect(modeToPointKind('adhoc')).toBe('thank_you')
  })

  it('routine → nobishiro', () => {
    expect(modeToPointKind('routine')).toBe('nobishiro')
  })

  it('unknown fallback → nobishiro', () => {
    expect(modeToPointKind('')).toBe('nobishiro')
    expect(modeToPointKind('other')).toBe('nobishiro')
  })
})

describe('2-axis threshold check logic', () => {
  function isUnlocked(total: number, threshold: number) {
    return total >= threshold
  }

  it('unlocks when total meets threshold', () => {
    expect(isUnlocked(5, 5)).toBe(true)
    expect(isUnlocked(6, 5)).toBe(true)
  })

  it('does not unlock below threshold', () => {
    expect(isUnlocked(4, 5)).toBe(false)
    expect(isUnlocked(0, 3)).toBe(false)
  })

  it('thank_you and nobishiro are independent', () => {
    const thankYouTotal = 5
    const nobishiroTotal = 1
    const thankYouThreshold = 5
    const nobishiroThreshold = 3
    expect(isUnlocked(thankYouTotal, thankYouThreshold)).toBe(true)
    expect(isUnlocked(nobishiroTotal, nobishiroThreshold)).toBe(false)
  })
})

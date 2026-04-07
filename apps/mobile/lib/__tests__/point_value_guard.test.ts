import { describe, it, expect } from 'vitest'

// index.tsx の point_value guard ロジックを純関数として抽出してテスト
function safePointValue(raw: unknown): number {
  return Math.max(Number.isFinite(raw as number) && (raw as number) > 0 ? (raw as number) : 10, 10)
}

function safeCount(raw: unknown): number {
  return Number.isFinite(raw as number) ? (raw as number) : 0
}

function safeThreshold(raw: unknown, fallback: number): number {
  return Number.isFinite(raw as number) && (raw as number) > 0 ? (raw as number) : fallback
}

function calcCurrentPoints(count: unknown, pointValue: unknown): number {
  return safeCount(count) * safePointValue(pointValue)
}

describe('point_value guard — NaN が出ないこと', () => {
  it('正常値はそのまま使われる', () => {
    expect(calcCurrentPoints(3, 20)).toBe(60)
    expect(calcCurrentPoints(0, 50)).toBe(0)
  })

  it('point_value が undefined でも NaN にならない', () => {
    const result = calcCurrentPoints(3, undefined)
    expect(Number.isNaN(result)).toBe(false)
    expect(result).toBe(30) // count(3) * fallback(10)
  })

  it('point_value が null でも NaN にならない', () => {
    const result = calcCurrentPoints(2, null)
    expect(Number.isNaN(result)).toBe(false)
    expect(result).toBe(20) // count(2) * fallback(10)
  })

  it('point_value が 0 でも NaN にならず fallback 10 になる', () => {
    expect(safePointValue(0)).toBe(10)
    expect(calcCurrentPoints(3, 0)).toBe(30)
  })

  it('point_value が NaN でも safe', () => {
    expect(safePointValue(NaN)).toBe(10)
    expect(calcCurrentPoints(5, NaN)).toBe(50)
  })

  it('count が undefined でも 0 扱い', () => {
    expect(calcCurrentPoints(undefined, 2)).toBe(0)
  })

  it('count が NaN でも 0 扱い', () => {
    expect(calcCurrentPoints(NaN, 2)).toBe(0)
  })
})

describe('threshold guard — メーターが壊れないこと', () => {
  it('正常値はそのまま', () => {
    expect(safeThreshold(5, 100)).toBe(5)
  })

  it('undefined → fallback', () => {
    expect(safeThreshold(undefined, 100)).toBe(100)
  })

  it('0 → fallback（除算で Infinity になることを防ぐ）', () => {
    expect(safeThreshold(0, 100)).toBe(100)
  })

  it('負数 → fallback', () => {
    expect(safeThreshold(-3, 100)).toBe(100)
  })
})

describe('promises.tsx tab queryParam', () => {
  // tab の初期値ロジックを純関数として検証
  function resolveInitialTab(tabParam: string | undefined): 'today' | 'all' | 'calendar' {
    if (tabParam === 'calendar') return 'calendar'
    if (tabParam === 'all') return 'all'
    return 'today'
  }

  it('tab=calendar → カレンダータブ', () => {
    expect(resolveInitialTab('calendar')).toBe('calendar')
  })

  it('tab=all → 一覧タブ', () => {
    expect(resolveInitialTab('all')).toBe('all')
  })

  it('tab=today → 今日タブ', () => {
    expect(resolveInitialTab('today')).toBe('today')
  })

  it('tab 未指定 → 今日タブ（デフォルト）', () => {
    expect(resolveInitialTab(undefined)).toBe('today')
  })

  it('不正な tab 値 → 今日タブにフォールバック', () => {
    expect(resolveInitialTab('unknown')).toBe('today')
  })
})

import { describe, it, expect } from 'vitest'
import { parseRuleMeta, buildObjectiveWithMeta, sumThresholds, getDefaultRuleMeta } from '../../src/lib/rule-meta'

describe('parseRuleMeta', () => {
  it('returns defaults when objective is null', () => {
    const { meta, objective } = parseRuleMeta(null)
    expect(meta).toEqual(getDefaultRuleMeta())
    expect(objective).toBe('')
  })

  it('parses new format (tp/np/tt/nt)', () => {
    const raw = '[FNY_META:m=adhoc,tp=2,np=1,tt=8,nt=4]テスト約束'
    const { meta, objective } = parseRuleMeta(raw)
    expect(meta.mode).toBe('adhoc')
    expect(meta.thank_you_point).toBe(2)
    expect(meta.nobishiro_point).toBe(1)
    expect(meta.thank_you_threshold).toBe(8)
    expect(meta.nobishiro_threshold).toBe(4)
    expect(objective).toBe('テスト約束')
  })

  it('backward compat: reads old format (gp/rp/gt/rt)', () => {
    const raw = '[FNY_META:m=routine,gp=3,rp=2,gt=10,rt=5]旧形式の約束'
    const { meta, objective } = parseRuleMeta(raw)
    expect(meta.mode).toBe('routine')
    expect(meta.thank_you_point).toBe(3)
    expect(meta.nobishiro_point).toBe(2)
    expect(meta.thank_you_threshold).toBe(10)
    expect(meta.nobishiro_threshold).toBe(5)
    expect(objective).toBe('旧形式の約束')
  })

  it('falls back gracefully when meta marker missing', () => {
    const { meta } = parseRuleMeta('普通のテキスト')
    expect(meta).toEqual(getDefaultRuleMeta())
  })
})

describe('buildObjectiveWithMeta', () => {
  it('round-trips: build → parse returns same values', () => {
    const original = { mode: 'adhoc' as const, thank_you_point: 2, nobishiro_point: 1, thank_you_threshold: 7, nobishiro_threshold: 3 }
    const built = buildObjectiveWithMeta('連絡を返す', original)
    const { meta, objective } = parseRuleMeta(built)
    expect(meta.mode).toBe(original.mode)
    expect(meta.thank_you_point).toBe(original.thank_you_point)
    expect(meta.thank_you_threshold).toBe(original.thank_you_threshold)
    expect(objective).toBe('連絡を返す')
  })
})

describe('sumThresholds', () => {
  it('sums both axes across rules', () => {
    const metas = [
      { ...getDefaultRuleMeta(), thank_you_threshold: 5, nobishiro_threshold: 3 },
      { ...getDefaultRuleMeta(), thank_you_threshold: 7, nobishiro_threshold: 4 },
    ]
    const result = sumThresholds(metas)
    expect(result.thank_you).toBe(12)
    expect(result.nobishiro).toBe(7)
  })

  it('returns defaults when empty array', () => {
    const result = sumThresholds([])
    const defaults = getDefaultRuleMeta()
    expect(result.thank_you).toBe(defaults.thank_you_threshold)
    expect(result.nobishiro).toBe(defaults.nobishiro_threshold)
  })
})

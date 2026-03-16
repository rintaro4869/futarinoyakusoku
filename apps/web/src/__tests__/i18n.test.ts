import { describe, it, expect } from 'vitest'

describe('ja-JP copy', () => {
  it('app_name is correct', async () => {
    const copy = await import('../../public/locales/ja-JP.json')
    expect(copy.app_name).toBe('ふたりの約束')
  })

  it('has all required sections', async () => {
    const copy = await import('../../public/locales/ja-JP.json')
    const required = ['onboarding', 'pairing', 'home', 'rule', 'event', 'approval', 'unlock', 'safety', 'errors']
    for (const section of required) {
      expect(copy).toHaveProperty(section)
    }
  })

  it('errors match error-codes.v1.json', async () => {
    const copy = await import('../../public/locales/ja-JP.json')
    expect(copy.errors.RULE_LIMIT_REACHED).toBe('ルール上限に達しています（最大3件）')
    expect(copy.errors.INVITE_EXPIRED).toBe('招待コードの有効期限が切れています')
    expect(copy.errors.COUPLE_LOCKED).toBe('現在このペアは加点停止中です')
  })

  it('safety section has all required keys', async () => {
    const copy = await import('../../public/locales/ja-JP.json')
    expect(copy.safety).toHaveProperty('pause')
    expect(copy.safety).toHaveProperty('leave')
    expect(copy.safety).toHaveProperty('delete')
    expect(copy.safety).toHaveProperty('help')
  })
})

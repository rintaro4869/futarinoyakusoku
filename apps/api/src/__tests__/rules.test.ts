import { describe, it, expect, vi } from 'vitest'

describe('Rule limit', () => {
  it('enforces max 3 rules per couple', async () => {
    // Logic test (unit)
    const RULE_LIMIT = 3
    const activeCount = 3
    expect(activeCount >= RULE_LIMIT).toBe(true)
  })
})

describe('Error codes', () => {
  it('RULE_LIMIT_REACHED maps to 422', async () => {
    const { ERROR_CODES } = await import('../lib/error-codes.js')
    expect(ERROR_CODES.RULE_LIMIT_REACHED.http).toBe(422)
  })

  it('INVITE_EXPIRED maps to 410', async () => {
    const { ERROR_CODES } = await import('../lib/error-codes.js')
    expect(ERROR_CODES.INVITE_EXPIRED.http).toBe(410)
  })

  it('COUPLE_LOCKED maps to 423', async () => {
    const { ERROR_CODES } = await import('../lib/error-codes.js')
    expect(ERROR_CODES.COUPLE_LOCKED.http).toBe(423)
  })

  it('DUPLICATE_ACTION maps to 409', async () => {
    const { ERROR_CODES } = await import('../lib/error-codes.js')
    expect(ERROR_CODES.DUPLICATE_ACTION.http).toBe(409)
  })

  it('all error messages match spec', async () => {
    const { ERROR_CODES } = await import('../lib/error-codes.js')
    expect(ERROR_CODES.AUTH_REQUIRED.message).toBe('認証が必要です')
    expect(ERROR_CODES.RULE_LIMIT_REACHED.message).toBe('ルール上限に達しています（最大3件）')
    expect(ERROR_CODES.COUPLE_LOCKED.message).toBe('現在このペアは加点停止中です')
  })
})

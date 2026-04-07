import { describe, it, expect } from 'vitest'
import {
  INVITE_CODE_LENGTH,
  isInviteCodeReady,
  extractInviteCode,
} from '../invite'

// ─── INVITE_CODE_LENGTH ───────────────────────────────────────

describe('INVITE_CODE_LENGTH', () => {
  it('is 8', () => {
    expect(INVITE_CODE_LENGTH).toBe(8)
  })
})

// ─── isInviteCodeReady ────────────────────────────────────────

describe('isInviteCodeReady', () => {
  it('accepts exactly 8 chars', () => {
    expect(isInviteCodeReady('ABCD1234')).toBe(true)
  })

  it('accepts more than 8 chars', () => {
    expect(isInviteCodeReady('ABCD12345')).toBe(true)
  })

  it('rejects 7 chars', () => {
    expect(isInviteCodeReady('ABCD123')).toBe(false)
  })

  it('rejects old 6-char format', () => {
    expect(isInviteCodeReady('ABC123')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isInviteCodeReady('')).toBe(false)
  })

  it('trims whitespace before checking length', () => {
    // スペースだけの入力は無効
    expect(isInviteCodeReady('        ')).toBe(false)
    // 前後のスペースは除いて判定
    expect(isInviteCodeReady('  ABCD1234  ')).toBe(true)
  })
})

// ─── extractInviteCode ────────────────────────────────────────

describe('extractInviteCode', () => {
  it('extracts code from params object', () => {
    expect(extractInviteCode({ code: 'abcd1234' })).toBe('ABCD1234')
  })

  it('normalizes to uppercase', () => {
    expect(extractInviteCode({ code: 'abcd1234' })).toBe('ABCD1234')
    expect(extractInviteCode({ code: 'ABCD1234' })).toBe('ABCD1234')
  })

  it('returns null when code key is absent', () => {
    expect(extractInviteCode({})).toBeNull()
    expect(extractInviteCode({ other: 'foo' })).toBeNull()
  })

  it('returns null for undefined value', () => {
    expect(extractInviteCode({ code: undefined })).toBeNull()
  })

  it('handles array param (first element wins)', () => {
    expect(extractInviteCode({ code: ['abcd1234', 'other'] })).toBe('ABCD1234')
  })

  it('returns null for empty array', () => {
    expect(extractInviteCode({ code: [] })).toBeNull()
  })
})

import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 21)

export function generateId(): string {
  return nanoid()
}

/** Generate 8-char invite code (uppercase alphanumeric) */
export function generateInviteCode(): string {
  return customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8)()
}

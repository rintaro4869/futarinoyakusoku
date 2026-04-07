/** 招待コードの文字数（サーバー側の generateInviteCode と一致させる） */
export const INVITE_CODE_LENGTH = 8

/** 招待コードが参加可能な長さかどうかを返す */
export function isInviteCodeReady(code: string): boolean {
  return code.trim().length >= INVITE_CODE_LENGTH
}

/** URL query string から招待コードを取り出し、大文字に正規化する */
export function extractInviteCode(params: Record<string, string | string[] | undefined>): string | null {
  const raw = params['code']
  if (!raw) return null
  const code = Array.isArray(raw) ? raw[0] : raw
  return code ? code.toUpperCase() : null
}

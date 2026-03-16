// エラーコードは error-codes.v1.json に完全一致
export const ERROR_CODES = {
  AUTH_REQUIRED:      { http: 401, message: '認証が必要です' },
  FORBIDDEN:          { http: 403, message: 'この操作は許可されていません' },
  NOT_FOUND:          { http: 404, message: '対象が見つかりません' },
  INVALID_INPUT:      { http: 400, message: '入力内容を確認してください' },
  RULE_LIMIT_REACHED: { http: 422, message: 'ルール上限に達しています（最大3件）' },
  INVITE_EXPIRED:     { http: 410, message: '招待コードの有効期限が切れています' },
  COUPLE_LOCKED:      { http: 423, message: '現在このペアは加点停止中です' },
  COUPLE_CLOSED:      { http: 403, message: 'このペアでは操作できません' },
  DUPLICATE_ACTION:   { http: 409, message: '同じ操作はすでに処理済みです' },
  INTERNAL_ERROR:     { http: 500, message: '予期しないエラーが発生しました' },
} as const

export type ErrorCode = keyof typeof ERROR_CODES

export function makeError(code: ErrorCode) {
  return { code, message: ERROR_CODES[code].message }
}

// エラーコードは error-codes.v1.json に完全一致
export const ERROR_CODES = {
  AUTH_REQUIRED:      { http: 401, message: '認証が必要です' },
  FORBIDDEN:          { http: 403, message: 'この操作は許可されていません' },
  NOT_FOUND:          { http: 404, message: '対象が見つかりません' },
  INVALID_INPUT:      { http: 400, message: '入力内容を確認してください' },
  RULE_LIMIT_REACHED: { http: 422, message: '約束の登録は最大5件までです' },
  INVITE_EXPIRED:     { http: 410, message: '招待コードの有効期限が切れています' },
  COUPLE_LOCKED:      { http: 423, message: '現在このペアは加点停止中です' },
  COUPLE_CLOSED:      { http: 403, message: 'このペアでは操作できません' },
  DUPLICATE_ACTION:   { http: 409, message: '同じ操作はすでに処理済みです' },
  EMAIL_ALREADY_EXISTS: { http: 409, message: 'このメールアドレスは既に登録されています' },
  INVALID_CREDENTIALS:  { http: 401, message: 'メールアドレスまたはパスワードが違います' },
  INVALID_RESET_CODE: { http: 400, message: 'リセットコードが無効または期限切れです' },
  RESET_EMAIL_UNAVAILABLE: { http: 503, message: '現在パスワード再設定メールを送信できません。少し待ってから再度お試しください' },
  TOO_MANY_REQUESTS:  { http: 429, message: '短時間に試行が集中しています。少し待ってから再度お試しください' },
  SCHEMA_MISMATCH:    { http: 503, message: 'サーバー更新中です。少し時間を置いて再度お試しください' },
  INTERNAL_ERROR:     { http: 500, message: '予期しないエラーが発生しました' },
} as const

export type ErrorCode = keyof typeof ERROR_CODES

export function makeError(code: ErrorCode) {
  return { code, message: ERROR_CODES[code].message }
}

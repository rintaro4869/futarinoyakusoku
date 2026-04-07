export const MIN_POINT_VALUE = 10
export const POINT_STEP = 10

export function sanitizePointDraft(text: string) {
  const digits = text.replace(/[^\d]/g, '')
  if (!digits) return ''
  return String(Number(digits))
}

export function parsePointDraft(text: string, fallback = MIN_POINT_VALUE) {
  const digits = sanitizePointDraft(text)
  if (!digits) return fallback

  const value = Number(digits)
  if (!Number.isFinite(value)) return fallback

  return Math.max(MIN_POINT_VALUE, Math.round(value))
}

export function incrementPointValue(value: number, step = POINT_STEP) {
  return Math.max(MIN_POINT_VALUE, value + step)
}

export function decrementPointValue(value: number, step = POINT_STEP) {
  return Math.max(MIN_POINT_VALUE, value - step)
}

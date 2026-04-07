const DEV_FALLBACK_JWT_SECRET = 'dev-secret-min-32-chars-long-xxx'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1'])

type RateLimitRule = {
  path: string
  max: number
  windowMs: number
}

type Bucket = {
  count: number
  resetAt: number
}

const authRateLimitRules: RateLimitRule[] = [
  { path: '/api/v1/auth/login', max: 10, windowMs: 15 * 60 * 1000 },
  { path: '/api/v1/auth/register', max: 5, windowMs: 15 * 60 * 1000 },
  { path: '/api/v1/auth/anonymous', max: 20, windowMs: 15 * 60 * 1000 },
  { path: '/api/v1/auth/request-reset', max: 3, windowMs: 15 * 60 * 1000 },
  { path: '/api/v1/auth/reset-password', max: 5, windowMs: 15 * 60 * 1000 },
]

const rateLimitBuckets = new Map<string, Bucket>()

function normalizeUrl(url: string | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

function isLocalOrigin(origin: string | null): boolean {
  if (!origin) return false
  try {
    return LOCAL_HOSTS.has(new URL(origin).hostname)
  } catch {
    return false
  }
}

export function allowedOriginsFromEnv(appUrl: string, webUrl: string): Set<string> {
  const origins = new Set<string>()
  const normalizedAppUrl = normalizeUrl(appUrl)
  const normalizedWebUrl = normalizeUrl(webUrl)

  if (normalizedAppUrl) origins.add(normalizedAppUrl)
  if (normalizedWebUrl) origins.add(normalizedWebUrl)

  return origins
}

export function resolveJwtSecret(secret: string | undefined, appUrl: string, webUrl: string): string {
  const trimmed = secret?.trim()
  if (trimmed && trimmed.length >= 32) return trimmed

  const appOrigin = normalizeUrl(appUrl)
  const webOrigin = normalizeUrl(webUrl)
  if (isLocalOrigin(appOrigin) && isLocalOrigin(webOrigin)) {
    return trimmed && trimmed.length > 0 ? trimmed : DEV_FALLBACK_JWT_SECRET
  }

  throw new Error('JWT_SECRET is missing or too short. Set a random secret with at least 32 characters.')
}

export function buildCorsHeaders(origin: string): Headers {
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', origin)
  headers.set('Access-Control-Allow-Credentials', 'true')
  headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  headers.set('Vary', 'Origin')
  return headers
}

export function getClientKey(headers: Headers): string {
  const cfIp = headers.get('CF-Connecting-IP')
  if (cfIp) return cfIp

  const realIp = headers.get('X-Real-IP')
  if (realIp) return realIp

  const forwardedFor = headers.get('X-Forwarded-For')
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim()
    if (first) return first
  }

  return 'unknown'
}

function getRuleForPath(path: string): RateLimitRule | null {
  return authRateLimitRules.find((rule) => rule.path === path) ?? null
}

export function checkAuthRateLimit(path: string, clientKey: string, now = Date.now()) {
  const rule = getRuleForPath(path)
  if (!rule) {
    return { blocked: false as const, retryAfterSeconds: 0 }
  }

  const bucketKey = `${rule.path}:${clientKey}`
  const existing = rateLimitBuckets.get(bucketKey)

  if (!existing || existing.resetAt <= now) {
    rateLimitBuckets.set(bucketKey, {
      count: 1,
      resetAt: now + rule.windowMs,
    })
    return { blocked: false as const, retryAfterSeconds: 0 }
  }

  existing.count += 1
  rateLimitBuckets.set(bucketKey, existing)

  if (existing.count > rule.max) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
    return { blocked: true as const, retryAfterSeconds }
  }

  return { blocked: false as const, retryAfterSeconds: 0 }
}

export function applySecurityHeaders(headers: Headers, isApiResponse: boolean) {
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('Referrer-Policy', 'no-referrer')
  headers.set('Cross-Origin-Resource-Policy', 'same-site')
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  if (isApiResponse) {
    headers.set('Cache-Control', 'no-store')
  }
}

export function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a)
  const bBytes = new TextEncoder().encode(b)
  const maxLen = Math.max(aBytes.length, bBytes.length)

  let diff = aBytes.length ^ bBytes.length
  for (let i = 0; i < maxLen; i++) {
    const left = aBytes[i] ?? 0
    const right = bBytes[i] ?? 0
    diff |= left ^ right
  }

  return diff === 0
}

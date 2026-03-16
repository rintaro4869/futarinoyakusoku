import { PrismaClient } from '@fny/db'
import { generateId } from '../lib/id.js'

// analytics-events.v1.json に準拠
const VALID_EVENTS = new Set([
  'signup_completed',
  'onboarding_completed',
  'invite_created',
  'invite_joined',
  'rule_created',
  'rule_updated',
  'rule_archived',
  'event_reported_self',
  'event_reported_partner',
  'event_approved',
  'event_rejected',
  'event_expired',
  'threshold_reached',
  'repair_selected',
  'repair_completed',
  'safety_pause_enabled',
  'safety_pause_disabled',
  'pair_unlinked',
  'data_deletion_requested',
])

// Privacy: disallowed payload fields
const DISALLOWED_FIELDS = new Set(['note_text', 'free_text', 'phone', 'email', 'address'])

function sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(payload)) {
    if (!DISALLOWED_FIELDS.has(key)) {
      sanitized[key] = value
    }
  }
  return sanitized
}

export async function trackEvent(
  prisma: PrismaClient,
  opts: {
    eventName: string
    userId?: string | null
    coupleId?: string | null
    payload?: Record<string, unknown>
  }
) {
  if (!VALID_EVENTS.has(opts.eventName)) {
    console.warn(`[analytics] unknown event: ${opts.eventName}`)
    return
  }

  const sanitized = sanitizePayload(opts.payload ?? {})

  await prisma.analyticsEvent.create({
    data: {
      userId: opts.userId ?? null,
      coupleId: opts.coupleId ?? null,
      eventName: opts.eventName,
      payload: sanitized as Parameters<typeof prisma.analyticsEvent.create>[0]['data']['payload'],
    },
  }).catch((err: Error) => {
    // analytics failure should not break main flow
    console.error('[analytics] failed to track event:', err)
  })
}

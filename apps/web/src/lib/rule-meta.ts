export type RuleMode = 'routine' | 'adhoc'

export interface RuleMeta {
  mode: RuleMode
  thank_you_point: number
  nobishiro_point: number
  thank_you_threshold: number
  nobishiro_threshold: number
}

export interface ParsedRuleMeta {
  meta: RuleMeta
  objective: string
}

const META_PREFIX = '[FNY_META:'
const DEFAULT_META: RuleMeta = {
  mode: 'routine',
  thank_you_point: 1,
  nobishiro_point: 1,
  thank_you_threshold: 5,
  nobishiro_threshold: 3,
}

function clamp(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min
  return Math.max(min, Math.min(max, Math.round(v)))
}

function normalizeMode(value: string | undefined): RuleMode {
  return value === 'adhoc' ? 'adhoc' : 'routine'
}

function parseCompactMeta(token: string): RuleMeta {
  const chunks = token.split(',')
  const map = new Map<string, string>()
  for (const chunk of chunks) {
    const [k, v] = chunk.split('=')
    if (!k || !v) continue
    map.set(k.trim(), v.trim())
  }

  // New keys: tp/np/tt/nt — old keys: gp/rp/gt/rt (backward compat)
  return {
    mode: normalizeMode(map.get('m')),
    thank_you_point: clamp(Number(map.get('tp') ?? map.get('gp') ?? DEFAULT_META.thank_you_point), 1, 5),
    nobishiro_point: clamp(Number(map.get('np') ?? map.get('rp') ?? DEFAULT_META.nobishiro_point), 1, 5),
    thank_you_threshold: clamp(Number(map.get('tt') ?? map.get('gt') ?? DEFAULT_META.thank_you_threshold), 3, 30),
    nobishiro_threshold: clamp(Number(map.get('nt') ?? map.get('rt') ?? DEFAULT_META.nobishiro_threshold), 3, 30),
  }
}

function toCompactMeta(meta: RuleMeta): string {
  return `m=${meta.mode},tp=${meta.thank_you_point},np=${meta.nobishiro_point},tt=${meta.thank_you_threshold},nt=${meta.nobishiro_threshold}`
}

export function parseRuleMeta(rawObjective: string | null | undefined): ParsedRuleMeta {
  if (!rawObjective) return { meta: DEFAULT_META, objective: '' }

  if (!rawObjective.startsWith(META_PREFIX)) {
    return { meta: DEFAULT_META, objective: rawObjective }
  }

  const markerEnd = rawObjective.indexOf(']')
  if (markerEnd === -1) {
    return { meta: DEFAULT_META, objective: rawObjective }
  }

  const compact = rawObjective.slice(META_PREFIX.length, markerEnd)
  const objective = rawObjective.slice(markerEnd + 1).trimStart()

  return {
    meta: parseCompactMeta(compact),
    objective,
  }
}

export function buildObjectiveWithMeta(objective: string, partial: Partial<RuleMeta>): string {
  const meta: RuleMeta = {
    mode: normalizeMode(partial.mode),
    thank_you_point: clamp(partial.thank_you_point ?? DEFAULT_META.thank_you_point, 1, 5),
    nobishiro_point: clamp(partial.nobishiro_point ?? DEFAULT_META.nobishiro_point, 1, 5),
    thank_you_threshold: clamp(partial.thank_you_threshold ?? DEFAULT_META.thank_you_threshold, 3, 30),
    nobishiro_threshold: clamp(partial.nobishiro_threshold ?? DEFAULT_META.nobishiro_threshold, 3, 30),
  }

  const rawObjective = objective.trim()
  const withMeta = `${META_PREFIX}${toCompactMeta(meta)}]${rawObjective}`.trim()

  if (withMeta.length <= 120) return withMeta

  const metaOnly = `${META_PREFIX}${toCompactMeta(meta)}]`
  return metaOnly.slice(0, 120)
}

export function getDefaultRuleMeta(): RuleMeta {
  return { ...DEFAULT_META }
}

export function sumThresholds(metas: RuleMeta[]): { thank_you: number; nobishiro: number } {
  if (metas.length === 0) return { thank_you: DEFAULT_META.thank_you_threshold, nobishiro: DEFAULT_META.nobishiro_threshold }
  return {
    thank_you: metas.reduce((acc, m) => acc + m.thank_you_threshold, 0),
    nobishiro: metas.reduce((acc, m) => acc + m.nobishiro_threshold, 0),
  }
}

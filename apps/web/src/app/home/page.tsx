'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { messages } from '@/lib/i18n'
import { BottomNav } from '@/components/BottomNav'
import { ProgressMeter } from '@/components/ProgressMeter'
import { getHomeSummary, getCoupleId, getRules, getEvents, HomeSummary, Rule, Event } from '@/lib/api'
import { parseRuleMeta, sumThresholds, RuleMeta } from '@/lib/rule-meta'
import { hasSeenTutorial } from '@/lib/tutorial'

type RuleWithMeta = Rule & {
  cleaned_objective: string
  meta: RuleMeta
}

type RuleProgress = {
  rule: RuleWithMeta
  thankYouCount: number
  nobishiroCount: number
  thankYouPoints: number
  nobishiroPoints: number
}

function getIsoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

export default function HomePage() {
  const router = useRouter()
  const [summary, setSummary] = useState<HomeSummary | null>(null)
  const [rules, setRules] = useState<RuleWithMeta[]>([])
  const [approvedEvents, setApprovedEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const coupleId = getCoupleId()
    if (!coupleId) {
      router.push('/')
      return
    }

    if (!hasSeenTutorial()) {
      router.push('/tutorial')
      return
    }

    Promise.all([
      getHomeSummary(coupleId),
      getRules(coupleId),
      getEvents(coupleId, 'approved'),
    ])
      .then(([home, ruleData, eventData]) => {
        setSummary(home)
        setRules(ruleData.items.map((r) => {
          const parsed = parseRuleMeta(r.objective)
          return { ...r, cleaned_objective: parsed.objective, meta: parsed.meta }
        }))
        setApprovedEvents(eventData.items)
      })
      .catch(() => setError(messages.errors.network))
      .finally(() => setLoading(false))
  }, [router])

  const progress = useMemo(() => {
    if (!summary) {
      return {
        thankYouPoints: 0,
        nobishiroPoints: 0,
        thankYouTarget: 5,
        nobishiroTarget: 3,
        perRule: [] as RuleProgress[],
      }
    }

    const currentWeekEvents = approvedEvents.filter((e) => getIsoWeekKey(new Date(e.created_at)) === summary.week_key)

    const counters = new Map<string, { thankYou: number; nobishiro: number }>()
    for (const e of currentWeekEvents) {
      const curr = counters.get(e.rule_id) ?? { thankYou: 0, nobishiro: 0 }
      const ruleMode = rules.find((r) => r.id === e.rule_id)?.meta.mode
      if (ruleMode === 'adhoc') curr.thankYou += 1
      else curr.nobishiro += 1
      counters.set(e.rule_id, curr)
    }

    const perRule = rules.map((rule) => {
      const current = counters.get(rule.id) ?? { thankYou: 0, nobishiro: 0 }
      const thankYouPoints = current.thankYou * rule.meta.thank_you_point
      const nobishiroPoints = current.nobishiro * rule.meta.nobishiro_point
      return {
        rule,
        thankYouCount: current.thankYou,
        nobishiroCount: current.nobishiro,
        thankYouPoints,
        nobishiroPoints,
      }
    })

    const totals = perRule.reduce((acc, row) => {
      acc.thankYou += row.thankYouPoints
      acc.nobishiro += row.nobishiroPoints
      return acc
    }, { thankYou: 0, nobishiro: 0 })

    const thresholds = sumThresholds(rules.map((r) => r.meta))

    return {
      thankYouPoints: totals.thankYou,
      nobishiroPoints: totals.nobishiro,
      thankYouTarget: thresholds.thank_you,
      nobishiroTarget: thresholds.nobishiro,
      perRule,
    }
  }, [approvedEvents, rules, summary])

  const unlocks = useMemo(() => {
    return progress.perRule.flatMap((row) => {
      const items: Array<{ type: 'thank_you' | 'nobishiro'; title: string }> = []
      if (row.thankYouPoints >= row.rule.meta.thank_you_threshold) {
        items.push({ type: 'thank_you', title: row.rule.title })
      }
      if (row.nobishiroPoints >= row.rule.meta.nobishiro_threshold) {
        items.push({ type: 'nobishiro', title: row.rule.title })
      }
      return items
    })
  }, [progress.perRule])

  if (loading) return <div className="p-6 text-center text-gray-400">{messages.common.loading}</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!summary) return null

  return (
    <main className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-gray-500">{messages.home.week_label} {summary.week_key}</p>
          <h1 className="text-2xl font-bold text-gray-900">{messages.home.title}</h1>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button onClick={() => router.push('/settings')} className="text-xs text-gray-400 underline">
            設定
          </button>
          <button onClick={() => router.push('/tutorial')} className="text-xs text-gray-500 underline">
            {messages.home.tutorial_cta}
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-4 mb-4">
        <p className="text-sm font-semibold text-brand-700 mb-3">{messages.home.quick_title}</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push('/events?action=thank_you')}
            className="rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white"
          >
            {messages.home.thank_you_quick}
          </button>
          <button
            onClick={() => router.push('/events?action=nobishiro')}
            className="rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white"
          >
            {messages.home.nobishiro_quick}
          </button>
        </div>
      </section>

      <div className="space-y-3 mb-4">
        <ProgressMeter
          label={messages.home.thank_you_meter}
          value={progress.thankYouPoints}
          target={progress.thankYouTarget}
          tone="good"
        />
        <ProgressMeter
          label={messages.home.nobishiro_meter}
          value={progress.nobishiroPoints}
          target={progress.nobishiroTarget}
          tone="repair"
        />
      </div>

      <section className="grid grid-cols-3 gap-3 mb-4">
        <StatCard label={messages.home.pending_reviews} value={summary.pending_events} tone={summary.pending_events > 0 ? 'alert' : 'normal'} onClick={() => summary.pending_events > 0 && router.push('/approval')} />
        <StatCard label={messages.home.open_repairs} value={summary.open_repairs} tone={summary.open_repairs > 0 ? 'alert' : 'normal'} onClick={() => summary.open_repairs > 0 && router.push('/repair')} />
        <StatCard label={messages.home.unlocked_count} value={unlocks.length} tone={unlocks.length > 0 ? 'good' : 'normal'} onClick={() => unlocks.length > 0 && router.push('/repair')} />
      </section>

      {unlocks.length > 0 && (
        <section className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-emerald-700">{messages.home.unlock_title}</p>
            <button onClick={() => router.push('/repair')} className="text-xs font-semibold text-emerald-600 underline">
              実行する →
            </button>
          </div>
          <div className="space-y-2">
            {unlocks.map((unlock, idx) => (
              <div key={`${unlock.title}_${unlock.type}_${idx}`} className="rounded-lg bg-white px-3 py-2 text-sm text-gray-700">
                <span className={`mr-2 inline-flex rounded-full px-2 py-0.5 text-xs ${unlock.type === 'thank_you' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
                  {unlock.type === 'thank_you' ? messages.home.thank_you_unlock : messages.home.nobishiro_unlock}
                </span>
                {unlock.title}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-2">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">{messages.home.box_progress_title}</p>
          <button onClick={() => router.push('/rules')} className="text-xs text-brand-600">{messages.home.box_edit_cta}</button>
        </div>

        {progress.perRule.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
            {messages.home.empty_rules}
          </div>
        ) : (
          <div className="space-y-2">
            {progress.perRule.map((item) => (
              <div key={item.rule.id} className="rounded-xl border border-gray-100 bg-white p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-gray-900">{item.rule.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${item.rule.meta.mode === 'routine' ? 'bg-sky-100 text-sky-700' : 'bg-violet-100 text-violet-700'}`}>
                    {item.rule.meta.mode === 'routine' ? messages.rule.mode_routine : messages.rule.mode_adhoc}
                  </span>
                </div>
                {item.rule.cleaned_objective && <p className="text-xs text-gray-500 mb-2">{item.rule.cleaned_objective}</p>}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700">
                    {messages.home.thank_you_short} {item.thankYouPoints} / {item.rule.meta.thank_you_threshold}
                  </div>
                  <div className="rounded-lg bg-sky-50 px-2 py-1 text-sky-700">
                    {messages.home.nobishiro_short} {item.nobishiroPoints} / {item.rule.meta.nobishiro_threshold}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <BottomNav active="home" />
    </main>
  )
}

function StatCard({ label, value, tone, onClick }: { label: string; value: number; tone: 'normal' | 'alert' | 'good'; onClick?: () => void }) {
  const style = tone === 'alert'
    ? 'bg-orange-50 border-orange-200 text-orange-700'
    : tone === 'good'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
      : 'bg-gray-50 border-gray-100 text-gray-700'

  return (
    <button onClick={onClick} className={`rounded-xl border p-3 text-center w-full ${style} ${onClick ? 'active:opacity-70' : 'cursor-default'}`}>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[10px] mt-1">{label}</div>
    </button>
  )
}

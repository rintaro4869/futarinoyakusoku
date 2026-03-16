'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { messages } from '@/lib/i18n'
import { BottomNav } from '@/components/BottomNav'
import { getRules, createEvent, getCoupleId, getUserId, Rule } from '@/lib/api'
import { parseRuleMeta, RuleMode } from '@/lib/rule-meta'

type RuleWithMeta = Rule & {
  mode: RuleMode
  cleanedObjective: string
  thankYouPoint: number
  nobishiroPoint: number
}

export default function EventPage() {
  const router = useRouter()
  const params = useSearchParams()
  const actionFromQuery = params.get('action') === 'nobishiro' ? 'nobishiro' : 'thank_you'

  const [rules, setRules] = useState<RuleWithMeta[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    rule_id: '',
    action: actionFromQuery as 'thank_you' | 'nobishiro',
    reporter: 'self' as 'self' | 'partner',
    note: '',
  })

  const coupleId = getCoupleId()
  const userId = getUserId()

  useEffect(() => {
    if (!coupleId) {
      router.push('/')
      return
    }

    getRules(coupleId)
      .then((d) => {
        const parsed = d.items.map((r) => {
          const meta = parseRuleMeta(r.objective)
          return {
            ...r,
            mode: meta.meta.mode,
            cleanedObjective: meta.objective,
            thankYouPoint: meta.meta.thank_you_point,
            nobishiroPoint: meta.meta.nobishiro_point,
          }
        })
        setRules(parsed)
      })
      .catch(() => setError(messages.errors.network))
  }, [])

  const visibleRules = useMemo(() => {
    const actionMode = form.action === 'thank_you' ? 'adhoc' : 'routine'
    return rules.filter((r) => r.mode === actionMode)
  }, [form.action, rules])

  async function handleSubmit() {
    if (!form.rule_id || !userId) return
    setLoading(true)
    setError(null)

    try {
      await createEvent(form.rule_id, {
        target_user_id: userId,
        report_type: form.reporter,
        note: form.note.trim() || undefined,
      })

      setSuccess(true)
      setTimeout(() => router.push('/home'), 900)
    } catch (e: unknown) {
      const err = e as { code?: string }
      if (err.code === 'COUPLE_LOCKED') setError(messages.errors.COUPLE_LOCKED)
      else if (err.code === 'COUPLE_CLOSED') setError(messages.errors.COUPLE_CLOSED)
      else setError(messages.errors.network)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="p-6 flex flex-col items-center justify-center min-h-screen">
        <div className="text-5xl mb-4">✅</div>
        <p className="text-gray-700 font-medium">{messages.event.submitted}</p>
      </main>
    )
  }

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold">{messages.event.record_title}</h1>
        <button onClick={() => router.push('/home')} className="text-gray-500 text-sm">{messages.common.back}</button>
      </div>
      <p className="text-sm text-gray-600 mb-5">{messages.event.record_desc}</p>

      <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-3">
        <p className="mb-2 text-sm font-medium text-gray-800">{messages.event.action_label}</p>
        <div className="grid grid-cols-2 gap-2">
          <ActionBtn
            active={form.action === 'thank_you'}
            label={messages.event.thank_you_action}
            tone="good"
            onClick={() => setForm((p) => ({ ...p, action: 'thank_you', rule_id: '' }))}
          />
          <ActionBtn
            active={form.action === 'nobishiro'}
            label={messages.event.nobishiro_action}
            tone="repair"
            onClick={() => setForm((p) => ({ ...p, action: 'nobishiro', rule_id: '' }))}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">{messages.event.target_rule}</label>
        {visibleRules.length === 0 ? (
          <p className="text-sm text-gray-500">
            {messages.event.empty_rules}{' '}
            <button onClick={() => router.push('/rules')} className="text-brand-600 underline">
              {messages.event.go_rules}
            </button>
          </p>
        ) : (
          <div className="space-y-2">
            {visibleRules.map((r) => {
              const selected = form.rule_id === r.id
              return (
                <button
                  key={r.id}
                  onClick={() => setForm((p) => ({ ...p, rule_id: r.id }))}
                  className={`w-full rounded-xl border px-3 py-3 text-left ${selected ? 'border-brand-300 bg-brand-50' : 'border-gray-200 bg-white'}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">{r.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] ${r.mode === 'routine' ? 'bg-sky-100 text-sky-700' : 'bg-violet-100 text-violet-700'}`}>
                      {r.mode === 'routine' ? messages.rule.mode_routine : messages.rule.mode_adhoc}
                    </span>
                  </div>
                  {r.cleanedObjective && <p className="text-xs text-gray-500 mt-1">{r.cleanedObjective}</p>}
                  <p className="text-[11px] mt-2 text-gray-500">
                    {messages.event.rule_points.replace('{thank_you}', String(r.thankYouPoint)).replace('{nobishiro}', String(r.nobishiroPoint))}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-3">
        <p className="mb-2 text-sm font-medium text-gray-800">{messages.event.reporter_label}</p>
        <div className="grid grid-cols-2 gap-2">
          <ActionBtn active={form.reporter === 'self'} label={messages.event.reporter_self} tone="good" onClick={() => setForm((p) => ({ ...p, reporter: 'self' }))} />
          <ActionBtn active={form.reporter === 'partner'} label={messages.event.reporter_partner} tone="repair" onClick={() => setForm((p) => ({ ...p, reporter: 'partner' }))} />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">{messages.event.note}</label>
        <textarea
          value={form.note}
          onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
          maxLength={200}
          rows={3}
          placeholder={messages.event.note_placeholder}
          className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-300 resize-none"
        />
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!form.rule_id || loading}
        className="w-full py-3 rounded-2xl bg-brand-500 text-white font-semibold disabled:opacity-40"
      >
        {loading ? '...' : messages.event.submit}
      </button>

      <BottomNav active="record" />
    </main>
  )
}

function ActionBtn({
  active,
  label,
  tone,
  onClick,
}: {
  active: boolean
  label: string
  tone: 'good' | 'repair'
  onClick: () => void
}) {
  const className = tone === 'good'
    ? (active ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600')
    : (active ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600')

  return (
    <button onClick={onClick} className={`rounded-xl border px-3 py-2 text-sm font-medium ${className}`}>
      {label}
    </button>
  )
}


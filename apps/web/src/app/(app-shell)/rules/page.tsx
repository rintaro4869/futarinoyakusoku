'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { messages } from '@/lib/i18n'
import { BottomNav } from '@/components/BottomNav'
import { getRules, createRule, archiveRule, getCoupleId, Rule } from '@/lib/api'
import { buildObjectiveWithMeta, getDefaultRuleMeta, parseRuleMeta, RuleMode } from '@/lib/rule-meta'

type RuleForView = Rule & {
  clean_objective: string
  mode: RuleMode
  thank_you_point: number
  nobishiro_point: number
  thank_you_threshold_meta: number
  nobishiro_threshold_meta: number
}

export default function RulesPage() {
  const router = useRouter()
  const [rules, setRules] = useState<RuleForView[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const defaults = useMemo(() => getDefaultRuleMeta(), [])
  const [form, setForm] = useState({
    title: '',
    objective: '',
    mode: defaults.mode,
    thank_you_point: defaults.thank_you_point,
    nobishiro_point: defaults.nobishiro_point,
    thank_you_threshold: defaults.thank_you_threshold,
    nobishiro_threshold: defaults.nobishiro_threshold,
  })

  const coupleId = getCoupleId()

  useEffect(() => {
    if (!coupleId) {
      router.push('/')
      return
    }
    loadRules()
  }, [])

  async function loadRules() {
    if (!coupleId) return
    try {
      const data = await getRules(coupleId)
      const parsed = data.items.map((rule) => {
        const meta = parseRuleMeta(rule.objective)
        return {
          ...rule,
          clean_objective: meta.objective,
          mode: meta.meta.mode,
          thank_you_point: meta.meta.thank_you_point,
          nobishiro_point: meta.meta.nobishiro_point,
          thank_you_threshold_meta: meta.meta.thank_you_threshold,
          nobishiro_threshold_meta: meta.meta.nobishiro_threshold,
        }
      })
      setRules(parsed)
    } catch {
      setError(messages.errors.network)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!coupleId || !form.title.trim()) return
    setError(null)

    try {
      const objective = buildObjectiveWithMeta(form.objective, {
        mode: form.mode,
        thank_you_point: form.thank_you_point,
        nobishiro_point: form.nobishiro_point,
        thank_you_threshold: form.thank_you_threshold,
        nobishiro_threshold: form.nobishiro_threshold,
      })

      await createRule(coupleId, {
        title: form.title.trim(),
        objective,
        mode: form.mode,
        point_value: form.nobishiro_point,
        threshold: form.nobishiro_threshold,
        thank_you_threshold: form.thank_you_threshold,
        nobishiro_threshold: form.nobishiro_threshold,
      })

      setForm({
        title: '',
        objective: '',
        mode: defaults.mode,
        thank_you_point: defaults.thank_you_point,
        nobishiro_point: defaults.nobishiro_point,
        thank_you_threshold: defaults.thank_you_threshold,
        nobishiro_threshold: defaults.nobishiro_threshold,
      })
      setShowForm(false)
      await loadRules()
    } catch (e: unknown) {
      const err = e as { code?: string }
      if (err.code === 'RULE_LIMIT_REACHED') setError(messages.errors.RULE_LIMIT_REACHED)
      else setError(messages.errors.network)
    }
  }

  async function handleArchive(ruleId: string) {
    if (!confirm(messages.rule.confirm_archive)) return
    try {
      await archiveRule(ruleId)
      await loadRules()
    } catch {
      setError(messages.errors.network)
    }
  }

  if (loading) return <div className="p-6 text-center text-gray-400">{messages.common.loading}</div>

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold">{messages.rule.box_title}</h1>
        <button onClick={() => router.push('/home')} className="text-gray-500 text-sm">{messages.common.back}</button>
      </div>
      <p className="text-sm text-gray-600 mb-4">{messages.rule.box_desc}</p>

      {rules.length < 5 && (
        <p className="text-xs text-gray-500 mb-4">{messages.rule.count_hint.replace('{count}', String(rules.length))}</p>
      )}
      {rules.length >= 5 && (
        <p className="text-xs text-orange-600 mb-4">{messages.rule.limit}</p>
      )}

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="space-y-3 mb-6">
        {rules.map((rule) => (
          <div key={rule.id} className="rounded-2xl border border-gray-100 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900">{rule.title}</h3>
                {rule.clean_objective && <p className="text-sm text-gray-600 mt-1">{rule.clean_objective}</p>}
              </div>
              <button onClick={() => handleArchive(rule.id)} className="text-xs text-gray-400 hover:text-red-600">
                {messages.common.delete}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              <span className={`rounded-full px-2 py-1 ${rule.mode === 'routine' ? 'bg-sky-100 text-sky-700' : 'bg-violet-100 text-violet-700'}`}>
                {rule.mode === 'routine' ? messages.rule.mode_routine : messages.rule.mode_adhoc}
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">
                {messages.rule.thank_you_chip.replace('{point}', String(rule.thank_you_point)).replace('{threshold}', String(rule.thank_you_threshold_meta))}
              </span>
              <span className="rounded-full bg-sky-100 px-2 py-1 text-sky-700">
                {messages.rule.nobishiro_chip.replace('{point}', String(rule.nobishiro_point)).replace('{threshold}', String(rule.nobishiro_threshold_meta))}
              </span>
            </div>
          </div>
        ))}
      </div>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          disabled={rules.length >= 5}
          className="w-full rounded-2xl border-2 border-dashed border-brand-300 py-3 text-sm font-semibold text-brand-600 disabled:opacity-40"
        >
          {messages.rule.add_box}
        </button>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-4">
          <h2 className="font-semibold text-gray-900">{messages.rule.form_title}</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{messages.rule.name}</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              maxLength={60}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{messages.rule.objective}</label>
            <input
              type="text"
              value={form.objective}
              onChange={(e) => setForm((p) => ({ ...p, objective: e.target.value }))}
              maxLength={70}
              placeholder={messages.rule.objective_placeholder}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{messages.rule.mode_label}</label>
            <div className="grid grid-cols-2 gap-2">
              <ModeBtn
                active={form.mode === 'routine'}
                label={messages.rule.mode_routine}
                onClick={() => setForm((p) => ({ ...p, mode: 'routine' }))}
              />
              <ModeBtn
                active={form.mode === 'adhoc'}
                label={messages.rule.mode_adhoc}
                onClick={() => setForm((p) => ({ ...p, mode: 'adhoc' }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumberInput
              label={messages.rule.thank_you_point_label}
              min={1}
              max={5}
              value={form.thank_you_point}
              onChange={(v) => setForm((p) => ({ ...p, thank_you_point: v }))}
            />
            <NumberInput
              label={messages.rule.nobishiro_point_label}
              min={1}
              max={5}
              value={form.nobishiro_point}
              onChange={(v) => setForm((p) => ({ ...p, nobishiro_point: v }))}
            />
            <NumberInput
              label={messages.rule.thank_you_threshold_label}
              min={3}
              max={30}
              value={form.thank_you_threshold}
              onChange={(v) => setForm((p) => ({ ...p, thank_you_threshold: v }))}
            />
            <NumberInput
              label={messages.rule.nobishiro_threshold_label}
              min={3}
              max={30}
              value={form.nobishiro_threshold}
              onChange={(v) => setForm((p) => ({ ...p, nobishiro_threshold: v }))}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-xl border border-gray-200 py-2 text-sm text-gray-700"
            >
              {messages.common.cancel}
            </button>
            <button
              onClick={handleCreate}
              disabled={!form.title.trim()}
              className="flex-1 rounded-xl bg-brand-500 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              {messages.rule.save}
            </button>
          </div>
        </div>
      )}

      <BottomNav active="box" />
    </main>
  )
}

function ModeBtn({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border px-3 py-2 text-sm font-medium ${
        active ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600'
      }`}
    >
      {label}
    </button>
  )
}

function NumberInput({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string
  min: number
  max: number
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))}
        className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-300"
      />
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { messages } from '@/lib/i18n'
import { BottomNav } from '@/components/BottomNav'
import { getWeeklySummary, getCoupleId, WeeklySummary } from '@/lib/api'

export default function SummaryPage() {
  const router = useRouter()
  const [summary, setSummary] = useState<WeeklySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const coupleId = getCoupleId()

  useEffect(() => {
    if (!coupleId) { router.push('/'); return }
    getWeeklySummary(coupleId)
      .then(setSummary)
      .catch(() => setError(messages.errors.network))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6 text-center text-gray-400">{messages.common.loading}</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!summary) return null

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">{messages.summary.title}</h1>
        <button onClick={() => router.push('/home')} className="text-gray-500 text-sm">{messages.common.back}</button>
      </div>

      <p className="text-sm text-gray-400 mb-6">{summary.week_key}</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-emerald-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-emerald-600">{summary.thank_you_total}</div>
          <div className="text-xs text-gray-500 mt-1">{messages.home.thank_you_meter}</div>
        </div>
        <div className="bg-sky-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-sky-600">{summary.nobishiro_total}</div>
          <div className="text-xs text-gray-500 mt-1">{messages.home.nobishiro_meter}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{Math.round(summary.approval_rate * 100)}%</div>
          <div className="text-xs text-gray-500 mt-1">{messages.summary.approval_rate}</div>
        </div>
        <div className="bg-brand-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-brand-600">{Math.round(summary.repair_completion_rate * 100)}%</div>
          <div className="text-xs text-gray-500 mt-1">{messages.summary.unlock_rate}</div>
        </div>
      </div>

      {summary.bias_alert && (
        <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          {messages.summary.bias_alert}
        </div>
      )}

      <h2 className="text-sm font-medium text-gray-500 mb-3">{messages.summary.by_rule}</h2>
      <div className="space-y-3">
        {summary.by_rule.map((r) => (
          <div key={r.rule_id} className="border rounded-xl p-4">
            <h3 className="font-medium text-gray-900 mb-2">{r.title}</h3>
            <div className="grid grid-cols-3 gap-2 text-xs text-center">
              <div>
                <div className="text-emerald-600 font-bold text-lg">{r.approved_count}</div>
                <div className="text-gray-400">{messages.summary.approved}</div>
              </div>
              <div>
                <div className="text-orange-500 font-bold text-lg">{r.rejected_count}</div>
                <div className="text-gray-400">{messages.summary.rejected}</div>
              </div>
              <div>
                <div className="text-gray-400 font-bold text-lg">{r.expired_count}</div>
                <div className="text-gray-400">{messages.summary.expired}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <BottomNav active="weekly" />
    </main>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { messages } from '@/lib/i18n'
import { BottomNav } from '@/components/BottomNav'
import { getEvents, approveEvent, rejectEvent, getRules, getCoupleId, Event, Rule } from '@/lib/api'

export default function ApprovalPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [ruleMap, setRuleMap] = useState<Map<string, Rule>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const coupleId = getCoupleId()

  useEffect(() => {
    if (!coupleId) { router.push('/'); return }
    load()
  }, [])

  async function load() {
    if (!coupleId) return
    try {
      const [eventsData, rulesData] = await Promise.all([
        getEvents(coupleId, 'pending'),
        getRules(coupleId),
      ])
      setEvents(eventsData.items)
      setRuleMap(new Map(rulesData.items.map((r) => [r.id, r])))
    } catch {
      setError(messages.errors.network)
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(eventId: string) {
    setError(null)
    try {
      await approveEvent(eventId)
      setEvents((prev) => prev.filter((e) => e.id !== eventId))
    } catch (e: unknown) {
      const err = e as { code?: string }
      if (err.code === 'COUPLE_LOCKED') setError(messages.errors.COUPLE_LOCKED)
      else setError(messages.errors.network)
    }
  }

  async function handleReject(eventId: string) {
    setError(null)
    try {
      await rejectEvent(eventId)
      setEvents((prev) => prev.filter((e) => e.id !== eventId))
    } catch {
      setError(messages.errors.network)
    }
  }

  const isExpired = (e: Event) => new Date(e.created_at).getTime() + 24 * 60 * 60 * 1000 < Date.now()

  if (loading) return <div className="p-6 text-center text-gray-400">{messages.common.loading}</div>

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">{messages.approval.title}</h1>
        <button onClick={() => router.push('/home')} className="text-gray-500 text-sm">{messages.common.back}</button>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {events.length === 0 ? (
        <p className="text-gray-400 text-center py-12">{messages.approval.empty}</p>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const rule = ruleMap.get(event.rule_id)
            const expired = isExpired(event)
            const isAdhoc = rule?.mode === 'adhoc'
            return (
              <div key={event.id} className="border rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                    {messages.approval.from_partner}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(event.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>

                {rule && (
                  <div className="mb-2">
                    <p className="font-semibold text-gray-900 text-sm">{rule.title}</p>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full mt-1 inline-block ${isAdhoc ? 'bg-violet-100 text-violet-700' : 'bg-sky-100 text-sky-700'}`}>
                      {isAdhoc ? messages.home.thank_you_short : messages.home.nobishiro_short}
                    </span>
                  </div>
                )}

                {event.note && (
                  <p className="text-xs text-gray-500 mb-2 italic">「{event.note}」</p>
                )}

                {expired ? (
                  <p className="text-sm text-gray-400 mt-2">{messages.approval.expired}</p>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 mb-3">{messages.approval.hint}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(event.id)}
                        className="flex-1 py-2 text-sm rounded-lg border border-gray-200 text-gray-600"
                      >
                        {messages.approval.reject}
                      </button>
                      <button
                        onClick={() => handleApprove(event.id)}
                        className="flex-1 py-2 text-sm rounded-lg bg-brand-500 text-white"
                      >
                        {messages.approval.approve}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      <BottomNav active="home" />
    </main>
  )
}

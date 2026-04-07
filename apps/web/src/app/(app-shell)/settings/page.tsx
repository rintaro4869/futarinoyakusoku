'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { messages } from '@/lib/i18n'
import {
  pauseCouple,
  unpauseCouple,
  leaveCouple,
  deleteUserData,
  trackHelpClick,
  getCoupleId,
  getUserId,
} from '@/lib/api'
import { resetTutorial } from '@/lib/tutorial'

const HELP_URL = 'https://www.dv-sodan.com/'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const coupleId = getCoupleId()
  const userId = getUserId()

  async function handlePause() {
    if (!coupleId) return
    setLoading(true)
    setError(null)
    try {
      await pauseCouple(coupleId)
      setStatus('paused')
    } catch {
      setError(messages.errors.network)
    } finally {
      setLoading(false)
    }
  }

  async function handleUnpause() {
    if (!coupleId) return
    setLoading(true)
    setError(null)
    try {
      await unpauseCouple(coupleId)
      setStatus('active')
    } catch {
      setError(messages.errors.network)
    } finally {
      setLoading(false)
    }
  }

  async function handleLeave() {
    if (!coupleId || !confirm(messages.safety.confirm_leave)) return
    setLoading(true)
    setError(null)
    try {
      await leaveCouple(coupleId)
      localStorage.clear()
      router.push('/')
    } catch {
      setError(messages.errors.network)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!userId || !confirm(messages.safety.confirm_delete)) return
    setLoading(true)
    setError(null)
    try {
      await deleteUserData(userId)
      localStorage.clear()
      router.push('/')
    } catch {
      setError(messages.errors.network)
    } finally {
      setLoading(false)
    }
  }

  async function handleHelp() {
    try {
      await trackHelpClick(coupleId ?? undefined)
    } catch {
      // no-op
    }
    window.open(HELP_URL, '_blank', 'noopener,noreferrer')
  }

  function handleResetTutorial() {
    resetTutorial()
    router.push('/tutorial')
  }

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{messages.safety.title}</h1>
        <button onClick={() => router.push('/home')} className="text-gray-500 text-sm">{messages.common.back}</button>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {status === 'paused' && <p className="text-orange-600 text-sm mb-4 rounded-xl bg-orange-50 p-3">{messages.safety.paused_state}</p>}
      {status === 'active' && <p className="text-emerald-600 text-sm mb-4 rounded-xl bg-emerald-50 p-3">{messages.safety.active_state}</p>}

      <div className="space-y-3">
        <SectionCard title={messages.safety.pause_card_title} desc={messages.safety.pause_card_desc}>
          <div className="flex gap-2">
            <button
              onClick={handlePause}
              disabled={loading}
              className="flex-1 py-2 rounded-xl border border-orange-300 text-orange-600 text-sm"
            >
              {messages.safety.pause}
            </button>
            <button
              onClick={handleUnpause}
              disabled={loading}
              className="flex-1 py-2 rounded-xl border border-emerald-300 text-emerald-600 text-sm"
            >
              {messages.safety.unpause}
            </button>
          </div>
        </SectionCard>

        <SectionCard title={messages.safety.help_card_title} desc={messages.safety.help_card_desc}>
          <button onClick={handleHelp} className="w-full py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold">
            {messages.safety.help}
          </button>
        </SectionCard>

        <SectionCard title={messages.safety.tutorial_title} desc={messages.safety.tutorial_desc}>
          <button onClick={handleResetTutorial} className="w-full py-2 rounded-xl border border-gray-200 text-sm text-gray-700">
            {messages.safety.tutorial_reset}
          </button>
        </SectionCard>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <h2 className="font-semibold text-red-700 mb-3">{messages.safety.danger_title}</h2>
          <div className="space-y-2">
            <button
              onClick={handleLeave}
              disabled={loading}
              className="w-full py-2 rounded-xl border border-red-300 text-red-600 text-sm"
            >
              {messages.safety.leave}
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="w-full py-2 rounded-xl bg-red-600 text-white text-sm font-semibold"
            >
              {messages.safety.delete}
            </button>
          </div>
        </div>
      </div>

    </main>
  )
}

function SectionCard({
  title,
  desc,
  children,
}: {
  title: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <h2 className="font-semibold text-gray-900 mb-1">{title}</h2>
      <p className="text-xs text-gray-500 mb-3">{desc}</p>
      {children}
    </div>
  )
}

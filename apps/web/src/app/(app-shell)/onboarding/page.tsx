'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { messages } from '@/lib/i18n'
import { createAnonymousUser, getToken, getCoupleId } from '@/lib/api'
import { hasSeenTutorial } from '@/lib/tutorial'

export default function OnboardingPage() {
  const router = useRouter()
  const [agreed, setAgreed] = useState({ a1: false, a2: false, a3: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allAgreed = agreed.a1 && agreed.a2 && agreed.a3

  useEffect(() => {
    const token = getToken()
    const coupleId = getCoupleId()
    if (token && coupleId) {
      router.push(hasSeenTutorial() ? '/home' : '/tutorial')
    }
  }, [router])

  async function handleStart() {
    if (!allAgreed || loading) return
    setLoading(true)
    setError(null)
    try {
      await createAnonymousUser()
      router.push('/pair')
    } catch {
      setError(messages.errors.network)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="p-6 flex flex-col min-h-screen">
      <div className="flex-1 flex flex-col justify-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">{messages.onboarding.title}</h1>
        <p className="text-gray-600 mb-8">{messages.onboarding.description}</p>

        <div className="space-y-4 mb-8">
          {[
            { key: 'a1' as const, text: messages.onboarding.agree_1 },
            { key: 'a2' as const, text: messages.onboarding.agree_2 },
            { key: 'a3' as const, text: messages.onboarding.agree_3 },
          ].map(({ key, text }) => (
            <label key={key} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed[key]}
                onChange={(e) => setAgreed((prev) => ({ ...prev, [key]: e.target.checked }))}
                className="mt-1 h-4 w-4 text-brand-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">{text}</span>
            </label>
          ))}
        </div>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <button
          onClick={handleStart}
          disabled={!allAgreed || loading}
          className="w-full py-3 px-4 rounded-xl bg-brand-500 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-600 transition-colors"
        >
          {loading ? '...' : messages.onboarding.cta}
        </button>
      </div>
    </main>
  )
}

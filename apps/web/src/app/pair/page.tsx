'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { messages } from '@/lib/i18n'
import { createAnonymousUser, createCouple, joinCouple, getToken, getUserId } from '@/lib/api'

export default function PairPage() {
  const router = useRouter()
  const params = useSearchParams()
  const inviteCode = params.get('code')

  const [mode, setMode] = useState<'choose' | 'create' | 'join'>(inviteCode ? 'join' : 'choose')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [joinCode, setJoinCode] = useState(inviteCode ?? '')
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    let mounted = true
    async function ensureAuth() {
      try {
        if (!getToken() || !getUserId()) {
          await createAnonymousUser()
        }
      } catch {
        if (mounted) setError(messages.errors.network)
      } finally {
        if (mounted) setBooting(false)
      }
    }
    ensureAuth()
    return () => {
      mounted = false
    }
  }, [])

  async function withFreshAuth<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn()
    } catch (e: unknown) {
      const err = e as { code?: string }
      if (err.code === 'AUTH_REQUIRED') {
        await createAnonymousUser()
        return fn()
      }
      throw e
    }
  }

  async function handleCreate() {
    if (!displayName.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data = await withFreshAuth(() => createCouple(displayName.trim()))
      setInviteUrl(data.invite_url)
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string }
      const key = err.code as keyof typeof messages.errors | undefined
      setError(key && key in messages.errors ? messages.errors[key as keyof typeof messages.errors] : (err.message ?? messages.errors.network))
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleJoin() {
    if (!displayName.trim() || !joinCode.trim()) return
    setLoading(true)
    setError(null)
    try {
      await withFreshAuth(() => joinCouple(joinCode.trim().toUpperCase(), displayName.trim()))
      router.push('/tutorial')
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string }
      const key = err.code as keyof typeof messages.errors | undefined
      setError(key && key in messages.errors ? messages.errors[key as keyof typeof messages.errors] : (err.message ?? messages.errors.network))
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'choose') {
    return (
      <main className="p-6 flex flex-col min-h-screen">
        <h1 className="text-2xl font-bold mb-2">{messages.pairing.title}</h1>
        <p className="text-sm text-gray-600 mb-8">{messages.pairing.description}</p>

        {booting && <p className="text-sm text-gray-500 mb-4">{messages.common.loading}</p>}
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <div className="space-y-3">
          <button
            onClick={() => setMode('create')}
            disabled={booting}
            className="w-full rounded-2xl border border-brand-300 bg-brand-50 px-4 py-4 text-left"
          >
            <p className="text-sm font-semibold text-brand-700">{messages.pairing.create_link}</p>
            <p className="mt-1 text-xs text-brand-600">{messages.pairing.create_hint}</p>
          </button>
          <button
            onClick={() => setMode('join')}
            disabled={booting}
            className="w-full rounded-2xl border border-gray-200 px-4 py-4 text-left"
          >
            <p className="text-sm font-semibold text-gray-800">{messages.pairing.join_with_code}</p>
            <p className="mt-1 text-xs text-gray-500">{messages.pairing.join_hint}</p>
          </button>
        </div>
      </main>
    )
  }

  if (mode === 'create') {
    return (
      <main className="p-6 flex flex-col min-h-screen">
        <button onClick={() => setMode('choose')} className="text-gray-500 mb-6">{messages.common.back}</button>
        <h1 className="text-2xl font-bold mb-2">{messages.pairing.create_link}</h1>
        <p className="text-sm text-gray-600 mb-6">{messages.pairing.create_step}</p>

        {!inviteUrl ? (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-2">{messages.common.your_name}</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              maxLength={30}
              placeholder={messages.common.name_placeholder}
              className="w-full border rounded-xl px-3 py-3 mb-6 focus:ring-2 focus:ring-brand-300 outline-none"
            />
            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
            <button
              onClick={handleCreate}
              disabled={booting || !displayName.trim() || loading}
              className="w-full py-3 rounded-2xl bg-brand-500 text-white font-medium disabled:opacity-40"
            >
              {loading ? '...' : messages.pairing.create_link}
            </button>
          </>
        ) : (
          <>
            <p className="text-green-700 bg-green-50 rounded-xl p-3 mb-4 text-sm">
              {messages.pairing.waiting}
            </p>
            <div className="bg-gray-100 rounded-xl p-4 mb-4 break-all text-sm text-gray-700">
              {inviteUrl}
            </div>
            <button
              onClick={handleCopy}
              className="w-full py-3 rounded-2xl bg-brand-500 text-white font-medium"
            >
              {copied ? messages.pairing.copied : messages.pairing.copy_link}
            </button>

            <button
              onClick={() => router.push('/tutorial')}
              className="mt-3 w-full py-3 rounded-2xl border border-gray-200 text-sm font-medium text-gray-700"
            >
              {messages.pairing.preview_tutorial}
            </button>
          </>
        )}
      </main>
    )
  }

  return (
    <main className="p-6 flex flex-col min-h-screen">
      <button onClick={() => setMode('choose')} className="text-gray-500 mb-6">{messages.common.back}</button>
      <h1 className="text-2xl font-bold mb-2">{messages.pairing.join_with_code}</h1>
      <p className="text-sm text-gray-600 mb-6">{messages.pairing.join_step}</p>

      <label className="block text-sm font-medium text-gray-700 mb-2">{messages.common.your_name}</label>
      <input
        type="text"
        value={displayName}
        onChange={e => setDisplayName(e.target.value)}
        maxLength={30}
        placeholder={messages.common.name_placeholder}
        className="w-full border rounded-xl px-3 py-3 mb-4 focus:ring-2 focus:ring-brand-300 outline-none"
      />

      <label className="block text-sm font-medium text-gray-700 mb-2">{messages.pairing.invite_code}</label>
      <input
        type="text"
        value={joinCode}
        onChange={e => setJoinCode(e.target.value.toUpperCase())}
        maxLength={8}
        placeholder={messages.pairing.code_placeholder}
        className="w-full border rounded-xl px-3 py-3 mb-2 font-mono text-center text-2xl tracking-widest focus:ring-2 focus:ring-brand-300 outline-none"
      />
      <p className="mb-6 text-xs text-gray-500">{messages.pairing.join_note}</p>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <button
        onClick={handleJoin}
        disabled={booting || !displayName.trim() || joinCode.length < 6 || loading}
        className="w-full py-3 rounded-2xl bg-brand-500 text-white font-medium disabled:opacity-40"
      >
        {loading ? '...' : messages.pairing.join_cta}
      </button>
    </main>
  )
}

'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { messages } from '@/lib/i18n'
import { markTutorialSeen } from '@/lib/tutorial'

export default function TutorialPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)

  const steps = useMemo(() => [
    {
      title: messages.tutorial.steps.s1_title,
      body: messages.tutorial.steps.s1_body,
      hint: messages.tutorial.steps.s1_hint,
      tone: 'from-cyan-500 to-teal-500',
    },
    {
      title: messages.tutorial.steps.s2_title,
      body: messages.tutorial.steps.s2_body,
      hint: messages.tutorial.steps.s2_hint,
      tone: 'from-emerald-500 to-lime-500',
    },
    {
      title: messages.tutorial.steps.s3_title,
      body: messages.tutorial.steps.s3_body,
      hint: messages.tutorial.steps.s3_hint,
      tone: 'from-orange-500 to-amber-500',
    },
    {
      title: messages.tutorial.steps.s4_title,
      body: messages.tutorial.steps.s4_body,
      hint: messages.tutorial.steps.s4_hint,
      tone: 'from-fuchsia-500 to-pink-500',
    },
  ], [])

  const current = steps[step]
  const isLast = step === steps.length - 1

  function finish() {
    markTutorialSeen()
    router.push('/home')
  }

  return (
    <main className="p-6 min-h-screen flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-gray-500">{messages.tutorial.progress.replace('{current}', String(step + 1)).replace('{total}', String(steps.length))}</p>
        <button
          onClick={finish}
          className="text-xs text-gray-500 underline-offset-2 hover:underline"
        >
          {messages.tutorial.skip}
        </button>
      </div>

      <div className={`rounded-3xl bg-gradient-to-br ${current.tone} p-[1px]`}>
        <div className="rounded-3xl bg-white p-6">
          <p className="text-xs text-gray-500 mb-2">{messages.tutorial.title}</p>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{current.title}</h1>
          <p className="mt-3 text-sm text-gray-700 leading-relaxed">{current.body}</p>
          <p className="mt-4 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">{current.hint}</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {steps.map((_, idx) => (
          <div
            key={idx}
            className={`h-1.5 flex-1 rounded-full ${idx <= step ? 'bg-brand-500' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      <div className="mt-auto space-y-3 pt-6">
        {!isLast && (
          <button
            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            className="w-full rounded-2xl bg-brand-500 py-3 text-sm font-semibold text-white"
          >
            {messages.tutorial.next}
          </button>
        )}

        {isLast && (
          <button
            onClick={finish}
            className="w-full rounded-2xl bg-brand-500 py-3 text-sm font-semibold text-white"
          >
            {messages.tutorial.finish}
          </button>
        )}

        {step > 0 && (
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="w-full rounded-2xl border border-gray-200 py-3 text-sm font-medium text-gray-700"
          >
            {messages.tutorial.prev}
          </button>
        )}
      </div>
    </main>
  )
}

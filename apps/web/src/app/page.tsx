'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getToken, getCoupleId } from '@/lib/api'
import { hasSeenTutorial } from '@/lib/tutorial'

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    const token = getToken()
    const coupleId = getCoupleId()
    if (token && coupleId) {
      router.push(hasSeenTutorial() ? '/home' : '/tutorial')
    }
  }, [router])

  return (
    <main className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-10 text-center">
        <div className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Pairlog</div>
        <p className="text-base text-gray-500 mb-10">ふたりの約束を、記録して、育てる。</p>

        <div className="w-full max-w-xs space-y-3">
          <button
            onClick={() => router.push('/onboarding')}
            className="w-full py-3 px-4 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors"
          >
            無料で始める
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-12 space-y-6">
        <FeatureCard
          emoji="📋"
          title="約束ボックスを作る"
          desc="ふたりで大事にしたいことを約束ボックスに入れて、お互いが見える形にします。"
        />
        <FeatureCard
          emoji="✅"
          title="2タップで毎日記録"
          desc="「思いがけないありがとう」か「約束できた」を押すだけ。続けやすい設計です。"
        />
        <FeatureCard
          emoji="📊"
          title="ポイントで関係を可視化"
          desc="サンキューポイントとのびしろポイントを分けて積み上げ、ふたりの状態を週次で振り返ります。"
        />
        <FeatureCard
          emoji="🔒"
          title="安全・プライバシー重視"
          desc="いつでも停止・解除できます。強制や威圧を防ぐ設計になっています。"
        />
      </section>

      {/* Bottom CTA */}
      <section className="px-6 pb-16 text-center">
        <button
          onClick={() => router.push('/onboarding')}
          className="w-full py-3 px-4 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors"
        >
          無料で始める
        </button>
        <p className="text-xs text-gray-400 mt-3">登録不要・完全無料</p>
      </section>
    </main>
  )
}

function FeatureCard({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="text-2xl w-10 shrink-0 text-center">{emoji}</div>
      <div>
        <div className="font-semibold text-gray-900 mb-1">{title}</div>
        <div className="text-sm text-gray-500 leading-relaxed">{desc}</div>
      </div>
    </div>
  )
}

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

  const handleStart = () => router.push('/onboarding')

  return (
    <main className="flex flex-col min-h-screen bg-white">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-pink-50 to-white px-6 pt-14 pb-12 text-center">
        {/* 背景の装飾円 */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-pink-100 opacity-50" />
        <div className="pointer-events-none absolute -bottom-10 -left-16 w-48 h-48 rounded-full bg-pink-100 opacity-40" />

        <div className="relative">
          <span className="inline-block text-xs font-semibold tracking-widest text-brand-500 uppercase mb-4">
            Couple Promise Tracker
          </span>
          <h1 className="text-4xl font-bold text-gray-900 mb-3 leading-tight">
            Pairlog
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed mb-2">
            ふたりの約束を記録して、<br />関係をすこしずつ育てる。
          </p>
          <p className="text-sm text-gray-400 mb-8">登録不要・完全無料</p>

          {/* ミニUIプレビュー */}
          <div className="mx-auto mb-8 max-w-xs rounded-2xl border border-gray-100 bg-white shadow-lg p-4 text-left">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-brand-400" />
              <span className="text-xs font-medium text-gray-500">今日の約束ダッシュボード</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="rounded-xl bg-pink-50 p-3 text-center">
                <div className="text-xl font-bold text-brand-500">12</div>
                <div className="text-xs text-gray-400">サンキュー pt</div>
              </div>
              <div className="rounded-xl bg-sky-50 p-3 text-center">
                <div className="text-xl font-bold text-sky-500">8</div>
                <div className="text-xs text-gray-400">のびしろ pt</div>
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <div className="text-xs text-gray-500 mb-1">約束ボックス</div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 rounded-full bg-brand-400" />
                <div>
                  <div className="text-xs font-medium text-gray-700">連絡は当日中に返す</div>
                  <div className="text-xs text-gray-400">ルーティン · 今週 3回</div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full max-w-xs py-4 rounded-2xl bg-brand-500 text-white font-semibold text-base shadow-md hover:bg-brand-600 active:scale-95 transition-all"
          >
            無料で始める →
          </button>
        </div>
      </section>

      {/* ── こんな経験ありませんか？ ── */}
      <section className="px-6 py-10">
        <h2 className="text-lg font-bold text-gray-900 mb-6 text-center">
          こんな経験、ありませんか？
        </h2>
        <div className="space-y-3">
          {[
            '「言った」「言わない」でケンカになった',
            '約束を守れなかったとき、どう謝ればいいかわからなかった',
            '相手が不満を抱えていることに、ずっと気づかなかった',
          ].map((text) => (
            <div key={text} className="flex items-start gap-3 rounded-xl bg-gray-50 px-4 py-3">
              <span className="mt-0.5 text-gray-300 font-bold shrink-0">✗</span>
              <span className="text-sm text-gray-600">{text}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-center text-gray-500">
          Pairlog は、責めるためでなく<br />
          <span className="font-semibold text-gray-700">「整えるために使う」</span>アプリです。
        </p>
      </section>

      {/* ── 使い方 3ステップ ── */}
      <section className="px-6 py-10 bg-gray-50">
        <h2 className="text-lg font-bold text-gray-900 mb-8 text-center">3ステップで始められる</h2>
        <div className="space-y-6">
          {[
            {
              step: '01',
              title: '約束ボックスを作る',
              desc: 'ふたりで大切にしたいことを3つまで登録。ルーティンでもAdhocでもOK。',
              color: 'bg-brand-500',
            },
            {
              step: '02',
              title: '2タップで毎日記録',
              desc: '「思いがけないありがとう」か「約束できた」を押すだけ。10秒で完了。',
              color: 'bg-sky-500',
            },
            {
              step: '03',
              title: '週次サマリーで振り返る',
              desc: 'ポイントとグラフでふたりの一週間を可視化。調整したいことも見つかる。',
              color: 'bg-emerald-500',
            },
          ].map(({ step, title, desc, color }) => (
            <div key={step} className="flex gap-4 items-start">
              <div className={`${color} text-white text-xs font-bold rounded-xl px-2.5 py-1.5 shrink-0`}>
                {step}
              </div>
              <div>
                <div className="font-semibold text-gray-900 mb-1">{title}</div>
                <div className="text-sm text-gray-500 leading-relaxed">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 安心・安全 ── */}
      <section className="px-6 py-10">
        <h2 className="text-lg font-bold text-gray-900 mb-6 text-center">安心して使える設計</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '🤝', label: '双方の合意で使う' },
            { icon: '⏸️', label: 'いつでも停止できる' },
            { icon: '🔒', label: '強制・威圧に使わない' },
            { icon: '🗑️', label: 'データ完全削除可能' },
          ].map(({ icon, label }) => (
            <div key={label} className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm">
              <div className="text-2xl mb-2">{icon}</div>
              <div className="text-xs font-medium text-gray-600 leading-snug">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-6 pt-4 pb-16 text-center">
        <div className="rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 p-8 text-white shadow-lg">
          <p className="text-lg font-bold mb-1">今日から始めませんか</p>
          <p className="text-sm text-pink-100 mb-6">登録不要・ふたりで無料</p>
          <button
            onClick={handleStart}
            className="w-full py-4 rounded-2xl bg-white text-brand-600 font-bold text-base hover:bg-pink-50 active:scale-95 transition-all shadow"
          >
            無料で始める →
          </button>
        </div>
      </section>

    </main>
  )
}

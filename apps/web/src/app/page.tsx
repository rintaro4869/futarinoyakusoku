'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getToken, getCoupleId } from '@/lib/api'
import { hasSeenTutorial } from '@/lib/tutorial'

export default function LandingPage() {
  const router = useRouter()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    const token = getToken()
    const coupleId = getCoupleId()
    if (token && coupleId) {
      router.push(hasSeenTutorial() ? '/home' : '/tutorial')
    }
  }, [router])

  const handleStart = () => router.push('/onboarding')

  return (
    <main className="flex flex-col min-h-screen" style={{ backgroundColor: '#fdf2f8' }}>

      {/* ── Hero ── */}
      <section className="bg-brand-500 px-6 pt-16 pb-10 text-center">
        <p className="text-pink-200 text-xs font-semibold tracking-widest uppercase mb-4">
          Couple Promise Tracker
        </p>
        <h1 className="text-4xl font-black text-white mb-3 tracking-tight">
          Pairlog
        </h1>
        <p className="text-pink-100 text-lg leading-relaxed mb-1 font-medium">
          ふたりの約束を記録して、
        </p>
        <p className="text-pink-100 text-lg leading-relaxed mb-8 font-medium">
          関係をすこしずつ育てる。
        </p>

        {/* App Preview Card */}
        <div className="mx-auto mb-8 max-w-xs bg-white rounded-3xl shadow-2xl p-5 text-left">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center">
                <span className="text-white text-xs font-black">P</span>
              </div>
              <span className="text-xs font-semibold text-gray-500">今週のPairlog</span>
            </div>
            <span className="text-xs text-gray-300">3月18日</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="rounded-2xl bg-pink-50 p-3 text-center">
              <div className="text-2xl font-black text-brand-500">12</div>
              <div className="text-xs text-pink-300 font-medium">ありがとう</div>
            </div>
            <div className="rounded-2xl bg-orange-50 p-3 text-center">
              <div className="text-2xl font-black text-orange-400">3</div>
              <div className="text-xs text-orange-300 font-medium">のびしろ</div>
            </div>
          </div>

          {[
            { name: '連絡は当日中に返す', n: 4, color: 'bg-brand-400' },
            { name: '週1で一緒にごはん', n: 2, color: 'bg-sky-400' },
          ].map((item) => (
            <div key={item.name} className="flex items-center gap-3 mb-2 last:mb-0 bg-gray-50 rounded-xl px-3 py-2.5">
              <div className={`w-1 h-7 rounded-full ${item.color} shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700 truncate">{item.name}</p>
                <p className="text-xs text-gray-400">今週 {item.n}回</p>
              </div>
              <span className="text-brand-500 text-xs font-bold">✓</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleStart}
          className="w-full max-w-xs py-4 rounded-full bg-white text-brand-600 font-black text-base shadow-lg active:scale-95 transition-transform"
        >
          無料で始める →
        </button>
        <p className="mt-3 text-xs text-pink-200">登録不要・完全無料・2分で始められる</p>
      </section>

      {/* ── Problem ── */}
      <section className="px-6 py-12">
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <p className="text-xs font-bold text-brand-400 tracking-widest uppercase mb-2">Problem</p>
          <h2 className="text-xl font-black text-gray-900 mb-6 leading-snug">
            こんな経験、<br />ありませんか？
          </h2>
          <div className="space-y-3">
            {[
              '「言った」「言わない」でケンカになった',
              '約束を守れなかったとき、どう謝ればいいかわからなかった',
              '相手の不満に、ずっと気づかなかった',
              '責めたくないのに、つい責める言葉になってしまった',
            ].map((text) => (
              <div key={text} className="flex items-start gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                <span className="text-gray-300 font-bold shrink-0 mt-0.5">×</span>
                <span className="text-sm text-gray-600 leading-relaxed">{text}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 bg-pink-50 rounded-2xl px-4 py-4 text-center">
            <p className="text-sm text-gray-700 leading-relaxed">
              これらは「相手が悪い」のではなく、<br />
              <span className="font-bold text-brand-600">記録と対話の仕組みがなかっただけ</span>かもしれません。
            </p>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-6 pb-12">
        <div className="bg-brand-500 rounded-3xl p-6 text-white">
          <p className="text-xs font-bold text-pink-200 tracking-widest uppercase mb-2">How it works</p>
          <h2 className="text-xl font-black mb-6">3分で始められる</h2>
          <div className="space-y-5">
            {[
              { n: '01', title: 'ふたりを繋げる', desc: '招待リンクをパートナーに送るだけ。アカウント登録は不要です。', badge: '約1分' },
              { n: '02', title: '約束ボックスを作る', desc: 'ふたりで大切にしたいことを3つ登録。テンプレートから選べます。', badge: '約2分' },
              { n: '03', title: '毎日2タップで記録', desc: '「できた」か「調整」を押すだけ。10秒で完了。', badge: '毎日10秒' },
            ].map(({ n, title, desc, badge }) => (
              <div key={n} className="flex gap-4 items-start">
                <div className="bg-white/20 rounded-xl w-10 h-10 flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-black">{n}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white text-base">{title}</span>
                    <span className="text-xs bg-white/20 text-pink-100 px-2 py-0.5 rounded-full">{badge}</span>
                  </div>
                  <p className="text-pink-100 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-6 pb-12">
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <p className="text-xs font-bold text-brand-400 tracking-widest uppercase mb-2">Features</p>
          <h2 className="text-xl font-black text-gray-900 mb-6">Pairlogの6つの機能</h2>
          <div className="space-y-3">
            {[
              { icon: '📦', title: '約束ボックス', desc: 'ふたりの約束を最大3つカード化。ルーティン・Adhocを選べます。', bg: 'bg-pink-50' },
              { icon: '✨', title: 'ありがとうポイント', desc: '守れたとき「できた」を1タップ。感謝を積み重ねる記録方式。', bg: 'bg-sky-50' },
              { icon: '🔧', title: 'のびしろポイント', desc: 'すれ違いがあったとき「調整」を1タップ。罰ではなく整えるきっかけ。', bg: 'bg-orange-50' },
              { icon: '🎁', title: 'ごほうび解放', desc: 'ポイントが貯まると「ごほうびタイム」。デートの企画権など楽しみに変換。', bg: 'bg-emerald-50' },
              { icon: '📊', title: '週次サマリー', desc: '週1で達成状況をグラフ確認。「どこでズレたか」が見えます。', bg: 'bg-violet-50' },
              { icon: '🔒', title: 'セーフティ設計', desc: '双方の合意で使う設計。いつでも停止・完全削除が可能。', bg: 'bg-gray-50' },
            ].map(({ icon, title, desc, bg }) => (
              <div key={title} className={`${bg} rounded-2xl p-4 flex items-start gap-3`}>
                <span className="text-2xl shrink-0">{icon}</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-0.5">{title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why ── */}
      <section className="px-6 pb-12">
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <p className="text-xs font-bold text-brand-400 tracking-widest uppercase mb-2">Why Pairlog</p>
          <h2 className="text-xl font-black text-gray-900 mb-6">大切にしていること</h2>
          <div className="space-y-5">
            {[
              { n: '1', title: '罰ではなく、修復', desc: '「のびしろポイント」は罰点ではありません。すれ違いを整えるきっかけです。' },
              { n: '2', title: '感謝を可視化する', desc: '相手がやってくれていることを「当然」と感じがちです。記録することで気づきが生まれます。' },
              { n: '3', title: '続けやすい設計', desc: '毎日10秒、週次3分。アプリに振り回されず、ふたりの対話の補助ツールとして機能します。' },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-brand-500 text-white text-sm font-black flex items-center justify-center shrink-0">
                  {n}
                </div>
                <div>
                  <p className="font-bold text-gray-900 mb-1">{title}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Safety ── */}
      <section className="px-6 pb-12">
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <p className="text-xs font-bold text-brand-400 tracking-widest uppercase mb-2">Safety</p>
          <h2 className="text-xl font-black text-gray-900 mb-5">安心して使える設計</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { icon: '🤝', label: '双方の合意で使う', desc: '招待を受け入れた場合のみ' },
              { icon: '⏸️', label: 'いつでも停止', desc: '単独で一時停止できます' },
              { icon: '🚫', label: '強制利用は禁止', desc: '違反は利用停止対象です' },
              { icon: '🗑️', label: 'データ完全削除', desc: '退会時に全て削除可能' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-gray-50 rounded-2xl p-4 text-center">
                <div className="text-2xl mb-2">{icon}</div>
                <p className="text-xs font-bold text-gray-700 mb-1">{label}</p>
                <p className="text-xs text-gray-400 leading-snug">{desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <p className="text-xs text-amber-700 text-center leading-relaxed">
              ⚠️ 監視・コントロール・強制目的での利用は禁止しています。
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-6 pb-12">
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <p className="text-xs font-bold text-brand-400 tracking-widest uppercase mb-2">FAQ</p>
          <h2 className="text-xl font-black text-gray-900 mb-5">よくある質問</h2>
          <div className="space-y-2">
            {[
              { q: '完全無料ですか？', a: 'はい、すべての機能を無料でご利用いただけます。アカウント登録も不要です。' },
              { q: 'データは相手に全部見られますか？', a: '約束の達成記録はふたりで共有されます。メモは相互承認型を選んだ場合のみ共有されます。' },
              { q: '使うのをやめたいときは？', a: '設定画面からいつでも一時停止・退会・データ完全削除ができます。' },
              { q: 'スマートフォンのアプリですか？', a: 'ブラウザで動くWebアプリです。インストール不要でiPhone・Androidどちらでも使えます。' },
              { q: 'iOSアプリはありますか？', a: '現在Webアプリのみです。iOSアプリは開発中です。' },
            ].map(({ q, a }, i) => (
              <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left bg-white"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-sm font-semibold text-gray-800 pr-3">{q}</span>
                  <span className={`text-brand-500 font-bold text-xl shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 bg-white">
                    <p className="text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-3">{a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-6 pb-16">
        <div className="bg-brand-500 rounded-3xl p-8 text-center">
          <p className="text-3xl mb-4">💑</p>
          <p className="text-xl font-black text-white mb-1">ふたりで、今日から</p>
          <p className="text-sm text-pink-200 mb-7">登録不要・完全無料</p>
          <button
            onClick={handleStart}
            className="w-full py-4 rounded-full bg-white text-brand-600 font-black text-base active:scale-95 transition-transform shadow"
          >
            無料で始める →
          </button>
          <p className="mt-4 text-xs text-pink-300">所要時間 約3分 · いつでも退会可</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 pb-10 text-center">
        <p className="text-xs text-gray-300">© 2026 Pairlog</p>
      </footer>

    </main>
  )
}

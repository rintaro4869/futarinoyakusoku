'use client'

import { useState } from 'react'
import Link from 'next/link'

const APP_STORE_URL = 'https://apps.apple.com/app/id6760982290'

const faqs = [
  { q: 'Is it free?', a: 'Yes, all features are completely free.' },
  { q: 'Is it available on iPhone and Android?', a: 'Pairlog is currently available on iOS (iPhone) via the App Store.' },
  { q: 'Can my partner see everything I log?', a: 'Promise records, gratitude logs, and calendar entries are shared between the two of you.' },
  { q: 'What if I want to stop using it?', a: 'You can pause, delete your account, or remove all data anytime from the app settings.' },
  { q: 'How do I connect with my partner?', a: 'Generate an invite link inside the app and send it to your partner. Simple.' },
]

export default function EnPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <main className="flex flex-col min-h-screen" style={{ backgroundColor: '#fdf2f8' }}>

      {/* Language switcher */}
      <div className="flex justify-end px-4 pt-4">
        <Link href="/" className="text-xs text-pink-400 font-semibold border border-pink-200 rounded-full px-3 py-1">
          日本語
        </Link>
      </div>

      {/* Hero */}
      <section className="bg-brand-500 px-6 pt-10 pb-10 text-center">
        <p className="text-pink-200 text-xs font-semibold tracking-widest uppercase mb-4">
          The couple&apos;s logging app
        </p>
        <h1 className="text-4xl font-black text-white mb-3 tracking-tight">
          Pairlog
        </h1>
        <p className="text-pink-100 text-lg leading-relaxed mb-1 font-medium">
          Record your days together.
        </p>
        <p className="text-pink-100 text-sm leading-relaxed mb-8">
          Gratitude, promises, and memories — all in one place.
        </p>

        {/* App Store button */}
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white text-brand-600 font-black text-base px-8 py-4 rounded-full shadow-lg active:scale-95 transition-transform"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          Download on App Store
        </a>
        <p className="mt-3 text-xs text-pink-200">Free · iPhone</p>
      </section>

      {/* Problem */}
      <section className="px-6 py-12">
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <p className="text-xs font-bold text-brand-400 tracking-widest uppercase mb-2">Sound familiar?</p>
          <h2 className="text-xl font-black text-gray-900 mb-6 leading-snug">
            Before small things<br />become big ones.
          </h2>
          <div className="space-y-3">
            {[
              '"I said it." "No you didn\'t." — another argument.',
              'A promise made, then quietly forgotten.',
              'Not noticing how your partner was feeling — for weeks.',
              'Wanting to say thank you, but never finding the right moment.',
            ].map((text) => (
              <div key={text} className="flex items-start gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                <span className="text-gray-300 font-bold shrink-0 mt-0.5">×</span>
                <span className="text-sm text-gray-600 leading-relaxed">{text}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 bg-pink-50 rounded-2xl px-4 py-4 text-center">
            <p className="text-sm text-gray-700 leading-relaxed">
              A simple place to log things together<br />
              <span className="font-bold text-brand-600">can quietly change everything.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-12">
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <p className="text-xs font-bold text-brand-400 tracking-widest uppercase mb-2">Features</p>
          <h2 className="text-xl font-black text-gray-900 mb-6">4 things you can do</h2>
          <div className="space-y-3">
            {[
              { icon: '📝', title: 'Promise List', desc: 'Keep track of what you\'ve agreed on — so nothing gets forgotten.', bg: 'bg-pink-50' },
              { icon: '🙏', title: 'Gratitude Log', desc: 'Record the moments you felt thankful for your partner, with a note to remember why.', bg: 'bg-sky-50' },
              { icon: '📅', title: 'Calendar', desc: 'Look back and see what you did together and when.', bg: 'bg-orange-50' },
              { icon: '🎁', title: 'Rewards', desc: 'As you log more, you earn points toward rewards you choose together.', bg: 'bg-emerald-50' },
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

      {/* Safety */}
      <section className="px-6 pb-12">
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <p className="text-xs font-bold text-brand-400 tracking-widest uppercase mb-2">Safety</p>
          <h2 className="text-xl font-black text-gray-900 mb-5">Built with care</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '🤝', label: 'Mutual consent only', desc: 'Only works when both agree' },
              { icon: '⏸️', label: 'Pause anytime', desc: 'Either person can pause independently' },
              { icon: '🚫', label: 'No surveillance', desc: 'Misuse results in account suspension' },
              { icon: '🗑️', label: 'Full data deletion', desc: 'Delete everything on account removal' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-gray-50 rounded-2xl p-4 text-center">
                <div className="text-2xl mb-2">{icon}</div>
                <p className="text-xs font-bold text-gray-700 mb-1">{label}</p>
                <p className="text-xs text-gray-400 leading-snug">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 pb-12">
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <p className="text-xs font-bold text-brand-400 tracking-widest uppercase mb-2">FAQ</p>
          <h2 className="text-xl font-black text-gray-900 mb-5">Questions</h2>
          <div className="space-y-2">
            {faqs.map(({ q, a }, i) => (
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

      {/* Final CTA */}
      <section className="px-6 pb-16">
        <div className="bg-brand-500 rounded-3xl p-8 text-center">
          <p className="text-3xl mb-4">💑</p>
          <p className="text-xl font-black text-white mb-1">Start logging together, today.</p>
          <p className="text-sm text-pink-200 mb-7">Free · iPhone</p>
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-4 rounded-full bg-white text-brand-600 font-black text-base active:scale-95 transition-transform shadow text-center"
          >
            Download on App Store
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 pb-10 text-center space-y-2">
        <Link href="/" className="text-xs text-gray-400 underline">日本語</Link>
        <p className="text-xs text-gray-300">© 2026 Pairlog</p>
        <Link href="/privacy" className="text-xs text-gray-300 underline">Privacy Policy</Link>
      </footer>

    </main>
  )
}

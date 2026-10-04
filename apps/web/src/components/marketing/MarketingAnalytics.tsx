'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

const ID = 'G-JLVB3HZSGY'
const CONSENT_KEY = 'pairlog_public_analytics_consent'
const PUBLIC_PATH = /^\/(?:en\/?|download\/?|en\/download\/?|privacy\/?|(?:en\/)?guide(?:\/[a-z0-9-]+)?\/?)?$/
let tagLoaded = false

type AnalyticsWindow = Window & {
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
}

function isPublic(pathname: string) {
  return typeof window !== 'undefined' &&
    (location.hostname === 'pairlog.pages.dev' || location.hostname.endsWith('.pairlog.pages.dev')) &&
    PUBLIC_PATH.test(pathname)
}

function stopAnalytics() {
  ;(window as unknown as Record<string, unknown>)[`ga-disable-${ID}`] = true
  document.getElementById('pairlog-public-ga')?.remove()
}

export default function MarketingAnalytics() {
  const pathname = usePathname() ?? ''
  const [ready, setReady] = useState(false)
  const [consent, setConsent] = useState<'accepted' | 'declined' | null>(null)
  const [showChoice, setShowChoice] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(CONSENT_KEY)
    setConsent(saved === 'accepted' || saved === 'declined' ? saved : null)
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    const allowed = isPublic(pathname)
    if (!allowed || consent !== 'accepted') {
      stopAnalytics()
      // A client-side route transition retains loaded scripts. A full reload
      // gives signed-in screens a fresh browsing context with no Google tag.
      if (!allowed && tagLoaded) location.reload()
      return
    }

    const w = window as AnalyticsWindow
    ;(w as unknown as Record<string, unknown>)[`ga-disable-${ID}`] = false
    w.dataLayer = w.dataLayer || []
    w.gtag = w.gtag || function () { w.dataLayer!.push(arguments) }
    if (!tagLoaded) {
      tagLoaded = true
      w.gtag('js', new Date())
      w.gtag('config', ID, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        page_location: location.origin + pathname,
        page_referrer: '',
      })
      const script = document.createElement('script')
      script.id = 'pairlog-public-ga'
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${ID}`
      document.head.appendChild(script)
    }
    w.gtag('event', 'page_view', {
      send_to: ID,
      page_location: location.origin + pathname,
      page_referrer: '',
      page_title: document.title,
    })

    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return
      const anchor = event.target.closest('a[href]')
      if (!(anchor instanceof HTMLAnchorElement)) return
      const target = new URL(anchor.href)
      if (target.hostname === 'apps.apple.com' && /\/id6760982290(?:\/|$)/.test(target.pathname)) {
        w.gtag?.('event', 'app_store_click', {
          send_to: ID,
          destination: 'ios_app_store',
          page_location: location.origin + pathname,
        })
      }
      if (target.origin === location.origin && !PUBLIC_PATH.test(target.pathname)) stopAnalytics()
    }
    document.addEventListener('click', onClick, { capture: true, passive: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [consent, pathname, ready])

  useEffect(() => {
    const open = () => setShowChoice(true)
    window.addEventListener('pairlog-analytics-settings', open)
    return () => window.removeEventListener('pairlog-analytics-settings', open)
  }, [])

  if (!ready || !isPublic(pathname) || (consent !== null && !showChoice)) return null

  const choose = (value: 'accepted' | 'declined') => {
    localStorage.setItem(CONSENT_KEY, value)
    setConsent(value)
    setShowChoice(false)
    if (value === 'declined' && tagLoaded) {
      stopAnalytics()
      location.reload()
    }
  }
  const english = pathname.startsWith('/en')

  return (
    <aside aria-label={english ? 'Site analytics settings' : 'サイト計測の設定'} className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-lg rounded-2xl border border-[#e7cfda] bg-white p-4 text-[#2f2330] shadow-xl">
      <p className="text-sm font-bold">{english ? 'Allow analytics on public pages?' : '公開ページの利用状況を計測しますか？'}</p>
      <p className="mt-1 text-xs leading-5 text-[#62515d]">{english ? 'With your consent, Google Analytics measures public page views and App Store visits. Signed-in screens and shared records are excluded.' : '同意するとGoogle Analyticsで公開ページの閲覧とApp Storeへの移動を計測します。二人の記録やログイン後の画面は計測しません。'}</p>
      <a href="/privacy" className="mt-1 inline-block text-xs underline">{english ? 'Privacy policy and settings' : 'プライバシーポリシーと設定'}</a>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={() => choose('declined')} className="rounded-full border border-[#d8c6ce] px-4 py-2 text-xs font-semibold">{english ? 'Decline' : '同意しない'}</button>
        <button type="button" onClick={() => choose('accepted')} className="rounded-full bg-[#d45b8b] px-4 py-2 text-xs font-semibold text-white">{english ? 'Allow' : '同意する'}</button>
      </div>
    </aside>
  )
}

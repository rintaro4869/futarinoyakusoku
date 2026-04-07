import Image from 'next/image'
import Link from 'next/link'

import { APP_STORE, MARKETING_SCREENSHOTS, getDownloadCopy, getStoreHref, getStoreMeta, type LandingLocale } from '@/lib/marketing'

export function DownloadStatusPage({ locale }: { locale: LandingLocale }) {
  const copy = getDownloadCopy(locale)
  const store = getStoreMeta(locale)
  const storeHref = getStoreHref(locale)
  const isJapanese = locale === 'ja'

  return (
    <main lang={isJapanese ? 'ja-JP' : 'en-US'} className="min-h-screen bg-[#fff7f4] px-4 py-4 text-[#241b25]">
      <div className="mx-auto space-y-5">
        <div className="flex items-center justify-between rounded-full border border-white/80 bg-white/80 px-4 py-2 shadow-[0_12px_30px_rgba(219,39,119,0.08)]">
          <Link href={isJapanese ? '/' : '/en'} className="text-xs font-semibold text-rose-500">
            {isJapanese ? '← ランディングへ戻る' : '← Back to landing page'}
          </Link>
          <Link href={isJapanese ? '/en/download' : '/download'} className="text-xs font-semibold text-[#7d6975]">
            {isJapanese ? 'English' : '日本語'}
          </Link>
        </div>

        <section className="overflow-hidden rounded-[32px] border border-white/80 bg-white/80 px-5 py-6 shadow-[0_24px_80px_rgba(219,39,119,0.14)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-400">App Store</p>
          <h1 className="marketing-display mt-3 text-[2.15rem] leading-[1] tracking-[-0.04em] text-[#261925]">
            {copy.title}
          </h1>
          <p className="mt-4 text-sm leading-6 text-[#665668]">{copy.description}</p>

          <div className="mt-5 rounded-[28px] bg-[#241824] px-4 py-4 text-white shadow-[0_20px_54px_rgba(36,24,36,0.24)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-200">{store.badge}</p>
            <p className="mt-2 text-lg font-semibold">{copy.statusTitle}</p>
            <p className="mt-2 text-sm leading-6 text-rose-50/80">{copy.statusBody}</p>
            <ul className="mt-4 space-y-2">
              {copy.points.map((point) => (
                <li key={point} className="text-sm leading-6 text-white/90">
                  • {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 overflow-hidden rounded-[28px] border border-[#f2dfe6] bg-[#fff8fa]">
            <Image
              src={MARKETING_SCREENSHOTS[0]}
              alt="Pairlog screenshot"
              width={1290}
              height={2796}
              className="h-[360px] w-full object-cover object-top"
              priority
            />
          </div>

          <div className="mt-5 space-y-3">
            {APP_STORE.status === 'live' ? (
              <a
                href={storeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-[28px] bg-[#8d2051] px-4 py-4 text-center text-sm font-semibold text-white shadow-[0_16px_32px_rgba(157,23,77,0.22)]"
              >
                {store.button}
              </a>
            ) : (
              <div className="rounded-[28px] border border-[#eed7df] bg-white px-4 py-4 text-sm font-semibold text-[#8d2051] shadow-[0_16px_32px_rgba(157,23,77,0.12)]">
                {store.button}
              </div>
            )}
            <p className="text-xs leading-5 text-[#7d6975]">{copy.footerNote}</p>
          </div>
        </section>
      </div>
    </main>
  )
}

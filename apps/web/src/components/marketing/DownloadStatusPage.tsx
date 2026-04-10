import Image from 'next/image'
import Link from 'next/link'

import { APP_STORE, MARKETING_SCREENSHOTS, getDownloadCopy, getStoreHref, getStoreMeta, type LandingLocale } from '@/lib/marketing'

export function DownloadStatusPage({ locale }: { locale: LandingLocale }) {
  const copy = getDownloadCopy(locale)
  const store = getStoreMeta(locale)
  const storeHref = getStoreHref(locale)
  const isJapanese = locale === 'ja'

  return (
    <main lang={isJapanese ? 'ja-JP' : 'en-US'} className="marketing-page min-h-screen px-4 py-5 text-[#2f2329]">
      <div className="mx-auto max-w-[980px]">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Link
            href={isJapanese ? '/' : '/en'}
            className="marketing-button-pop rounded-full border border-[#e8deda] bg-white px-4 py-2 text-xs font-semibold text-[#5c4e57]"
          >
            {isJapanese ? '← ランディングへ戻る' : '← Back to landing page'}
          </Link>
          <Link
            href={isJapanese ? '/en/download' : '/download'}
            className="marketing-button-pop rounded-full border border-[#e8deda] bg-white px-4 py-2 text-xs font-semibold text-[#5c4e57]"
          >
            {isJapanese ? 'English' : '日本語'}
          </Link>
        </div>

        <section className="rounded-[36px] border border-[#ece2e5] bg-[#fffdfc] px-5 py-6 shadow-[0_18px_48px_rgba(56,35,48,0.06)] sm:px-6 lg:px-8 lg:py-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b66c7c]">App Store</p>
              <h1 className="marketing-display mt-3 text-[2.2rem] leading-[1.02] tracking-[-0.05em] text-[#261925] sm:text-[2.8rem]">
                {copy.title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[#675862] sm:text-base">{copy.description}</p>

              <div className="mt-6 rounded-[28px] border border-[#ece2e5] bg-[#faf7f8] px-5 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c06b59]">{store.badge}</p>
                <p className="mt-2 text-lg font-semibold text-[#342533]">{copy.statusTitle}</p>
                <p className="mt-2 text-sm leading-6 text-[#675862]">{copy.statusBody}</p>
                <ul className="mt-3 space-y-2">
                  {copy.points.map((point) => (
                    <li key={point} className="text-sm leading-6 text-[#5f5059]">
                      • {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 space-y-3">
                {APP_STORE.status === 'live' ? (
                  <a
                    href={storeHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="marketing-button-pop block rounded-[28px] border border-transparent bg-[linear-gradient(135deg,#c86861_0%,#e08b66_100%)] px-4 py-4 text-center text-sm font-semibold text-white shadow-[0_18px_34px_rgba(140,92,72,0.14)]"
                  >
                    {store.button}
                  </a>
                ) : (
                  <div className="rounded-[28px] border border-[#ecd4cb] bg-white px-4 py-4 text-center text-sm font-semibold text-[#7b5247] shadow-[0_18px_34px_rgba(140,92,72,0.1)]">
                    {store.button}
                  </div>
                )}
                <p className="text-xs leading-5 text-[#7a6b75]">{copy.footerNote}</p>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[360px]">
              <div className="marketing-card rounded-[34px] p-4">
                <div className="overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_14px_28px_rgba(112,78,59,0.08)]">
                  <Image
                    src={MARKETING_SCREENSHOTS[0]}
                    alt="Pairlog screenshot"
                    width={1290}
                    height={2796}
                    className="h-auto w-full object-contain"
                    priority
                  />
                </div>
                <div className="mt-4 rounded-[24px] border border-[#efe5e7] bg-[#faf7f8] px-4 py-4 text-sm leading-6 text-[#6f606b]">
                  {APP_STORE.status === 'live'
                    ? isJapanese
                      ? 'このまま App Store の配布ページへ移動できます。'
                      : 'This page links directly to the App Store listing.'
                    : isJapanese
                      ? '承認後はこのまま App Store へつながります。'
                      : 'After approval, this path can point to the App Store listing.'}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

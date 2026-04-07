import Image from 'next/image'
import Link from 'next/link'

import { APP_STORE, MARKETING_SCREENSHOTS, getDownloadCopy, getStoreHref, getStoreMeta, type LandingLocale } from '@/lib/marketing'

export function DownloadStatusPage({ locale }: { locale: LandingLocale }) {
  const copy = getDownloadCopy(locale)
  const store = getStoreMeta(locale)
  const storeHref = getStoreHref(locale)
  const isJapanese = locale === 'ja'

  return (
    <main lang={isJapanese ? 'ja-JP' : 'en-US'} className="marketing-page min-h-screen bg-transparent px-4 py-5 text-[#342421]">
      <div className="mx-auto max-w-[980px]">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Link
            href={isJapanese ? '/' : '/en'}
            className="marketing-button-pop rounded-full border border-[#ead7c7] bg-white/82 px-4 py-2 text-xs font-semibold text-[#6d5148]"
          >
            {isJapanese ? '← ランディングへ戻る' : '← Back to landing page'}
          </Link>
          <Link
            href={isJapanese ? '/en/download' : '/download'}
            className="marketing-button-pop rounded-full border border-[#ead7c7] bg-white/82 px-4 py-2 text-xs font-semibold text-[#6d5148]"
          >
            {isJapanese ? 'English' : '日本語'}
          </Link>
        </div>

        <section className="marketing-surface overflow-hidden rounded-[36px] bg-[linear-gradient(160deg,#fff9f3_0%,#fff2e8_44%,#fde6da_100%)] px-5 py-6 shadow-[0_24px_80px_rgba(151,102,77,0.14)] sm:px-6 lg:px-8 lg:py-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c07a60]">App Store</p>
              <h1 className="marketing-display mt-3 text-[2.2rem] leading-[1.02] tracking-[-0.05em] text-[#38251f] sm:text-[2.8rem]">
                {copy.title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6d554b] sm:text-base">{copy.description}</p>

              <div className="mt-6 rounded-[30px] border border-[#ebd6c8] bg-white/74 px-5 py-5 shadow-[0_14px_28px_rgba(148,104,81,0.08)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b45d46]">{store.badge}</p>
                <p className="mt-2 text-lg font-semibold text-[#4b3028]">{copy.statusTitle}</p>
                <p className="mt-2 text-sm leading-6 text-[#6d554b]">{copy.statusBody}</p>
                <ul className="mt-4 space-y-2">
                  {copy.points.map((point) => (
                    <li key={point} className="text-sm leading-6 text-[#5f4a42]">
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
                    className="marketing-button-pop block rounded-[30px] border border-transparent bg-[linear-gradient(135deg,#cb5f5d_0%,#e78559_100%)] px-4 py-4 text-center text-sm font-semibold text-white shadow-[0_18px_34px_rgba(140,92,72,0.18)]"
                  >
                    {store.button}
                  </a>
                ) : (
                  <div className="rounded-[30px] border border-[#efc9ba] bg-white/92 px-4 py-4 text-center text-sm font-semibold text-[#8d4b3f] shadow-[0_18px_34px_rgba(140,92,72,0.12)]">
                    {store.button}
                  </div>
                )}
                <p className="text-xs leading-5 text-[#7a6056]">{copy.footerNote}</p>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[360px]">
              <div className="absolute -left-4 top-14 hidden w-28 overflow-hidden rounded-[22px] border border-white/90 bg-white shadow-[0_16px_30px_rgba(112,78,59,0.12)] sm:block">
                <Image
                  src={MARKETING_SCREENSHOTS[1]}
                  alt="Pairlog screenshot detail"
                  width={260}
                  height={560}
                  className="h-[168px] w-full object-cover object-top"
                />
              </div>
              <div className="rounded-[34px] border border-[#ead7c7] bg-white/74 p-4 shadow-[0_18px_40px_rgba(148,104,81,0.12)]">
                <div className="overflow-hidden rounded-[28px] border border-white/90 bg-white shadow-[0_14px_28px_rgba(112,78,59,0.1)]">
                  <Image
                    src={MARKETING_SCREENSHOTS[0]}
                    alt="Pairlog screenshot"
                    width={1290}
                    height={2796}
                    className="h-[430px] w-full object-cover object-top"
                    priority
                  />
                </div>
                <div className="mt-4 rounded-[24px] border border-[#efddd2] bg-[#fff8f1] px-4 py-4 text-sm leading-6 text-[#6f564c]">
                  {isJapanese
                    ? '審査が通るまでは状態だけを正確に見せ、承認後は同じ導線からそのまま App Store に接続します。'
                    : 'Until approval lands, this page keeps the status accurate. After approval, the same path can point directly to the App Store listing.'}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

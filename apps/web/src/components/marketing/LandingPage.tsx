import Image from 'next/image'
import Link from 'next/link'

import {
  APP_STORE,
  MARKETING_SCREENSHOTS,
  getLandingCopy,
  getStoreHref,
  getStoreMeta,
  type LandingLocale,
} from '@/lib/marketing'

const toneStyles = {
  rose: 'from-rose-50 to-white border-rose-100',
  orange: 'from-orange-50 to-white border-orange-100',
  sky: 'from-sky-50 to-white border-sky-100',
  cream: 'from-amber-50 to-white border-amber-100',
} as const

export function LandingPage({ locale }: { locale: LandingLocale }) {
  const copy = getLandingCopy(locale)
  const store = getStoreMeta(locale)
  const storeHref = getStoreHref(locale)

  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Pairlog',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'iOS',
    isAccessibleForFree: true,
    inLanguage: locale === 'ja' ? 'ja-JP' : 'en-US',
    description: copy.description,
    url: copy.path === '/' ? 'https://pairlog.pages.dev' : `https://pairlog.pages.dev${copy.path}`,
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: copy.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <main lang={locale === 'ja' ? 'ja-JP' : 'en-US'} className="relative min-h-screen overflow-hidden bg-[#fff7f4] text-[#241b25]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top_left,_rgba(253,164,175,0.28),_transparent_44%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.18),_transparent_34%),linear-gradient(180deg,_#fff1f2_0%,_rgba(255,247,244,0)_100%)]" />
        <div className="pointer-events-none absolute -left-12 top-28 h-32 w-32 rounded-full bg-rose-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-12 top-48 h-40 w-40 rounded-full bg-orange-200/40 blur-3xl" />

        <section className="relative px-4 pb-8 pt-4">
          <div className="mb-5 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-500 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              {copy.navLabel}
            </div>
            <Link
              href={copy.languageSwitchHref}
              className="rounded-full border border-rose-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-rose-500 backdrop-blur transition hover:border-rose-300"
            >
              {copy.languageSwitchLabel}
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-[32px] border border-white/80 bg-white/72 px-5 pb-5 pt-6 shadow-[0_24px_80px_rgba(219,39,119,0.14)] backdrop-blur">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,_rgba(255,255,255,0.86)_0%,_rgba(255,255,255,0)_100%)]" />
            <div className="relative">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-semibold text-rose-600">
                  {copy.hero.eyebrow}
                </span>
                <span className="rounded-full border border-rose-200 bg-white px-3 py-1 text-[11px] font-semibold text-rose-500">
                  {copy.hero.status}
                </span>
              </div>

              <h1 className="marketing-display max-w-[11ch] text-[2.45rem] font-semibold leading-[0.92] tracking-[-0.05em] text-[#261925]">
                {copy.hero.title}
              </h1>
              <p className="mt-4 text-base leading-7 text-[#5f5160]">{copy.hero.lead}</p>
              <p className="mt-3 text-sm leading-6 text-[#766676]">{copy.hero.body}</p>

              <div className="mt-6 space-y-3">
                <StoreButton href={storeHref} badge={store.badge} label={store.button} note={store.note} />
                <Link
                  href={copy.hero.secondaryHref}
                  className="inline-flex items-center gap-2 rounded-full border border-[#ead6df] bg-white px-4 py-3 text-sm font-semibold text-[#4f4051] transition hover:border-[#d8b7c7]"
                >
                  {copy.hero.secondaryCta}
                  <span aria-hidden="true">↓</span>
                </Link>
              </div>

              <p className="mt-4 text-xs leading-5 text-[#826f7b]">{copy.hero.availabilityNote}</p>
            </div>

            <div className="relative mt-7 h-[430px] overflow-hidden rounded-[28px] border border-[#f4dde6] bg-[linear-gradient(180deg,_#fffaf8_0%,_#fff4f1_100%)] p-3 shadow-inner">
              <div className="absolute left-5 top-6 h-20 w-20 rounded-full bg-rose-100/70 blur-2xl" />
              <div className="absolute bottom-10 right-6 h-24 w-24 rounded-full bg-orange-100/80 blur-2xl" />

              <div className="absolute right-2 top-6 w-24 rotate-[9deg] overflow-hidden rounded-[22px] border border-white/90 bg-white shadow-[0_18px_36px_rgba(36,27,37,0.12)]">
                <Image
                  src={MARKETING_SCREENSHOTS[1]}
                  alt="Pairlog app preview"
                  width={260}
                  height={560}
                  className="h-[180px] w-full object-cover object-top"
                />
              </div>

              <div className="absolute -left-1 bottom-10 w-24 -rotate-[10deg] overflow-hidden rounded-[22px] border border-white/90 bg-white shadow-[0_18px_36px_rgba(36,27,37,0.12)]">
                <Image
                  src={MARKETING_SCREENSHOTS[2]}
                  alt="Pairlog app preview"
                  width={260}
                  height={560}
                  className="h-[180px] w-full object-cover object-top"
                />
              </div>

              <div className="relative mx-auto h-full w-[220px] overflow-hidden rounded-[34px] border border-[#e9dde2] bg-white p-2 shadow-[0_28px_58px_rgba(36,27,37,0.16)]">
                <div className="mb-2 flex justify-center">
                  <div className="h-1.5 w-16 rounded-full bg-[#ece0e5]" />
                </div>
                <div className="relative h-[372px] overflow-hidden rounded-[26px] bg-[#fff5f7]">
                  <Image
                    src={MARKETING_SCREENSHOTS[0]}
                    alt="Pairlog hero screen"
                    fill
                    priority
                    sizes="220px"
                    className="object-cover object-top"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {copy.hero.stats.map((stat) => (
                <div key={stat.label} className="rounded-[22px] border border-white/80 bg-white/80 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#aa8f9f]">{stat.label}</p>
                  <p className="mt-1 text-sm font-semibold text-[#372a38]">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative px-4 pb-6">
          <div className="rounded-[30px] border border-[#f2dfe6] bg-white px-5 py-6 shadow-[0_14px_44px_rgba(219,39,119,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-400">{copy.pain.eyebrow}</p>
            <h2 className="marketing-display mt-3 text-[2rem] leading-[1] tracking-[-0.04em] text-[#261925]">
              {copy.pain.title}
            </h2>
            <p className="mt-4 text-sm leading-6 text-[#665668]">{copy.pain.intro}</p>

            <div className="mt-5 space-y-3">
              {copy.pain.items.map((item) => (
                <div key={item} className="rounded-[22px] bg-[#fff7f8] px-4 py-4">
                  <p className="text-sm leading-6 text-[#5c4d5e]">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[24px] bg-[linear-gradient(135deg,_#fff1f4_0%,_#fff8ef_100%)] px-4 py-4">
              <p className="text-sm font-semibold leading-6 text-[#6a3553]">{copy.pain.note}</p>
            </div>
          </div>
        </section>

        <section className="relative px-4 pb-6">
          <div className="overflow-hidden rounded-[30px] bg-[#241824] px-5 py-6 text-white shadow-[0_20px_54px_rgba(36,24,36,0.24)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-200">{copy.flow.eyebrow}</p>
            <h2 className="marketing-display mt-3 text-[1.95rem] leading-[1] tracking-[-0.04em] text-white">
              {copy.flow.title}
            </h2>
            <div className="mt-5 space-y-4">
              {copy.flow.steps.map((step) => (
                <div key={step.number} className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-rose-100">
                      {step.number}
                    </div>
                    <p className="text-base font-semibold text-white">{step.title}</p>
                  </div>
                  <p className="text-sm leading-6 text-rose-50/80">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="showcase" className="relative scroll-mt-6 px-4 pb-6">
          <div className="mb-4 px-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-400">{copy.showcase.eyebrow}</p>
            <h2 className="marketing-display mt-3 text-[2rem] leading-[1] tracking-[-0.04em] text-[#261925]">
              {copy.showcase.title}
            </h2>
            <p className="mt-4 text-sm leading-6 text-[#665668]">{copy.showcase.description}</p>
          </div>

          <div className="space-y-4">
            {copy.showcase.items.map((item) => (
              <article
                key={item.title}
                className={`overflow-hidden rounded-[30px] border bg-gradient-to-br ${toneStyles[item.tone]} shadow-[0_14px_44px_rgba(219,39,119,0.08)]`}
              >
                <div className="px-5 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b87490]">{item.eyebrow}</p>
                  <h3 className="marketing-display mt-3 text-[1.65rem] leading-[1.02] tracking-[-0.04em] text-[#2b1f2c]">
                    {item.title}
                  </h3>
                  <p className="mt-3 pb-5 text-sm leading-6 text-[#5f4e60]">{item.description}</p>
                </div>
                <div className="relative mx-4 mb-4 overflow-hidden rounded-[26px] border border-white/90 bg-white shadow-[0_18px_36px_rgba(36,27,37,0.1)]">
                  <Image
                    src={item.screenshot}
                    alt={`${item.title} preview`}
                    width={1290}
                    height={2796}
                    sizes="(max-width: 768px) 100vw, 430px"
                    className="h-[320px] w-full object-cover object-top"
                  />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="relative px-4 pb-6">
          <div className="rounded-[30px] border border-[#f2dfe6] bg-white px-5 py-6 shadow-[0_14px_44px_rgba(219,39,119,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-400">{copy.safety.eyebrow}</p>
            <h2 className="marketing-display mt-3 text-[2rem] leading-[1] tracking-[-0.04em] text-[#261925]">
              {copy.safety.title}
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {copy.safety.items.map((item) => (
                <div key={item.title} className="rounded-[22px] bg-[#fff7f8] px-4 py-4">
                  <p className="text-sm font-semibold text-[#332534]">{item.title}</p>
                  <p className="mt-2 text-xs leading-5 text-[#766676]">{item.description}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-[#8a7684]">{copy.safety.note}</p>
          </div>
        </section>

        <section className="relative px-4 pb-6">
          <div className="rounded-[30px] border border-[#f2dfe6] bg-white px-5 py-6 shadow-[0_14px_44px_rgba(219,39,119,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-400">FAQ</p>
            <h2 className="marketing-display mt-3 text-[2rem] leading-[1] tracking-[-0.04em] text-[#261925]">
              {copy.faqTitle}
            </h2>
            <div className="marketing-faq mt-5 space-y-3">
              {copy.faqs.map((faq) => (
                <details key={faq.question} className="group rounded-[22px] border border-[#f3e4ea] bg-[#fffafa] px-4 py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4">
                    <span className="text-sm font-semibold text-[#382a39]">{faq.question}</span>
                    <span className="text-lg font-semibold text-rose-400 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="border-t border-[#f3e4ea] pb-4 pt-4 text-sm leading-6 text-[#6d5d6e]">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="relative px-4 pb-7">
          <div className="overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,_#9d174d_0%,_#ec4899_42%,_#fb923c_100%)] px-5 py-6 text-white shadow-[0_22px_60px_rgba(157,23,77,0.28)]">
            <div className="pointer-events-none absolute right-[-10px] top-6 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-100">App Store</p>
            <h2 className="marketing-display mt-3 text-[2rem] leading-[1] tracking-[-0.04em] text-white">
              {copy.finalCta.title}
            </h2>
            <p className="mt-4 text-sm leading-6 text-white/80">{copy.finalCta.description}</p>
            <div className="mt-5">
              <StoreButton href={storeHref} badge={store.badge} label={store.button} note={copy.finalCta.note} invert />
            </div>
          </div>
        </section>

        <footer className="px-4 pb-10 text-center">
          <div className="rounded-[26px] border border-white/80 bg-white/80 px-4 py-5 shadow-[0_10px_30px_rgba(219,39,119,0.06)]">
            <Link href={copy.languageSwitchHref} className="text-xs font-semibold text-[#816d79] underline underline-offset-4">
              {copy.languageSwitchLabel}
            </Link>
            <div className="mt-3">
              <Link href="/privacy" className="text-xs text-[#816d79] underline underline-offset-4">
                {copy.footerPrivacy}
              </Link>
            </div>
            <p className="mt-3 text-xs text-[#a18e99]">© 2026 Pairlog</p>
          </div>
        </footer>
      </main>
    </>
  )
}

function StoreButton({
  href,
  badge,
  label,
  note,
  invert = false,
}: {
  href: string
  badge: string
  label: string
  note: string
  invert?: boolean
}) {
  const baseClass = invert
    ? 'border-white/30 bg-white text-[#8d2051]'
    : 'border-[#eed7df] bg-white text-[#8d2051]'

  const noteClass = invert ? 'text-white/80' : 'text-[#7d6975]'

  if (APP_STORE.status === 'live') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`marketing-shine block rounded-[28px] border px-4 py-4 shadow-[0_16px_32px_rgba(157,23,77,0.14)] ${baseClass}`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d94f8c]">{badge}</p>
            <p className="mt-1 text-base font-semibold leading-6">{label}</p>
          </div>
          <AppleIcon />
        </div>
        <p className={`mt-2 text-xs leading-5 ${noteClass}`}>{note}</p>
      </a>
    )
  }

  return (
    <Link
      href={href}
      className={`block rounded-[28px] border px-4 py-4 shadow-[0_16px_32px_rgba(157,23,77,0.14)] ${baseClass}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d94f8c]">{badge}</p>
          <p className="mt-1 text-base font-semibold leading-6">{label}</p>
        </div>
        <AppleIcon />
      </div>
      <p className={`mt-2 text-xs leading-5 ${noteClass}`}>{note}</p>
    </Link>
  )
}

function AppleIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-current">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  )
}

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
  rose: {
    surface: 'border-[#f0d9d0] bg-[#fff2ec]',
    badge: 'bg-[#ffe1d6] text-[#b75d4d]',
  },
  orange: {
    surface: 'border-[#eddcc0] bg-[#fff5e7]',
    badge: 'bg-[#ffe7c4] text-[#aa6b1d]',
  },
  sky: {
    surface: 'border-[#eadfce] bg-[#fbf2e9]',
    badge: 'bg-[#f6e7d8] text-[#8f6045]',
  },
  cream: {
    surface: 'border-[#e8dfd4] bg-[#fff8ef]',
    badge: 'bg-[#f4eadf] text-[#7b5c43]',
  },
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

      <main lang={locale === 'ja' ? 'ja-JP' : 'en-US'} className="marketing-page min-h-screen bg-transparent text-[#342421]">
        <div className="mx-auto max-w-[1180px] px-4 pb-16 pt-5 sm:px-6 lg:px-8 lg:pb-24">
          <header className="mb-5 flex items-center justify-between gap-3">
            <div className="marketing-chip inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.24em]">
              <span className="h-2 w-2 rounded-full bg-[#df7f67]" />
              {copy.navLabel}
            </div>
            <Link
              href={copy.languageSwitchHref}
              className="marketing-button-pop rounded-full border border-[#ead7c7] bg-white/80 px-4 py-2 text-xs font-semibold text-[#6d5148]"
            >
              {copy.languageSwitchLabel}
            </Link>
          </header>

          <section className="marketing-surface relative overflow-hidden rounded-[40px] bg-[linear-gradient(155deg,#fff9f3_0%,#fff3ea_45%,#fde6da_100%)] px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="absolute -left-10 top-12 h-44 w-44 rounded-full bg-[radial-gradient(circle,_rgba(255,213,190,0.92)_0%,_rgba(255,213,190,0)_70%)]" />
            <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-[radial-gradient(circle,_rgba(245,181,154,0.42)_0%,_rgba(245,181,154,0)_72%)]" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1.04fr)_minmax(320px,420px)] lg:items-center">
              <div className="max-w-2xl">
                <div className="flex flex-wrap gap-2">
                  <span className="marketing-chip rounded-full px-3 py-1 text-[11px] font-semibold">{copy.hero.eyebrow}</span>
                  <span className="rounded-full border border-[#efc8ba] bg-white/80 px-3 py-1 text-[11px] font-semibold text-[#b25a45]">
                    {copy.hero.status}
                  </span>
                </div>

                <h1 className="marketing-display mt-5 max-w-[12ch] text-[2.9rem] leading-[0.94] tracking-[-0.055em] text-[#38251f] sm:text-[3.7rem] lg:max-w-none lg:text-[4.8rem]">
                  {copy.hero.title}
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-[#6a5147] sm:text-lg">{copy.hero.lead}</p>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[#81675d] sm:text-base">{copy.hero.body}</p>

                <div className="mt-8 flex max-w-xl flex-col gap-3">
                  <StoreButton href={storeHref} badge={store.badge} label={store.button} note={store.note} tone="dark" />
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={copy.hero.secondaryHref}
                      className="marketing-button-pop inline-flex items-center gap-2 rounded-full border border-[#ead7c7] bg-white/82 px-4 py-3 text-sm font-semibold text-[#6d5148]"
                    >
                      {copy.hero.secondaryCta}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {copy.hero.stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-[24px] border border-[#edd8cb] bg-white/76 px-4 py-4 shadow-[0_12px_24px_rgba(148,104,81,0.08)]"
                    >
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[#af8f80]">{stat.label}</p>
                      <p className="mt-1 text-sm font-semibold text-[#402b24]">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-[24px] border border-[#ecd7ca] bg-white/70 px-4 py-4 text-sm leading-6 text-[#765c52]">
                  {copy.hero.availabilityNote}
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-[430px]">
                <div className="absolute right-4 top-0 z-20 rounded-full border border-[#f1d4c7] bg-[#fff4ec] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b45d46]">
                  App Store
                </div>
                <div className="marketing-surface rounded-[36px] bg-white/72 p-4 sm:p-5">
                  <div className="overflow-hidden rounded-[28px] border border-white/90 bg-white shadow-[0_18px_36px_rgba(112,78,59,0.12)]">
                    <Image
                      src={MARKETING_SCREENSHOTS[0]}
                      alt="Pairlog App Store preview"
                      width={1290}
                      height={2796}
                      priority
                      sizes="(max-width: 1024px) 72vw, 420px"
                      className="h-auto w-full object-contain"
                    />
                  </div>

                  <div className="mt-4 rounded-[24px] border border-[#efddd2] bg-white/82 px-4 py-4 text-sm leading-6 text-[#6f564c] shadow-[0_12px_24px_rgba(148,104,81,0.08)]">
                    {locale === 'ja'
                      ? '毎日開く場所を増やしすぎず、約束と感謝を同じ流れで記録できるように整えています。'
                      : 'The layout keeps promises, gratitude, and weekly review in one calm flow instead of spreading them across a busy dashboard.'}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="marketing-surface rounded-[34px] bg-[#fff9f2]/88 px-5 py-6 sm:px-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c07a60]">{copy.pain.eyebrow}</p>
              <h2 className="marketing-display mt-3 text-[2rem] leading-[1.02] tracking-[-0.05em] text-[#38251f] sm:text-[2.5rem]">
                {copy.pain.title}
              </h2>
              <p className="mt-4 text-sm leading-6 text-[#6d554b] sm:text-base">{copy.pain.intro}</p>

              <div className="mt-6 rounded-[28px] border border-[#efddd0] bg-[#fff2e8] px-5 py-5">
                <p className="text-sm font-semibold leading-6 text-[#8c533f]">{copy.pain.note}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {copy.pain.items.map((item) => (
                <article key={item} className="marketing-surface rounded-[28px] bg-white/80 px-5 py-5">
                  <div className="mb-4 h-9 w-9 rounded-full bg-[#fff1e5] text-center text-xl leading-9 text-[#d0704f]">•</div>
                  <p className="text-sm leading-6 text-[#5d473f]">{item}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="showcase" className="marketing-surface mt-8 rounded-[36px] bg-[#fffaf5]/88 px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c07a60]">{copy.showcase.eyebrow}</p>
              <h2 className="marketing-display mt-3 text-[2rem] leading-[1.02] tracking-[-0.05em] text-[#38251f] sm:text-[2.5rem]">
                {copy.showcase.title}
              </h2>
              <p className="mt-4 text-sm leading-6 text-[#6d554b] sm:text-base">{copy.showcase.description}</p>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              {copy.showcase.items.map((item) => {
                const tone = toneStyles[item.tone]

                return (
                  <article key={item.title} className={`overflow-hidden rounded-[30px] border p-4 sm:p-5 ${tone.surface}`}>
                    <div className="overflow-hidden rounded-[26px] border border-white/90 bg-white shadow-[0_16px_30px_rgba(112,78,59,0.1)]">
                      <Image
                        src={item.screenshot}
                        alt={`${item.title} preview`}
                        width={1290}
                        height={2796}
                        sizes="(max-width: 768px) 100vw, 520px"
                        className="h-[310px] w-full object-cover object-top sm:h-[380px]"
                      />
                    </div>
                    <div className="mt-5">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${tone.badge}`}>
                        {item.eyebrow}
                      </span>
                      <h3 className="marketing-display mt-3 text-[1.8rem] leading-[1.04] tracking-[-0.045em] text-[#35241f]">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-[#624d45]">{item.description}</p>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.96fr)]">
            <div className="overflow-hidden rounded-[34px] border border-[#c99682]/35 bg-[linear-gradient(160deg,#7a4a43_0%,#a7644f_60%,#d18258_100%)] px-5 py-6 text-white shadow-[0_24px_60px_rgba(122,74,67,0.28)] sm:px-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ffe4d5]">{copy.flow.eyebrow}</p>
              <h2 className="marketing-display mt-3 text-[2rem] leading-[1.02] tracking-[-0.05em] text-white sm:text-[2.4rem]">
                {copy.flow.title}
              </h2>

              <div className="mt-6 space-y-3">
                {copy.flow.steps.map((step) => (
                  <div key={step.number} className="rounded-[26px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/14 text-sm font-semibold text-white">
                        {step.number}
                      </div>
                      <p className="text-base font-semibold text-white">{step.title}</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-white/82">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="marketing-surface rounded-[34px] bg-[#fffaf5]/88 px-5 py-6 sm:px-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c07a60]">{copy.safety.eyebrow}</p>
              <h2 className="marketing-display mt-3 text-[2rem] leading-[1.02] tracking-[-0.05em] text-[#38251f] sm:text-[2.4rem]">
                {copy.safety.title}
              </h2>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {copy.safety.items.map((item) => (
                  <div key={item.title} className="rounded-[24px] border border-[#eedccf] bg-white/78 px-4 py-4">
                    <p className="text-sm font-semibold text-[#402b24]">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#735d53]">{item.description}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm leading-6 text-[#755f55]">{copy.safety.note}</p>
            </div>
          </section>

          <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_360px]">
            <div className="marketing-surface rounded-[34px] bg-[#fffaf6]/88 px-5 py-6 sm:px-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c07a60]">FAQ</p>
              <h2 className="marketing-display mt-3 text-[2rem] leading-[1.02] tracking-[-0.05em] text-[#38251f] sm:text-[2.4rem]">
                {copy.faqTitle}
              </h2>
              <div className="marketing-faq mt-6 space-y-3">
                {copy.faqs.map((faq) => (
                  <details key={faq.question} className="group rounded-[24px] border border-[#efdfd5] bg-white/86 px-4 py-1">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4">
                      <span className="text-sm font-semibold text-[#3f2d28]">{faq.question}</span>
                      <span className="text-lg font-semibold text-[#d07655] transition group-open:rotate-45">+</span>
                    </summary>
                    <p className="border-t border-[#f1e3da] pb-4 pt-4 text-sm leading-6 text-[#6d5850]">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[34px] border border-[#efc8b5] bg-[linear-gradient(180deg,#fff2e5_0%,#ffd9c9_100%)] px-5 py-6 shadow-[0_24px_60px_rgba(185,104,79,0.18)] sm:px-6">
              <div className="absolute -right-10 top-8 h-36 w-36 rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.56)_0%,_rgba(255,255,255,0)_72%)]" />
              <p className="relative z-10 text-xs font-semibold uppercase tracking-[0.24em] text-[#b45d46]">App Store</p>
              <h2 className="marketing-display relative z-10 mt-3 text-[2rem] leading-[1.02] tracking-[-0.05em] text-[#5a2f27]">
                {copy.finalCta.title}
              </h2>
              {copy.finalCta.description ? (
                <p className="relative z-10 mt-4 text-sm leading-6 text-[#7d5148]">{copy.finalCta.description}</p>
              ) : null}

              <div className="relative z-10 mt-6">
                <StoreButton href={storeHref} badge={store.badge} label={store.button} note={store.note} tone="light" />
              </div>
              {copy.finalCta.note ? <p className="relative z-10 mt-4 text-sm leading-6 text-[#7d5148]">{copy.finalCta.note}</p> : null}
            </div>
          </section>

          <footer className="mt-8 border-t border-[#ead8cb] py-8">
            <div className="flex flex-col items-start justify-between gap-3 text-sm text-[#856d64] sm:flex-row sm:items-center">
              <div className="flex flex-wrap items-center gap-4">
                <Link href={copy.languageSwitchHref} className="font-semibold text-[#6d5148] underline underline-offset-4">
                  {copy.languageSwitchLabel}
                </Link>
                <Link href="/privacy" className="underline underline-offset-4">
                  {copy.footerPrivacy}
                </Link>
              </div>
              <p className="text-xs text-[#a28a7f]">© 2026 Pairlog</p>
            </div>
          </footer>
        </div>
      </main>
    </>
  )
}

function StoreButton({
  href,
  badge,
  label,
  note,
  tone = 'dark',
}: {
  href: string
  badge: string
  label: string
  note?: string
  tone?: 'dark' | 'light'
}) {
  const classes =
    tone === 'dark'
      ? {
          root: 'marketing-button-pop border-transparent bg-[linear-gradient(135deg,#cb5f5d_0%,#e78559_100%)] text-white',
          badge: 'text-[#fff1d7]',
          note: 'text-white/78',
        }
      : {
          root: 'marketing-button-pop border-[#efc9ba] bg-white/92 text-[#8d4b3f]',
          badge: 'text-[#cc7256]',
          note: 'text-[#7d6158]',
        }

  const content = (
    <>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${classes.badge}`}>{badge}</p>
          <p className="mt-1 text-base font-semibold leading-6">{label}</p>
        </div>
        <AppleIcon />
      </div>
      {note ? <p className={`mt-2 text-xs leading-5 ${classes.note}`}>{note}</p> : null}
    </>
  )

  if (APP_STORE.status === 'live') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`block rounded-[30px] border px-4 py-4 shadow-[0_18px_34px_rgba(140,92,72,0.16)] ${classes.root}`}
      >
        {content}
      </a>
    )
  }

  return (
    <Link
      href={href}
      className={`block rounded-[30px] border px-4 py-4 shadow-[0_18px_34px_rgba(140,92,72,0.14)] ${classes.root}`}
    >
      {content}
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

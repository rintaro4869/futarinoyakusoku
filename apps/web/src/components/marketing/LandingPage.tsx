import Image from 'next/image'
import Link from 'next/link'

import {
  APP_STORE,
  getLandingCopy,
  getStoreHref,
  getStoreMeta,
  type LandingLocale,
} from '@/lib/marketing'

const toneStyles = {
  rose: 'border-[#efe1e3] bg-[#fffaf9]',
  orange: 'border-[#efe6da] bg-[#fffaf4]',
  sky: 'border-[#e7e9ef] bg-[#fbfcff]',
  cream: 'border-[#ede4da] bg-[#fffaf6]',
} as const

const toneChipStyles = {
  rose: 'bg-[#f8ecee] text-[#9a6270]',
  orange: 'bg-[#fbefe1] text-[#a06b3f]',
  sky: 'bg-[#eef2f8] text-[#66728a]',
  cream: 'bg-[#f4eee7] text-[#7a6854]',
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

      <main lang={locale === 'ja' ? 'ja-JP' : 'en-US'} className="marketing-page min-h-screen text-[#2f2329]">
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-4 sm:px-6 lg:px-8 lg:pb-20">
          <header className="flex items-center justify-between py-3 sm:py-5">
            <div className="marketing-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em]">
              <span className="h-2 w-2 rounded-full bg-[#e0776b]" />
              {copy.navLabel}
            </div>
            <Link
              href={copy.languageSwitchHref}
              className="marketing-button-pop rounded-full border border-[#e8deda] bg-white px-3 py-2 text-xs font-semibold text-[#5c4e57]"
            >
              {copy.languageSwitchLabel}
            </Link>
          </header>

          <section className="grid gap-10 pb-14 pt-4 lg:grid-cols-[minmax(0,1.02fr)_minmax(360px,440px)] lg:items-center lg:gap-14 lg:pb-20 lg:pt-8">
            <div className="max-w-2xl">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#f8ecee] px-3 py-1 text-[11px] font-semibold text-[#a16073]">
                  {copy.hero.eyebrow}
                </span>
                <span className="rounded-full border border-[#edd4d7] bg-white px-3 py-1 text-[11px] font-semibold text-[#c06b59]">
                  {copy.hero.status}
                </span>
              </div>

              <h1 className="marketing-display mt-5 max-w-[11ch] text-[2.6rem] leading-[0.95] tracking-[-0.05em] text-[#261925] sm:text-[3.25rem] lg:max-w-none lg:text-[4.5rem]">
                {copy.hero.title}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#5d5059] sm:text-lg">{copy.hero.lead}</p>
              {copy.hero.body ? <p className="mt-3 max-w-xl text-sm leading-6 text-[#766773] sm:text-base">{copy.hero.body}</p> : null}

              <div className="mt-7 flex max-w-md flex-col gap-3">
                <StoreButton href={storeHref} badge={store.badge} label={store.button} note={store.note} tone="dark" />
                <Link
                  href={copy.hero.secondaryHref}
                  className="inline-flex items-center gap-2 self-start text-sm font-semibold text-[#5c4e57] underline decoration-[#d7c7cf] underline-offset-4"
                >
                  {copy.hero.secondaryCta}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {copy.hero.stats.map((stat) => (
                  <div key={stat.label} className="rounded-[22px] border border-[#ece2e5] bg-white px-4 py-3 shadow-sm">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#a58f9a]">{stat.label}</p>
                    <p className="mt-1 text-sm font-semibold text-[#322432]">{stat.value}</p>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-sm leading-6 text-[#776873]">{copy.hero.availabilityNote}</p>
            </div>

            <div className="mx-auto w-full max-w-[440px]">
              <div className="marketing-card rounded-[34px] p-4">
                <div className="overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_22px_44px_rgba(56,35,48,0.1)]">
                  <Image
                    src={copy.hero.screenshot}
                    alt={copy.hero.screenshotAlt}
                    width={1290}
                    height={2796}
                    priority
                    sizes="(max-width: 1024px) 72vw, 420px"
                    className="h-auto w-full object-contain"
                  />
                </div>
              </div>
            </div>
          </section>

          <section id="showcase" className="border-t border-[#eee4e5] py-12 lg:py-16">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b66c7c]">{copy.showcase.eyebrow}</p>
              <h2 className="marketing-display mt-3 text-[2rem] leading-[1] tracking-[-0.04em] text-[#261925] sm:text-[2.35rem]">
                {copy.showcase.title}
              </h2>
              <p className="mt-4 text-sm leading-6 text-[#675862] sm:text-base">{copy.showcase.description}</p>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              {copy.showcase.items.map((item) => (
                <article
                  key={item.title}
                  className={`rounded-[30px] border p-5 shadow-[0_14px_40px_rgba(56,35,48,0.06)] ${toneStyles[item.tone]}`}
                >
                  <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
                    <div className="overflow-hidden rounded-[24px] border border-white bg-white shadow-[0_14px_28px_rgba(36,27,37,0.08)]">
                      <Image
                        src={item.screenshot}
                        alt={`${item.title} preview`}
                        width={1290}
                        height={2796}
                        sizes="(max-width: 1024px) 100vw, 220px"
                        className="h-[300px] w-full object-cover object-top lg:h-[320px]"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a0727f]">{item.eyebrow}</p>
                      <h3 className="marketing-display mt-3 text-[1.75rem] leading-[1.04] tracking-[-0.04em] text-[#2c1f2c]">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-[#5f4f59]">{item.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.highlights.map((highlight) => (
                          <span
                            key={highlight}
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${toneChipStyles[item.tone]}`}
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-6 border-t border-[#eee4e5] py-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:py-16">
            <div className="rounded-[30px] border border-[#ece2e5] bg-white px-5 py-6 shadow-[0_14px_40px_rgba(56,35,48,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b66c7c]">{copy.safety.eyebrow}</p>
              <h2 className="marketing-display mt-3 text-[2rem] leading-[1] tracking-[-0.04em] text-[#261925]">
                {copy.safety.title}
              </h2>
              <div className="mt-6 space-y-3">
                {copy.safety.items.map((item) => (
                  <div key={item.title} className="rounded-[22px] bg-[#faf7f8] px-4 py-4">
                    <p className="text-sm font-semibold text-[#322432]">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#746672]">{item.description}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm leading-6 text-[#7b6c78]">{copy.safety.note}</p>
            </div>

            <div className="rounded-[30px] border border-[#ece2e5] bg-white px-5 py-6 shadow-[0_14px_40px_rgba(56,35,48,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b66c7c]">FAQ</p>
              <h2 className="marketing-display mt-3 text-[2rem] leading-[1] tracking-[-0.04em] text-[#261925]">
                {copy.faqTitle}
              </h2>
              <div className="marketing-faq mt-6 space-y-3">
                {copy.faqs.map((faq) => (
                  <details key={faq.question} className="group rounded-[22px] border border-[#f0e4e8] bg-[#fffdfd] px-4 py-1">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4">
                      <span className="text-sm font-semibold text-[#382a39]">{faq.question}</span>
                      <span className="text-lg font-semibold text-[#d7806a] transition group-open:rotate-45">+</span>
                    </summary>
                    <p className="border-t border-[#f1e6ea] pb-4 pt-4 text-sm leading-6 text-[#675862]">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          <section className="border-t border-[#eee4e5] py-12 lg:py-16">
            <div className="rounded-[30px] border border-[#ead8d3] bg-[linear-gradient(180deg,#fffaf6_0%,#fff2ea_100%)] px-5 py-6 shadow-[0_20px_54px_rgba(140,98,78,0.08)] sm:px-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c06b59]">App Store</p>
              <h2 className="marketing-display mt-3 text-[2rem] leading-[1] tracking-[-0.04em] text-[#3b2629] sm:text-[2.25rem]">
                {copy.finalCta.title}
              </h2>
              <div className="mt-5 max-w-md">
                <StoreButton href={storeHref} badge={store.badge} label={store.button} note={store.note} tone="light" />
              </div>
            </div>
          </section>

          <footer className="border-t border-[#eadfe2] py-8">
            <div className="flex flex-col items-start justify-between gap-3 text-sm text-[#7f7079] sm:flex-row sm:items-center">
              <div className="flex flex-wrap items-center gap-4">
                <Link href={copy.languageSwitchHref} className="font-semibold text-[#5c4e57] underline underline-offset-4">
                  {copy.languageSwitchLabel}
                </Link>
                <Link href="/privacy" className="underline underline-offset-4">
                  {copy.footerPrivacy}
                </Link>
              </div>
              <p className="text-xs text-[#a09099]">© 2026 Pairlog</p>
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
          root: 'border-transparent bg-[linear-gradient(135deg,#c86861_0%,#e08b66_100%)] text-white',
          badge: 'text-[#fff1e7]',
          note: 'text-white/78',
        }
      : {
          root: 'border-[#ecd4cb] bg-white text-[#7b5247]',
          badge: 'text-[#cb735b]',
          note: 'text-[#7a655d]',
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
        className={`marketing-button-pop block rounded-[28px] border px-4 py-4 shadow-[0_18px_34px_rgba(140,92,72,0.14)] ${classes.root}`}
      >
        {content}
      </a>
    )
  }

  return (
    <Link
      href={href}
      className={`marketing-button-pop block rounded-[28px] border px-4 py-4 shadow-[0_18px_34px_rgba(140,92,72,0.12)] ${classes.root}`}
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

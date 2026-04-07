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
  rose: 'border-rose-100 bg-[#fff8fb]',
  orange: 'border-orange-100 bg-[#fffaf4]',
  sky: 'border-sky-100 bg-[#f7fbff]',
  cream: 'border-amber-100 bg-[#fffaf2]',
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

      <main lang={locale === 'ja' ? 'ja-JP' : 'en-US'} className="min-h-screen bg-[#fcfaf7] text-[#261b24]">
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-4 sm:px-6 lg:px-8 lg:pb-20">
          <header className="flex items-center justify-between py-3 sm:py-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#eadfe2] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-500 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              {copy.navLabel}
            </div>
            <Link
              href={copy.languageSwitchHref}
              className="rounded-full border border-[#eadfe2] bg-white px-3 py-2 text-xs font-semibold text-[#5a4957] transition hover:border-[#d8c7cf] hover:text-[#261b24]"
            >
              {copy.languageSwitchLabel}
            </Link>
          </header>

          <section className="grid gap-10 pb-14 pt-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,440px)] lg:items-center lg:gap-14 lg:pb-20 lg:pt-8">
            <div className="max-w-2xl">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-semibold text-rose-600">
                  {copy.hero.eyebrow}
                </span>
                <span className="rounded-full border border-rose-200 bg-white px-3 py-1 text-[11px] font-semibold text-rose-500">
                  {copy.hero.status}
                </span>
              </div>

              <h1 className="marketing-display mt-5 max-w-[12ch] text-[2.6rem] leading-[0.95] tracking-[-0.05em] text-[#261925] sm:text-[3.25rem] lg:max-w-none lg:text-[4.5rem]">
                {copy.hero.title}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#5c4d5e] sm:text-lg">{copy.hero.lead}</p>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#7a6878] sm:text-base">{copy.hero.body}</p>

              <div className="mt-7 flex max-w-md flex-col gap-3">
                <StoreButton href={storeHref} badge={store.badge} label={store.button} note={store.note} tone="dark" />
                <Link
                  href={copy.hero.secondaryHref}
                  className="inline-flex items-center gap-2 self-start text-sm font-semibold text-[#5a4957] underline decoration-[#d8c7cf] underline-offset-4 transition hover:text-[#261b24]"
                >
                  {copy.hero.secondaryCta}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {copy.hero.stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-[#ece2e5] bg-white px-4 py-3 shadow-sm">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#aa95a1]">{stat.label}</p>
                    <p className="mt-1 text-sm font-semibold text-[#332534]">{stat.value}</p>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-sm leading-6 text-[#7a6878]">{copy.hero.availabilityNote}</p>
            </div>

            <div className="relative mx-auto w-full max-w-[440px]">
              <div className="absolute -left-2 top-16 hidden w-28 overflow-hidden rounded-[22px] border border-white bg-white shadow-[0_18px_36px_rgba(48,31,42,0.1)] sm:block lg:-left-8">
                <Image
                  src={MARKETING_SCREENSHOTS[1]}
                  alt="Pairlog gratitude screen"
                  width={260}
                  height={560}
                  className="h-[176px] w-full object-cover object-top"
                />
              </div>
              <div className="absolute -right-2 bottom-10 hidden w-32 overflow-hidden rounded-[24px] border border-white bg-white shadow-[0_18px_36px_rgba(48,31,42,0.1)] sm:block lg:-right-8">
                <Image
                  src={MARKETING_SCREENSHOTS[2]}
                  alt="Pairlog calendar screen"
                  width={260}
                  height={560}
                  className="h-[196px] w-full object-cover object-top"
                />
              </div>
              <div className="rounded-[34px] border border-[#e9dfe2] bg-white p-4 shadow-[0_24px_60px_rgba(56,35,48,0.12)]">
                <div className="mx-auto w-full max-w-[290px] rounded-[34px] bg-[#181319] p-3 shadow-[0_16px_32px_rgba(24,19,25,0.28)]">
                  <div className="mb-2 flex justify-center">
                    <div className="h-1.5 w-16 rounded-full bg-white/15" />
                  </div>
                  <div className="overflow-hidden rounded-[26px] bg-[#fff5f7]">
                    <Image
                      src={MARKETING_SCREENSHOTS[0]}
                      alt="Pairlog home screen"
                      width={1290}
                      height={2796}
                      priority
                      sizes="(max-width: 1024px) 70vw, 340px"
                      className="h-[460px] w-full object-cover object-top sm:h-[540px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-[#eee3e4] py-12 lg:py-16">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-400">{copy.pain.eyebrow}</p>
              <h2 className="marketing-display mt-3 text-[2rem] leading-[1] tracking-[-0.04em] text-[#261925] sm:text-[2.4rem]">
                {copy.pain.title}
              </h2>
              <p className="mt-4 text-sm leading-6 text-[#665668] sm:text-base">{copy.pain.intro}</p>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {copy.pain.items.map((item) => (
                <div key={item} className="rounded-[26px] border border-[#ece2e5] bg-white px-5 py-5 shadow-sm">
                  <p className="text-sm leading-6 text-[#5c4d5e]">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[26px] border border-[#f1e2e6] bg-[#fff7f8] px-5 py-4">
              <p className="text-sm font-semibold leading-6 text-[#6a3553]">{copy.pain.note}</p>
            </div>
          </section>

          <section id="showcase" className="border-t border-[#eee3e4] py-12 lg:py-16">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-400">{copy.showcase.eyebrow}</p>
              <h2 className="marketing-display mt-3 text-[2rem] leading-[1] tracking-[-0.04em] text-[#261925] sm:text-[2.4rem]">
                {copy.showcase.title}
              </h2>
              <p className="mt-4 text-sm leading-6 text-[#665668] sm:text-base">{copy.showcase.description}</p>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              {copy.showcase.items.map((item) => (
                <article
                  key={item.title}
                  className={`rounded-[30px] border p-5 shadow-[0_14px_40px_rgba(56,35,48,0.07)] ${toneStyles[item.tone]}`}
                >
                  <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b87490]">{item.eyebrow}</p>
                      <h3 className="marketing-display mt-3 text-[1.7rem] leading-[1.04] tracking-[-0.04em] text-[#2b1f2c]">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-[#5f4e60]">{item.description}</p>
                    </div>
                    <div className="overflow-hidden rounded-[24px] border border-white/90 bg-white shadow-[0_14px_28px_rgba(36,27,37,0.08)]">
                      <Image
                        src={item.screenshot}
                        alt={`${item.title} preview`}
                        width={1290}
                        height={2796}
                        sizes="(max-width: 768px) 100vw, 220px"
                        className="h-[280px] w-full object-cover object-top md:h-[320px]"
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-6 border-t border-[#eee3e4] py-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:py-16">
            <div className="rounded-[30px] bg-[#231824] px-5 py-6 text-white shadow-[0_20px_54px_rgba(36,24,36,0.24)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-200">{copy.flow.eyebrow}</p>
              <h2 className="marketing-display mt-3 text-[2rem] leading-[1] tracking-[-0.04em] text-white">
                {copy.flow.title}
              </h2>
              <div className="mt-6 space-y-4">
                {copy.flow.steps.map((step) => (
                  <div key={step.number} className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-rose-100">
                        {step.number}
                      </div>
                      <p className="text-base font-semibold text-white">{step.title}</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-rose-50/80">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-[#ece2e5] bg-white px-5 py-6 shadow-[0_14px_40px_rgba(56,35,48,0.07)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-400">{copy.safety.eyebrow}</p>
              <h2 className="marketing-display mt-3 text-[2rem] leading-[1] tracking-[-0.04em] text-[#261925]">
                {copy.safety.title}
              </h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {copy.safety.items.map((item) => (
                  <div key={item.title} className="rounded-[22px] bg-[#faf6f7] px-4 py-4">
                    <p className="text-sm font-semibold text-[#332534]">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#766676]">{item.description}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm leading-6 text-[#7a6878]">{copy.safety.note}</p>
            </div>
          </section>

          <section className="grid gap-6 border-t border-[#eee3e4] py-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:py-16">
            <div className="rounded-[30px] border border-[#ece2e5] bg-white px-5 py-6 shadow-[0_14px_40px_rgba(56,35,48,0.07)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-400">FAQ</p>
              <h2 className="marketing-display mt-3 text-[2rem] leading-[1] tracking-[-0.04em] text-[#261925]">
                {copy.faqTitle}
              </h2>
              <div className="marketing-faq mt-6 space-y-3">
                {copy.faqs.map((faq) => (
                  <details key={faq.question} className="group rounded-[22px] border border-[#f0e4e8] bg-[#fffdfd] px-4 py-1">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4">
                      <span className="text-sm font-semibold text-[#382a39]">{faq.question}</span>
                      <span className="text-lg font-semibold text-rose-400 transition group-open:rotate-45">+</span>
                    </summary>
                    <p className="border-t border-[#f0e4e8] pb-4 pt-4 text-sm leading-6 text-[#6d5d6e]">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] bg-[linear-gradient(145deg,_#9d174d_0%,_#e4488f_52%,_#fb923c_100%)] px-5 py-6 text-white shadow-[0_22px_60px_rgba(157,23,77,0.28)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-100">App Store</p>
              <h2 className="marketing-display mt-3 text-[2rem] leading-[1] tracking-[-0.04em] text-white">
                {copy.finalCta.title}
              </h2>
              <div className="mt-6">
                <StoreButton href={storeHref} badge={store.badge} label={store.button} tone="light" />
              </div>
            </div>
          </section>

          <footer className="border-t border-[#eee3e4] py-8">
            <div className="flex flex-col items-start justify-between gap-3 text-sm text-[#7f6d79] sm:flex-row sm:items-center">
              <div className="flex flex-wrap items-center gap-4">
                <Link href={copy.languageSwitchHref} className="font-semibold text-[#5a4957] underline underline-offset-4">
                  {copy.languageSwitchLabel}
                </Link>
                <Link href="/privacy" className="underline underline-offset-4">
                  {copy.footerPrivacy}
                </Link>
              </div>
              <p className="text-xs text-[#a18e99]">© 2026 Pairlog</p>
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
          root: 'border-[#261925] bg-[#261925] text-white hover:bg-[#342434]',
          badge: 'text-rose-100/85',
          note: 'text-white/70',
        }
      : {
          root: 'border-white/25 bg-white text-[#8d2051] hover:bg-[#fff7fb]',
          badge: 'text-[#d94f8c]',
          note: 'text-[#7d6975]',
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
        className={`block rounded-[28px] border px-4 py-4 shadow-[0_16px_32px_rgba(72,39,58,0.14)] transition ${classes.root}`}
      >
        {content}
      </a>
    )
  }

  return (
    <Link
      href={href}
      className={`block rounded-[28px] border px-4 py-4 shadow-[0_16px_32px_rgba(72,39,58,0.14)] transition ${classes.root}`}
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

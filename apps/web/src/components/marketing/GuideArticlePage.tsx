import Link from 'next/link'

import { type GuideArticle, GUIDE_ARTICLES_BY_SLUG, getGuideCampaignUrl, getGuidePath } from '@/lib/guides'

export function GuideArticlePage({ guide }: { guide: GuideArticle }) {
  const articleUrl = `https://pairlog.pages.dev${getGuidePath(guide.slug)}`
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: guide.title,
    description: guide.description,
    image: [`https://pairlog.pages.dev${guide.coverImage}`],
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt,
    inLanguage: 'ja-JP',
    mainEntityOfPage: articleUrl,
    author: {
      '@type': 'Organization',
      name: 'Pairlog',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Pairlog',
    },
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Pairlog',
        item: 'https://pairlog.pages.dev',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'ガイド',
        item: 'https://pairlog.pages.dev/guide',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: guide.title,
        item: articleUrl,
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <main lang="ja-JP" className="marketing-page min-h-screen text-[#2f2329]">
        <div className="mx-auto max-w-4xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pb-24">
          <header className="flex items-center justify-between py-3">
            <Link
              href="/guide"
              className="marketing-button-pop rounded-full border border-[#e8deda] bg-white px-4 py-2 text-xs font-semibold text-[#5c4e57]"
            >
              ← ガイド一覧へ
            </Link>
            <Link
              href="/"
              className="rounded-full px-2 py-2 text-xs font-semibold text-[#6f606b] underline underline-offset-4"
            >
              Pairlog トップ
            </Link>
          </header>

          <article className="rounded-[34px] border border-[#ece2e5] bg-[#fffdfc] px-5 py-7 shadow-[0_18px_48px_rgba(56,35,48,0.06)] sm:px-7 lg:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b66c7c]">{guide.heroEyebrow}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#c06b59]">{guide.category}</p>
            <h1 className="marketing-display mt-3 text-[2.1rem] leading-[1.02] tracking-[-0.05em] text-[#261925] sm:text-[3rem]">
              {guide.heroTitle}
            </h1>
            <p className="mt-5 text-base leading-8 text-[#5d5059]">{guide.lede}</p>
            <p className="mt-3 text-sm leading-6 text-[#857680]">
              公開日 {guide.publishedAt} / 更新日 {guide.updatedAt}
            </p>

            <div className="mt-8 space-y-10">
              {guide.sections.map((section) => (
                <section key={section.title}>
                  <h2 className="marketing-display text-[1.65rem] leading-[1.08] tracking-[-0.04em] text-[#2c1f2c]">
                    {section.title}
                  </h2>
                  <div className="mt-4 space-y-4 text-sm leading-7 text-[#5f4f59] sm:text-base">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    {section.bullets ? (
                      <ul className="space-y-2 rounded-[24px] border border-[#f0e4e8] bg-white px-5 py-4 text-sm leading-7 text-[#5f4f59]">
                        {section.bullets.map((bullet) => (
                          <li key={bullet}>• {bullet}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </section>
              ))}
            </div>

            <section className="mt-10 rounded-[28px] border border-[#ecd4cb] bg-[linear-gradient(135deg,#fff6f1_0%,#fffaf7_100%)] px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c06b59]">App Store</p>
              <h2 className="marketing-display mt-3 text-[1.55rem] leading-[1.08] tracking-[-0.04em] text-[#2c1f2c]">
                {guide.ctaTitle}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#5f4f59]">{guide.ctaBody}</p>
              <div className="mt-5">
                <a
                  href={getGuideCampaignUrl(guide.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-transparent bg-[linear-gradient(135deg,#c86861_0%,#e08b66_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(140,92,72,0.14)]"
                >
                  App Store で見る
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </section>
          </article>

          <section className="mt-8 rounded-[30px] border border-[#ece2e5] bg-white px-5 py-6 shadow-[0_14px_40px_rgba(56,35,48,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b66c7c]">Related</p>
            <div className="mt-4 grid gap-4">
              {guide.relatedSlugs.map((slug) => {
                const related = GUIDE_ARTICLES_BY_SLUG[slug]
                return (
                  <Link
                    key={related.slug}
                    href={getGuidePath(related.slug)}
                    className="rounded-[24px] border border-[#f0e4e8] bg-[#fffdfd] px-4 py-4 transition hover:border-[#ead4dc]"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c06b59]">{related.category}</p>
                    <p className="mt-2 text-base font-semibold text-[#2c1f2c]">{related.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#675862]">{related.excerpt}</p>
                  </Link>
                )
              })}
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

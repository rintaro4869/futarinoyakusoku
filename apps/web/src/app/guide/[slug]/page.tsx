import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { GUIDE_ARTICLES, getGuide, getGuideMetadata, getGuidePath } from '@/lib/guides'

export function generateStaticParams() {
  return GUIDE_ARTICLES.map((guide) => ({ slug: guide.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) return {}
  return getGuideMetadata(guide.slug)
}

export default async function GuideArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) notFound()

  const related = guide.relatedSlugs
    .map((s) => getGuide(s))
    .filter((g): g is NonNullable<typeof g> => g !== null)

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt,
    author: { '@type': 'Organization', name: 'Pairlog' },
    publisher: { '@type': 'Organization', name: 'Pairlog' },
    inLanguage: 'ja',
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <nav aria-label="Breadcrumb" className="mb-8 flex gap-2 text-xs text-[#9a8e95]">
          <Link href="/" className="hover:text-[#5c4e57]">
            Pairlog
          </Link>
          <span>/</span>
          <Link href="/guide" className="hover:text-[#5c4e57]">
            ガイド
          </Link>
          <span>/</span>
          <span className="truncate text-[#5c4e57]">{guide.category}</span>
        </nav>

        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b66c7c]">{guide.heroEyebrow}</p>
        <h1 className="mt-3 text-2xl font-bold leading-snug tracking-tight text-[#261925] sm:text-3xl">
          {guide.heroTitle}
        </h1>
        <p className="mt-4 text-sm leading-7 text-[#5d5059] sm:text-base">{guide.lede}</p>

        <div className="mt-10 space-y-10">
          {guide.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-bold tracking-tight text-[#261925]">{section.title}</h2>
              {section.paragraphs.map((p, i) => (
                <p key={i} className="mt-3 text-sm leading-7 text-[#5d5059] sm:text-base">
                  {p}
                </p>
              ))}
              {section.bullets && (
                <ul className="ml-5 mt-4 list-disc space-y-2 text-sm leading-7 text-[#5d5059]">
                  {section.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-[24px] border border-[#ece2e5] bg-white p-6 shadow-[0_8px_24px_rgba(56,35,48,0.06)]">
          <h2 className="text-lg font-bold text-[#261925]">{guide.ctaTitle}</h2>
          <p className="mt-3 text-sm leading-6 text-[#5d5059]">{guide.ctaBody}</p>
          <a
            href="https://apps.apple.com/app/id6760982290"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block rounded-full bg-[linear-gradient(135deg,#c86861_0%,#e08b66_100%)] px-6 py-3 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(200,104,97,0.28)]"
          >
            App Storeで無料ダウンロード →
          </a>
        </div>

        {related.length > 0 && (
          <div className="mt-10 border-t border-[#eadfe2] pt-8">
            <p className="text-sm font-semibold text-[#261925]">関連ガイド</p>
            <div className="mt-3 grid gap-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={getGuidePath(r.slug)}
                  className="block rounded-[16px] border border-[#ece2e5] bg-white px-4 py-3 text-sm text-[#382a39] transition hover:bg-[#fffaf9]"
                >
                  {r.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 flex gap-4 border-t border-[#eadfe2] pt-8 text-sm">
          <Link href="/guide" className="font-semibold text-[#5c4e57] underline underline-offset-4">
            ← ガイド一覧
          </Link>
          <Link href="/" className="text-[#9a8e95] underline underline-offset-4">
            Pairlog トップ
          </Link>
        </div>
      </main>
    </>
  )
}

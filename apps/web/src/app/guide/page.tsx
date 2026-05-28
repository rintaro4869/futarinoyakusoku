import type { Metadata } from 'next'
import Link from 'next/link'

import { GUIDE_ARTICLES, getGuidePath } from '@/lib/guides'

export const metadata: Metadata = {
  title: 'カップルアプリ ガイド | Pairlog',
  description:
    '同棲・夫婦・遠距離カップル向けのアプリ選びガイド。共有日記、約束管理、感謝記録など、ふたりの生活を整えるアプリの選び方をまとめました。',
  robots: { index: true, follow: true },
  alternates: { canonical: '/guide' },
}

export default function GuideIndexPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-8 flex gap-2 text-xs text-[#9a8e95]">
        <Link href="/" className="hover:text-[#5c4e57]">
          Pairlog
        </Link>
        <span>/</span>
        <span className="text-[#5c4e57]">ガイド</span>
      </nav>

      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b66c7c]">Guide</p>
      <h1 className="mt-3 text-2xl font-bold leading-snug tracking-tight text-[#261925] sm:text-3xl">
        カップルアプリ 使い方ガイド
      </h1>
      <p className="mt-4 text-sm leading-7 text-[#5d5059]">
        同棲・夫婦・遠距カップルが使いやすいアプリの選び方と、Pairlogの活用法をまとめました。
      </p>

      <div className="mt-10 space-y-4">
        {GUIDE_ARTICLES.map((guide) => (
          <Link
            key={guide.slug}
            href={getGuidePath(guide.slug)}
            className="block rounded-[20px] border border-[#ece2e5] bg-white px-5 py-4 text-[#382a39] transition hover:bg-[#fffaf9] hover:shadow-[0_4px_12px_rgba(56,35,48,0.06)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b66c7c]">{guide.category}</p>
            <h2 className="mt-1 text-base font-bold text-[#261925]">{guide.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#5d5059]">{guide.excerpt}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12 border-t border-[#eadfe2] pt-8">
        <Link href="/" className="text-sm font-semibold text-[#5c4e57] underline underline-offset-4">
          ← Pairlog トップへ
        </Link>
      </div>
    </main>
  )
}

import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

import { APP_STORE, SITE_URL } from '@/lib/marketing'

export const metadata: Metadata = {
  metadataBase: new URL('https://pairlog.pages.dev'),
  applicationName: 'Pairlog',
  title: {
    default: 'カップル日記アプリ Pairlog｜同棲・夫婦で使える共有日記・約束管理アプリ',
    template: '%s | Pairlog',
  },
  description:
    '同棲・夫婦向けの無料iPhoneアプリ。共有日記、約束管理、ありがとうの記録をひとつに。LINEやメモに流れがちなふたりの記録を、ふたりだけの場所に残せます。App Storeで無料ダウンロード。',
  keywords: [
    'カップルアプリ',
    '夫婦アプリ',
    '夫婦 共有アプリ',
    '同棲 アプリ',
    '同棲 カップル アプリ',
    'カップル日記アプリ',
    '共有日記アプリ',
    '共有メモ アプリ',
    'カップル 共有メモ',
    'カップル日記',
    'ふたり日記アプリ',
    'カップル 記録',
    'ふたり 記録',
    '約束 管理 アプリ',
    'ありがとう 記録',
    'カップル iPhoneアプリ',
    'ペアアプリ',
    '恋人 記録アプリ',
    '二人 日記',
  ],
  openGraph: {
    title: 'カップル日記アプリ Pairlog｜同棲・夫婦で使える共有日記・約束管理アプリ',
    description:
      '同棲カップル・夫婦向けの無料iPhoneアプリ。カップル日記アプリ・共有日記アプリとして、共有日記、約束管理、ありがとうの記録、カレンダーをひとつにまとめ、共有メモの代わりにも使えます。',
    siteName: 'Pairlog',
    type: 'website',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'カップル日記アプリ Pairlog｜同棲・夫婦で使える共有日記・約束管理アプリ',
    description:
      '同棲カップル・夫婦向けの無料iPhoneアプリ。カップル日記アプリ・共有日記アプリとして、共有日記、約束管理、ありがとうの記録、カレンダーをひとつにまとめ、共有メモの代わりにも使えます。',
  },
  other: {
    'apple-itunes-app': `app-id=${APP_STORE.appId}, app-argument=${SITE_URL}`,
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Pairlog',
    url: SITE_URL,
    inLanguage: ['ja-JP', 'en-US'],
    description: '同棲カップル・夫婦向けに、日記・約束・ありがとうを残せる Pairlog の公式サイトです。',
  }

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Pairlog',
    url: SITE_URL,
  }

  return (
    <html lang="ja">
      <body className="min-h-screen bg-[#f6efe8]">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          'name': 'Pairlog',
          'description': '同棲カップル・夫婦向けの無料iPhoneアプリ。共有日記、約束管理、ありがとうの記録をひとつにまとめました。',
          'applicationCategory': 'LifestyleApplication',
          'operatingSystem': 'iOS',
          'url': 'https://pairlog.pages.dev',
          'inLanguage': ['ja-JP', 'en-US'],
          'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'JPY' },
          'downloadUrl': 'https://apps.apple.com/app/id6760982290',
          'installUrl': 'https://apps.apple.com/app/id6760982290',
          'featureList': ['ふたりの共有日記', '約束管理・リマインダー', 'ありがとうの記録とポイント', 'カレンダーで振り返り', 'ごほうびシステム'],
        }) }} />
        {children}
      </body>
    </html>
  )
}

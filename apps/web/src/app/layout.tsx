import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://pairlog.pages.dev'),
  applicationName: 'Pairlog',
  title: {
    default: 'Pairlog',
    template: '%s | Pairlog',
  },
  description: 'Pairlog は、カップルや夫婦のために約束、感謝、カレンダー、ごほうびを記録するアプリです。',
  keywords: ['カップルアプリ', '夫婦アプリ', '記録アプリ', 'ペアアプリ', '約束アプリ', '感謝アプリ'],
  openGraph: {
    title: 'Pairlog',
    description: 'Pairlog は、カップルや夫婦のために約束、感謝、カレンダー、ごほうびを記録するアプリです。',
    siteName: 'Pairlog',
    type: 'website',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pairlog',
    description: 'Pairlog は、カップルや夫婦のために約束、感謝、カレンダー、ごほうびを記録するアプリです。',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-[#f6efe8]">
        <div className="mx-auto min-h-screen max-w-md overflow-x-clip border-x border-white/60 bg-[rgba(255,255,255,0.62)] shadow-[0_0_0_1px_rgba(255,255,255,0.6),0_18px_60px_rgba(110,86,101,0.16)] backdrop-blur-sm">
          {children}
        </div>
      </body>
    </html>
  )
}

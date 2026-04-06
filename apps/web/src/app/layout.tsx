import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Pairlog（ペアログ）- カップル・夫婦の記録アプリ',
    template: '%s | Pairlog',
  },
  description: 'ふたりの約束・感謝・カレンダーを一か所に。カップルや夫婦のための記録アプリ「ペアログ」。iOSで無料ダウンロード。',
  keywords: ['カップルアプリ', '夫婦アプリ', '記録アプリ', 'カップル 約束', 'カップル 感謝', '恋人 アプリ', 'ペアアプリ', 'ふたり アプリ'],
  openGraph: {
    siteName: 'Pairlog',
    type: 'website',
    locale: 'ja_JP',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto min-h-screen bg-white shadow-sm">
          {children}
        </div>
      </body>
    </html>
  )
}

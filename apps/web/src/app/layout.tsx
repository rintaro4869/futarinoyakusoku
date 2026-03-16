import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ふたりの約束',
  description: '約束のすれ違いを、責めずに整えるためのアプリです',
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

import { Suspense, type ReactNode } from 'react'

export default function EventsLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="p-6 text-center text-gray-400">読み込み中...</div>}>{children}</Suspense>
}

import { Suspense } from 'react'

export default function PairLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="p-6 text-center text-gray-400">読み込み中...</div>}>{children}</Suspense>
}

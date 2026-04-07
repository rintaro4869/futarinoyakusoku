import type { ReactNode } from 'react'

export default function AppShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-md overflow-x-clip border-x border-white/60 bg-[rgba(255,255,255,0.62)] shadow-[0_0_0_1px_rgba(255,255,255,0.6),0_18px_60px_rgba(110,86,101,0.16)] backdrop-blur-sm">
      {children}
    </div>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { messages } from '@/lib/i18n'

type Tab = 'home' | 'box' | 'record' | 'repair' | 'weekly'

export function BottomNav({ active }: { active: Tab }) {
  const router = useRouter()
  return (
    <nav className="mt-8 grid grid-cols-5 gap-2 border-t border-gray-100 pt-4">
      <TabBtn label={messages.nav.home} active={active === 'home'} onClick={() => router.push('/home')} />
      <TabBtn label={messages.nav.box} active={active === 'box'} onClick={() => router.push('/rules')} />
      <TabBtn label={messages.nav.record} active={active === 'record'} onClick={() => router.push('/events')} />
      <TabBtn label={messages.nav.repair} active={active === 'repair'} onClick={() => router.push('/repair')} />
      <TabBtn label={messages.nav.weekly} active={active === 'weekly'} onClick={() => router.push('/summary')} />
    </nav>
  )
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-2 py-2 text-[11px] font-medium transition ${
        active ? 'bg-brand-50 text-brand-700 border border-brand-100' : 'text-gray-500 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  )
}

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pairlog - The Couple\'s Logging App',
  description: 'Log your promises, gratitude, and shared moments together. The app for couples who want to grow closer, one day at a time. Free on iOS.',
  keywords: ['couple app', 'relationship tracker', 'couples diary', 'promise app', 'couples log', 'gratitude app', 'partner app'],
  openGraph: {
    siteName: 'Pairlog',
    type: 'website',
    locale: 'en_US',
  },
}

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

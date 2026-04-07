import type { Metadata } from 'next'
import { LandingPage } from '@/components/marketing/LandingPage'
import { getLandingMetadata } from '@/lib/marketing'

export const metadata: Metadata = getLandingMetadata('ja')

export default function Page() {
  return <LandingPage locale="ja" />
}

import type { Metadata } from 'next'

import { DownloadStatusPage } from '@/components/marketing/DownloadStatusPage'
import { getDownloadMetadata } from '@/lib/marketing'

export const metadata: Metadata = getDownloadMetadata('en')

export default function Page() {
  return <DownloadStatusPage locale="en" />
}

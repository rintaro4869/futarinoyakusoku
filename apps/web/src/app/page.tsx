import type { Metadata } from 'next'
import { LandingPage } from '@/components/marketing/LandingPage'
import { getLandingMetadata } from '@/lib/marketing'

export const metadata: Metadata = getLandingMetadata('ja')

export default function Page() {
  return (
    <>
      <section
        aria-labelledby="service-closure-notice"
        lang="ja"
        className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 lg:px-8"
      >
        <div className="rounded-[24px] border border-[#ddbac6] bg-[#fffaf9] p-5 text-[#2f2329] sm:p-6">
          <h2 id="service-closure-notice" className="text-lg font-semibold sm:text-xl">
            Pairlog サービス終了のお知らせ
          </h2>
          <div className="mt-3 space-y-2 text-sm leading-7 sm:text-base">
            <p>Pairlogは、2026年10月31日（土）23:59（日本時間）をもってサービスを終了します。</p>
            <p>
              記録の書き出し期限も、同日23:59を予定しています。書き出し機能は現在準備中です。提供開始時期と保存方法は、準備が整い次第、このページでご案内します。
            </p>
            <p>これまでPairlogをご利用いただき、ありがとうございました。</p>
          </div>
        </div>
      </section>
      <LandingPage locale="ja" />
    </>
  )
}

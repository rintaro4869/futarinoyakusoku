import type { Metadata } from 'next'

export const SITE_URL = 'https://pairlog.pages.dev'

export const APP_STORE = {
  url: 'https://apps.apple.com/app/id6760982290',
  status: 'in_review' as 'live' | 'in_review',
  appId: '6760982290',
}

export const MARKETING_SCREENSHOTS = [
  '/marketing/01_appstore.png',
  '/marketing/02_appstore.png',
  '/marketing/03_appstore.png',
  '/marketing/04_appstore.png',
] as const

export type LandingLocale = 'ja' | 'en'

type Tone = 'rose' | 'orange' | 'sky' | 'cream'

export type LandingCopy = {
  locale: LandingLocale
  path: '/' | '/en'
  title: string
  description: string
  keywords: string[]
  languageSwitchLabel: string
  languageSwitchHref: '/' | '/en'
  navLabel: string
  hero: {
    eyebrow: string
    title: string
    lead: string
    body: string
    status: string
    availabilityNote: string
    secondaryCta: string
    secondaryHref: string
    stats: { label: string; value: string }[]
  }
  pain: {
    eyebrow: string
    title: string
    intro: string
    items: string[]
    note: string
  }
  flow: {
    eyebrow: string
    title: string
    steps: { number: string; title: string; description: string }[]
  }
  showcase: {
    eyebrow: string
    title: string
    description: string
    items: {
      eyebrow: string
      title: string
      description: string
      tone: Tone
      screenshot: (typeof MARKETING_SCREENSHOTS)[number]
    }[]
  }
  safety: {
    eyebrow: string
    title: string
    items: { title: string; description: string }[]
    note: string
  }
  faqTitle: string
  faqs: { question: string; answer: string }[]
  finalCta: {
    title: string
    description: string
    note: string
  }
  footerPrivacy: string
}

export type DownloadCopy = {
  path: '/download' | '/en/download'
  title: string
  description: string
  statusTitle: string
  statusBody: string
  points: string[]
  footerNote: string
}

export function getLandingMetadata(locale: LandingLocale): Metadata {
  const copy = getLandingCopy(locale)
  const path = copy.path
  const url = path === '/' ? SITE_URL : `${SITE_URL}${path}`

  return {
    title: copy.title,
    description: copy.description,
    keywords: copy.keywords,
    alternates: {
      canonical: path,
      languages: {
        ja: '/',
        en: '/en',
        'x-default': '/',
      },
    },
    openGraph: {
      title: 'Pairlog',
      description: copy.description,
      url,
      siteName: 'Pairlog',
      type: 'website',
      locale: locale === 'ja' ? 'ja_JP' : 'en_US',
      images: [
        {
          url: MARKETING_SCREENSHOTS[0],
          width: 1290,
          height: 2796,
          alt: 'Pairlog app preview',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Pairlog',
      description: copy.description,
      images: [MARKETING_SCREENSHOTS[0]],
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export function getStoreMeta(locale: LandingLocale) {
  if (locale === 'ja') {
    return APP_STORE.status === 'live'
      ? {
          badge: 'Available on the App Store',
          button: 'App Store からダウンロード',
          note: 'iPhoneで無料で始められます。',
        }
      : {
          badge: 'App Store 審査中',
          button: 'App Storeでまもなく公開',
          note: '現在は審査中です。',
        }
  }

  return APP_STORE.status === 'live'
    ? {
        badge: 'Available on the App Store',
        button: 'Download on the App Store',
        note: 'Free to start on iPhone.',
      }
    : {
        badge: 'App Store review in progress',
        button: 'Coming soon to the App Store',
        note: 'Currently under review.',
      }
}

export function getStoreHref(locale: LandingLocale) {
  if (APP_STORE.status === 'live') {
    return APP_STORE.url
  }

  return locale === 'ja' ? '/download' : '/en/download'
}

export function getDownloadMetadata(locale: LandingLocale): Metadata {
  const copy = getDownloadCopy(locale)
  const url = `${SITE_URL}${copy.path}`

  return {
    title: locale === 'ja' ? 'App Store 公開状況' : 'App Store release status',
    description: copy.description,
    alternates: {
      canonical: copy.path,
      languages: {
        ja: '/download',
        en: '/en/download',
        'x-default': '/download',
      },
    },
    openGraph: {
      title: 'Pairlog',
      description: copy.description,
      url,
      siteName: 'Pairlog',
      type: 'website',
      locale: locale === 'ja' ? 'ja_JP' : 'en_US',
      images: [
        {
          url: MARKETING_SCREENSHOTS[0],
          width: 1290,
          height: 2796,
          alt: 'Pairlog app preview',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Pairlog',
      description: copy.description,
      images: [MARKETING_SCREENSHOTS[0]],
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export function getDownloadCopy(locale: LandingLocale): DownloadCopy {
  if (locale === 'en') {
    return {
      path: '/en/download',
      title: 'App Store release status',
      description: 'Pairlog is still under Apple review. This page keeps the download path stable until the App Store listing is approved.',
      statusTitle: 'The download path is already prepared.',
      statusBody: 'The main App Store CTA stays in the most prominent place on the landing page, but the site does not claim the app is live before approval. Once Apple review finishes, this route can switch directly to the real store link.',
      points: [
        'Current state: App Store review in progress',
        'Launch platform: iPhone',
        'Switch plan: replace this pending route with the live App Store URL',
      ],
      footerNote: 'The store URL is ready, but the site should not imply public availability before Apple approval.',
    }
  }

  return {
    path: '/download',
    title: 'App Store 公開状況',
    description: 'Pairlog は現在 Apple の審査中です。公開後もダウンロード導線はこのページを起点に維持します。',
    statusTitle: 'ダウンロード導線だけ先に固定しています。',
    statusBody: 'ランディングページでは App Store CTA を一番目立つ位置に置きつつ、審査通過前に「公開中」とは案内しません。承認後はこの導線をそのまま App Store の本番リンクに切り替えます。',
    points: [
      '現在の状態: App Store 審査中',
      '公開対象: iPhone',
      '切り替え方: 承認後に App Store の本番URLへ変更',
    ],
    footerNote: 'URL は準備していても、審査通過前はダウンロード可能とは表示しない方針です。',
  }
}

export function getLandingCopy(locale: LandingLocale): LandingCopy {
  if (locale === 'en') {
    return {
      locale: 'en',
      path: '/en',
      title: 'A softer way to log promises and gratitude as a couple',
      description: 'Pairlog is an iPhone app for couples to share promises, gratitude logs, weekly progress, and rewards. App Store release coming soon.',
      keywords: ['couple app', 'relationship tracker', 'gratitude app', 'promise tracker', 'shared rewards', 'partner app', 'iPhone app for couples'],
      languageSwitchLabel: '日本語',
      languageSwitchHref: '/',
      navLabel: 'Pairlog',
      hero: {
        eyebrow: 'A couple app for quieter conversations',
        title: 'Log promises without turning them into blame.',
        lead: 'Pairlog helps couples keep promises, notice gratitude, and build small rituals they can actually continue.',
        body: 'It is designed for everyday relationship maintenance: shared promises, one-tap logs, weekly progress, rewards, and a pairing flow that feels lightweight instead of heavy.',
        status: 'App Store review in progress',
        availabilityNote: 'Built for iPhone first. Android is not part of the current launch.',
        secondaryCta: 'See the screens',
        secondaryHref: '#showcase',
        stats: [
          { label: 'Pairing', value: 'Invite link' },
          { label: 'Logging', value: 'One tap' },
          { label: 'Progress', value: 'Weekly view' },
          { label: 'Safety', value: 'Pause anytime' },
        ],
      },
      pain: {
        eyebrow: 'Why it exists',
        title: 'For the moments that usually end in “I thought you knew.”',
        intro: 'The goal is not scoring your partner. The goal is creating a calm place to record what matters before it turns into another exhausting conversation.',
        items: [
          'A promise was made, then half-forgotten.',
          'You wanted to say thank you, but the moment passed.',
          'The same small friction kept repeating every week.',
          'You needed a shared system, not another argument about memory.',
        ],
        note: 'Pairlog turns “remember harder” into a shared routine the two of you can actually keep.',
      },
      flow: {
        eyebrow: 'How it works',
        title: 'Simple enough to keep using',
        steps: [
          {
            number: '01',
            title: 'Connect with your partner',
            description: 'Start alone, then send an invite link when you are ready to share the same space.',
          },
          {
            number: '02',
            title: 'Create promises and gratitude triggers',
            description: 'Set recurring promises or quick “thank you” moments that can be logged when they happen.',
          },
          {
            number: '03',
            title: 'Log, review, and unlock rewards',
            description: 'Build points together, review the week, and turn progress into a reward or a conversation starter.',
          },
        ],
      },
      showcase: {
        eyebrow: 'Inside the app',
        title: 'A warmer, more intentional daily flow',
        description: 'The product is built around a few gentle surfaces instead of a cluttered dashboard.',
        items: [
          {
            eyebrow: 'Promises',
            title: 'Shared promises that stay visible',
            description: 'Recurring promises and quick wins sit in the same flow, so “we talked about it” becomes something you can actually revisit.',
            tone: 'rose',
            screenshot: MARKETING_SCREENSHOTS[0],
          },
          {
            eyebrow: 'Gratitude',
            title: 'Thank-you logs that feel personal',
            description: 'Record gratitude in the moment and let the app keep the emotional receipts your memory usually loses.',
            tone: 'sky',
            screenshot: MARKETING_SCREENSHOTS[1],
          },
          {
            eyebrow: 'Calendar',
            title: 'See the week instead of guessing it',
            description: 'Your shared calendar view makes promises, logs, and timing easier to understand at a glance.',
            tone: 'orange',
            screenshot: MARKETING_SCREENSHOTS[2],
          },
          {
            eyebrow: 'Rewards',
            title: 'Turn progress into something you both look forward to',
            description: 'Rewards and unlocks give your routine a finish line, whether that is a treat, a date idea, or a reset conversation.',
            tone: 'cream',
            screenshot: MARKETING_SCREENSHOTS[3],
          },
        ],
      },
      safety: {
        eyebrow: 'Safety',
        title: 'Built for mutual use, not control',
        items: [
          { title: 'Mutual consent', description: 'The experience is designed for two people who agree to use it together.' },
          { title: 'Pause or leave anytime', description: 'A relationship tool should never trap either person inside it.' },
          { title: 'Delete data from settings', description: 'Account and shared records can be removed from inside the app.' },
          { title: 'No surveillance framing', description: 'The product language and flows are intentionally designed away from monitoring.' },
        ],
        note: 'If the app state changes before launch, keep the marketing copy aligned with the actual release state.',
      },
      faqTitle: 'Questions',
      faqs: [
        { question: 'Is Pairlog free?', answer: 'Yes. The current launch is planned as a free iPhone app.' },
        { question: 'Is it already live on the App Store?', answer: 'Not yet. The current state is App Store review in progress, and the main CTA is prepared for the live link once approval is complete.' },
        { question: 'Can I start without my partner?', answer: 'Yes. You can enter first, look around, and connect later through an invite link.' },
        { question: 'What is shared?', answer: 'The shared experience centers on promises, logs, point progress, and rewards created for the pair.' },
        { question: 'Is Android supported?', answer: 'No. The current launch focus is iPhone.' },
      ],
      finalCta: {
        title: 'Be ready to download as soon as it goes live.',
        description: '',
        note: '',
      },
      footerPrivacy: 'Privacy Policy',
    }
  }

  return {
    locale: 'ja',
    path: '/',
    title: '責めないで、ふたりの約束と感謝を記録するiPhoneアプリ',
    description: 'Pairlog は、カップルや夫婦の約束、ありがとう、週間の進み具合、ごほうびを記録するiPhoneアプリです。App Store公開準備中。',
    keywords: ['カップルアプリ', '夫婦アプリ', '約束アプリ', 'ありがとう 記録', '関係改善 アプリ', 'ペアアプリ', 'iPhoneアプリ'],
    languageSwitchLabel: 'English',
    languageSwitchHref: '/en',
    navLabel: 'Pairlog',
    hero: {
      eyebrow: '責める代わりに、記録するためのアプリ',
      title: '約束を責めずに整える。感謝も、ごほうびも、ひとつに。',
      lead: 'Pairlog は、カップルや夫婦が「言った・言わない」で消耗しすぎないための、やさしい記録アプリです。',
      body: '約束、ありがとう、週間の進み具合、カレンダー、ごほうびを同じ流れで扱えるので、ふたりの対話を毎回ゼロから始めずに済みます。',
      status: 'App Store 審査中',
      availabilityNote: 'iPhone向けの公開を準備中です。Android は現在の公開対象に含めていません。',
      secondaryCta: '画面を見る',
      secondaryHref: '#showcase',
      stats: [
        { label: 'つなぎ方', value: '招待リンク' },
        { label: '記録', value: '1タップ' },
        { label: 'ふり返り', value: '週間で確認' },
        { label: '安全性', value: 'いつでも停止' },
      ],
    },
    pain: {
      eyebrow: 'こんな時のために',
      title: '「わかってると思った」が、すれ違いになる前に。',
      intro: 'Pairlog が作りたいのは、相手を採点する仕組みではありません。毎日の中で忘れやすい約束や感謝を、ふたりで静かに残していく場所です。',
      items: [
        '約束したのに、なんとなく流れてしまった。',
        'ありがとうを言いたかったのに、その瞬間を逃した。',
        '小さなズレが毎週同じように積み重なった。',
        '必要だったのは根性ではなく、共有できる仕組みだった。',
      ],
      note: '「もっと覚えていて」ではなく、「一緒に残しておこう」に変えるためのアプリです。',
    },
    flow: {
      eyebrow: '使い方',
      title: '続けやすい3ステップ',
      steps: [
        {
          number: '01',
          title: 'まずはひとりで始めて、あとからつなぐ',
          description: 'アプリの雰囲気を見てから、招待リンクでパートナーと接続できます。',
        },
        {
          number: '02',
          title: '約束と「ありがとう」のきっかけを決める',
          description: '日常のルーティンも、その場の感謝も、同じ流れの中で扱えます。',
        },
        {
          number: '03',
          title: '記録して、ふり返って、ごほうびにつなげる',
          description: '1タップの記録が積み上がると、週間の進み具合や解放できるごほうびが見えてきます。',
        },
      ],
    },
    showcase: {
      eyebrow: 'アプリの中身',
      title: 'やることが散らからない、あたたかい導線',
      description: 'ダッシュボードを情報で埋めるのではなく、毎日触る面だけを丁寧に設計しています。',
      items: [
        {
          eyebrow: '約束',
          title: 'ふたりの約束を、見失わない形に',
          description: 'ルーティンの約束も、その時々の小さな目標も、あとで見返せる形で同じ場所に残せます。',
          tone: 'rose',
          screenshot: MARKETING_SCREENSHOTS[0],
        },
        {
          eyebrow: 'ありがとう',
          title: '感謝をその場で残せる',
          description: '伝えそびれがちな「ありがとう」を、その時の気持ちごと記録して、あとからも見返せます。',
          tone: 'sky',
          screenshot: MARKETING_SCREENSHOTS[1],
        },
        {
          eyebrow: 'カレンダー',
          title: '今週の流れを、ふたりで把握しやすい',
          description: '約束や記録がいつ動いたかを見渡せるので、感覚だけで話さなくて済みます。',
          tone: 'orange',
          screenshot: MARKETING_SCREENSHOTS[2],
        },
        {
          eyebrow: 'ごほうび',
          title: '積み上がりが楽しみに変わる',
          description: 'ポイントがたまったら、ごほうびや会話のきっかけを解放。続ける理由をやさしく作ります。',
          tone: 'cream',
          screenshot: MARKETING_SCREENSHOTS[3],
        },
      ],
    },
    safety: {
      eyebrow: 'Safety',
      title: '監視ではなく、合意のための設計',
      items: [
        { title: 'ふたりの合意で使う', description: '一方だけが管理するためのツールにはしません。' },
        { title: 'いつでも停止できる', description: '続けたくない時に、片方が足止めされないようにします。' },
        { title: '設定から削除できる', description: 'アカウントや共有記録の削除導線をアプリ内に持たせています。' },
        { title: '言葉づかいも監視寄りにしない', description: 'コピーもUIも、コントロール目的に寄せない前提で整えます。' },
      ],
      note: 'LPの文言も、公開状態と安全方針に合わせて常に正確に保ちます。',
    },
    faqTitle: 'よくある質問',
    faqs: [
      { question: '無料ですか？', answer: 'はい。現在の公開方針では、iPhone向けに無料で始められる想定です。' },
      { question: 'もうApp Storeで公開されていますか？', answer: 'まだです。現在は App Store 審査中で、承認後にこのページのボタンがそのまま配布導線になります。' },
      { question: 'パートナーがいなくても触れますか？', answer: 'はい。先にひとりで入り、あとから招待リンクでつなぐ流れを想定しています。' },
      { question: '何が共有されますか？', answer: '共有の中心になるのは、約束、記録、ポイントの進み具合、ごほうびなど、ふたりで扱う情報です。' },
      { question: 'Android はありますか？', answer: '現時点の公開対象は iPhone です。' },
    ],
    finalCta: {
      title: '公開後はここからすぐ始められます。',
      description: '',
      note: '',
    },
    footerPrivacy: 'プライバシーポリシー',
  }
}

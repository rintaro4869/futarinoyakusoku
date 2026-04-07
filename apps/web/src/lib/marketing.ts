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

export const LANDING_SCREENSHOTS = {
  ja: {
    home: '/marketing/screens/ja-home.png',
    promises: '/marketing/screens/ja-promises.png',
    calendar: '/marketing/screens/ja-calendar.png',
    rewards: '/marketing/screens/ja-rewards.png',
  },
  en: {
    home: '/marketing/screens/en-home.png',
    promises: '/marketing/screens/en-promises.png',
    calendar: '/marketing/screens/en-calendar.png',
    rewards: '/marketing/screens/en-rewards.png',
  },
} as const

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
    screenshot: string
    screenshotAlt: string
  }
  showcase: {
    eyebrow: string
    title: string
    description: string
    items: {
      eyebrow: string
      title: string
      description: string
      highlights: string[]
      tone: Tone
      screenshot: string
    }[]
  }
  faqTitle: string
  faqs: { question: string; answer: string }[]
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
      title: 'App Store status',
      description: 'Pairlog is still in Apple review.',
      statusTitle: 'App Store review in progress',
      statusBody: 'This button stays in place now and can point to the real App Store page after approval.',
      points: [
        'Launch platform: iPhone',
        'Same link after approval',
      ],
      footerNote: 'Until approval, this page only shows status.',
    }
  }

  return {
    path: '/download',
    title: 'App Store 公開状況',
    description: 'Pairlog は現在 Apple の審査中です。',
    statusTitle: '現在は App Store 審査中です',
    statusBody: '承認後、この導線がそのまま App Store の本番リンクになります。',
    points: [
      '公開対象: iPhone',
      '承認後にそのまま切り替え',
    ],
    footerNote: '公開前は状態だけ案内しています。',
  }
}

export function getLandingCopy(locale: LandingLocale): LandingCopy {
  if (locale === 'en') {
    const screens = LANDING_SCREENSHOTS.en

    return {
      locale: 'en',
      path: '/en',
      title: 'A simple iPhone app for promises and shared days',
      description: 'Pairlog is an iPhone app for couples to keep promises, gratitude, calendar history, and rewards in one simple place. App Store release coming soon.',
      keywords: ['couple app', 'relationship tracker', 'gratitude app', 'promise tracker', 'shared rewards', 'partner app', 'iPhone app for couples'],
      languageSwitchLabel: '日本語',
      languageSwitchHref: '/',
      navLabel: 'Pairlog',
      hero: {
        eyebrow: 'A simple app for two',
        title: 'One place for promises and shared days.',
        lead: 'Keep promises, gratitude, and your weekly view together.',
        body: '',
        status: 'App Store review in progress',
        availabilityNote: 'iPhone launch coming soon.',
        secondaryCta: 'See the screens',
        secondaryHref: '#showcase',
        screenshot: screens.home,
        screenshotAlt: 'Pairlog home screen',
      },
      showcase: {
        eyebrow: 'Screens',
        title: 'What each screen is for',
        description: 'Separate screens, short actions, and a clear place to look.',
        items: [
          {
            eyebrow: 'Start here',
            title: 'Home',
            description: 'See today’s promises and recent logs first.',
            highlights: ['Today', 'Points'],
            tone: 'rose',
            screenshot: screens.home,
          },
          {
            eyebrow: 'Keep promises visible',
            title: 'Promises',
            description: 'A simple list of what you agreed on.',
            highlights: ['Shared list', 'Status'],
            tone: 'sky',
            screenshot: screens.promises,
          },
          {
            eyebrow: 'See the week',
            title: 'Calendar',
            description: 'Look back by date instead of memory.',
            highlights: ['Dates', 'Weekly flow'],
            tone: 'orange',
            screenshot: screens.calendar,
          },
          {
            eyebrow: 'Small motivation',
            title: 'Rewards',
            description: 'Turn steady logging into something fun.',
            highlights: ['Points', 'Rewards'],
            tone: 'cream',
            screenshot: screens.rewards,
          },
        ],
      },
      faqTitle: 'Questions',
      faqs: [
        { question: 'Is Pairlog free?', answer: 'Yes. It is planned as a free iPhone app.' },
        { question: 'Is it live already?', answer: 'Not yet. It is still in App Store review.' },
        { question: 'Can I start alone?', answer: 'Yes. You can invite your partner later.' },
        { question: 'Is Android supported?', answer: 'No. The current launch is iPhone only.' },
      ],
      footerPrivacy: 'Privacy Policy',
    }
  }

  const screens = LANDING_SCREENSHOTS.ja

  return {
    locale: 'ja',
    path: '/',
    title: 'ふたりの記録を、ひとつにするiPhoneアプリ',
    description: 'Pairlog は、約束、ありがとう、カレンダー、ごほうびをひとつにまとめて見返せる、カップル・夫婦向けのiPhoneアプリです。App Store 公開準備中。',
    keywords: ['カップルアプリ', '夫婦アプリ', '約束アプリ', 'ありがとう 記録', '関係改善 アプリ', 'ペアアプリ', 'iPhoneアプリ'],
    languageSwitchLabel: 'English',
    languageSwitchHref: '/en',
    navLabel: 'Pairlog',
    hero: {
      eyebrow: 'ふたりで使う記録アプリ',
      title: 'ふたりの記録を、ひとつに。',
      lead: '約束、ありがとう、カレンダーを同じ場所で見返せます。',
      body: '',
      status: 'App Store 審査中',
      availabilityNote: 'iPhone向けに公開準備中です。',
      secondaryCta: '画面を見る',
      secondaryHref: '#showcase',
      screenshot: screens.home,
      screenshotAlt: 'Pairlog ホーム画面',
    },
    showcase: {
      eyebrow: '画面',
      title: '各画面でできること',
      description: '役割を分けているので、どこを見ればいいか迷いません。',
      items: [
        {
          eyebrow: '最初に見る',
          title: 'ホーム',
          description: '今日の約束と最近の記録がすぐ見えます。',
          highlights: ['今日の約束', 'ポイント'],
          tone: 'rose',
          screenshot: screens.home,
        },
        {
          eyebrow: '決めたことを残す',
          title: '約束',
          description: 'ふたりで決めたことを一覧で確認できます。',
          highlights: ['約束一覧', '進み具合'],
          tone: 'sky',
          screenshot: screens.promises,
        },
        {
          eyebrow: '今週をひと目で',
          title: 'カレンダー',
          description: 'いつ何があったかを日付で追えます。',
          highlights: ['日付', '週の流れ'],
          tone: 'orange',
          screenshot: screens.calendar,
        },
        {
          eyebrow: '続けるきっかけ',
          title: 'ごほうび',
          description: 'たまった記録を次の楽しみにつなげます。',
          highlights: ['ポイント', 'ごほうび'],
          tone: 'cream',
          screenshot: screens.rewards,
        },
      ],
    },
    faqTitle: 'よくある質問',
    faqs: [
      { question: '無料ですか？', answer: 'はい。iPhone向けに無料で始められる想定です。' },
      { question: 'もう公開されていますか？', answer: 'まだです。現在は App Store 審査中です。' },
      { question: 'ひとりでも始められますか？', answer: 'はい。あとから招待リンクでつなげられます。' },
      { question: 'Android はありますか？', answer: '現時点の公開対象は iPhone です。' },
    ],
    footerPrivacy: 'プライバシーポリシー',
  }
}

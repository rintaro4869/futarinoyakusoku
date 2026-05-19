import type { Metadata } from 'next'

export const SITE_URL = 'https://pairlog.pages.dev'

export const APP_STORE = {
  url: 'https://apps.apple.com/app/id6760982290',
  status: 'live' as 'live' | 'in_review',
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
    diary: '/marketing/screens/ja-diary.png',
  },
  en: {
    home: '/marketing/screens/en-home.png',
    promises: '/marketing/screens/en-promises.png',
    calendar: '/marketing/screens/en-calendar.png',
    rewards: '/marketing/screens/en-rewards.png',
    diary: '/marketing/screens/en-diary.png',
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
    title: {
      absolute: copy.title,
    },
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
      title: copy.title,
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
      title: copy.title,
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
          badge: 'App Store 公開中',
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
    title:
      APP_STORE.status === 'live'
        ? locale === 'ja'
          ? 'App Store でダウンロード'
          : 'Download on the App Store'
        : locale === 'ja'
          ? 'App Store 公開状況'
          : 'App Store release status',
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
      title:
        APP_STORE.status === 'live'
          ? locale === 'ja'
            ? 'App Store でダウンロード'
            : 'Download on the App Store'
          : locale === 'ja'
            ? 'App Store 公開状況'
            : 'App Store release status',
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
      title:
        APP_STORE.status === 'live'
          ? locale === 'ja'
            ? 'App Store でダウンロード'
            : 'Download on the App Store'
          : locale === 'ja'
            ? 'App Store 公開状況'
            : 'App Store release status',
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
    if (APP_STORE.status === 'live') {
      return {
        path: '/en/download',
        title: 'Download on the App Store',
        description: 'Pairlog is now live on the App Store for iPhone.',
        statusTitle: 'Pairlog is live now',
        statusBody: 'Use the button below to open the App Store listing.',
        points: ['Platform: iPhone', 'Free to start'],
        footerNote: 'This button opens the App Store listing.',
      }
    }

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

  if (APP_STORE.status === 'live') {
    return {
      path: '/download',
      title: 'App Store でダウンロード',
      description: 'Pairlog は App Store で公開中です。iPhone でダウンロードできます。',
      statusTitle: 'Pairlog は公開中です',
      statusBody: '下のボタンからそのまま App Store を開けます。',
      points: ['公開対象: iPhone', '無料で開始'],
      footerNote: 'ボタンを押すと App Store に移動します。',
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
      title: 'Couple Diary App for Promises, Gratitude & Shared Records | Pairlog',
      description: 'Pairlog is a free iPhone app for couples. Keep a shared diary, track promises, log gratitude, and save relationship memories together in one place.',
      keywords: ['couple app', 'relationship tracker', 'couples diary app', 'shared diary app', 'couples record app', 'gratitude app', 'promise tracker', 'shared diary for couples', 'partner app', 'iPhone couple app', 'couple journal', 'shared diary app for couples', 'couple journal app', 'couples promise tracker', 'relationship diary app', 'couple memory app'],
      languageSwitchLabel: '日本語',
      languageSwitchHref: '/',
      navLabel: 'Pairlog',
      hero: {
        eyebrow: 'A simple app for two',
        title: 'A shared diary and promise tracker for couples.',
        lead: 'Keep promises, gratitude, and daily relationship records in one place.',
        body: 'Pairlog is a couples diary app for iPhone that combines a shared journal, promise tracking, gratitude logs, and relationship memories in one place.',
        status: 'Available on the App Store',
        availabilityNote: 'Now available on iPhone.',
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
          {
            eyebrow: 'Your story, written together',
            title: 'Diary',
            description: 'Write short notes about your day together. Build a timeline only the two of you can see.',
            highlights: ['Shared diary', 'Timeline'],
            tone: 'sky',
            screenshot: screens.diary,
          },
        ],
      },
      faqTitle: 'Questions',
      faqs: [
        { question: 'What is Pairlog?', answer: 'Pairlog is a free iPhone app for couples. Track promises, write a shared diary, log gratitude, view your history on a calendar, and earn rewards together — all in one place.' },
        { question: 'Does Pairlog have a shared diary?', answer: 'Yes. The Diary screen lets both partners write short notes about your days together. Your entries build a private timeline only the two of you can read.' },
        { question: 'How do two people use the same app?', answer: 'One person creates an account and shares an invite link. The other opens the link and connects instantly. No complicated setup needed.' },
        { question: 'Can I use it to track promises and commitments?', answer: 'Yes. The Promises screen lets you list and manage what you agreed on together, with optional recurring reminders.' },
        { question: 'Can I record gratitude or kind gestures?', answer: 'Yes. The thank-you feature lets you log what your partner did, add a note, and assign points — so small moments are not forgotten.' },
        { question: 'Is Pairlog free?', answer: 'Yes. It is free to download and start on iPhone.' },
        { question: 'Can I start alone?', answer: 'Yes. You can invite your partner later using a link.' },
        { question: 'Does it work for long-distance couples?', answer: 'Yes. Your data syncs in real time over the internet, so you and your partner always see the same records no matter where you are.' },
        { question: 'Is Android supported?', answer: 'No. The current launch is iPhone only.' },
      ],
      footerPrivacy: 'Privacy Policy',
    }
  }

  const screens = LANDING_SCREENSHOTS.ja

  return {
    locale: 'ja',
    path: '/',
    title: 'カップル日記アプリ Pairlog｜同棲・夫婦で使える共有日記・約束管理アプリ',
    description:
      '同棲・夫婦向けの無料iPhoneアプリ。共有日記、約束管理、ありがとうの記録をひとつに。LINEやメモに流れがちなふたりの記録を、ふたりだけの場所に残せます。App Storeで無料ダウンロード。',
    keywords: [
      'カップルアプリ',
      '夫婦アプリ',
      '夫婦 共有アプリ',
      '同棲 アプリ',
      '同棲 カップル アプリ',
      'カップル日記アプリ',
      '共有日記アプリ',
      '共有メモ アプリ',
      'カップル 共有メモ',
      'カップル日記',
      'ふたり日記アプリ',
      'カップル 記録',
      'ふたり 記録',
      '約束 管理 アプリ',
      'ありがとう 記録',
      'カップル iPhoneアプリ',
      'ペアアプリ',
      '恋人 記録アプリ',
      '二人 日記',
    ],
    languageSwitchLabel: 'English',
    languageSwitchHref: '/en',
    navLabel: 'Pairlog',
    hero: {
      eyebrow: 'カップル日記アプリ',
      title: '同棲・夫婦で使えるカップル日記アプリ。ふたりの日記と約束を、ひとつに。',
      lead: '共有日記、約束、ありがとう、カレンダーを、ふたりで同じ場所に残せます。',
      body: 'カップル日記アプリ、共有日記アプリ、同棲アプリ、夫婦で使える共有アプリを探している人向けに、日記・約束・ありがとう・カレンダーを分けて続けやすくした無料の iPhone アプリです。',
      status: 'App Store 公開中',
      availabilityNote: 'iPhoneでダウンロードできます。',
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
        {
          eyebrow: 'ふたりだけの物語',
          title: '日記',
          description: 'その日あったことをふたりで書き残せます。読み返すたびに、一緒に過ごした時間が蘇ります。',
          highlights: ['ふたりの日記', 'タイムライン'],
          tone: 'sky',
          screenshot: screens.diary,
        },
      ],
    },
    faqTitle: 'よくある質問',
    faqs: [
      { question: 'カップルにおすすめの記録アプリはありますか？', answer: 'Pairlog はカップル・夫婦向けの無料iPhoneアプリです。ふたりの日記・約束の管理・ありがとうの記録・カレンダー・ごほうびをひとつにまとめています。ふたりで同じアプリを使うことで、大切なことを共有しながら記録できます。' },
      { question: 'カップルで使える日記アプリを探しています', answer: 'Pairlog の「日記」機能では、ふたりそれぞれがその日あったことを書き残せます。投稿はふたりだけが読めるタイムラインに並び、過去の思い出をいつでも見返せます。' },
      { question: '同棲カップル向けのアプリを探しています', answer: 'Pairlog は、家事だけでなく生活ルールやふたりの約束も残せる無料のiPhoneアプリです。同棲で起きやすい「言ったつもり」「伝わっているつもり」を減らしたい人に向いています。' },
      { question: '夫婦で使える共有アプリはありますか？', answer: 'はい。Pairlog は夫婦で共有したい日記、約束、ありがとうの記録をひとつにまとめられます。予定共有だけでは足りない家庭の記録を、ふたりで見返しやすい形にできます。' },
      { question: '共有メモアプリの代わりに使えますか？', answer: 'はい。Pairlog は共有メモのように何でも一枚に書く形ではなく、約束・日記・ありがとうを分けて残せます。LINEや共有メモで流れやすい内容を、ふたりで見返しやすく整理できます。' },
      { question: 'ふたりで同じアプリを使うにはどうすればいいですか？', answer: '片方がアプリを起動して招待リンクを発行し、もう片方がそのリンクからアプリを開くだけでペアリングが完了します。リンクを送り合うだけなので簡単です。' },
      { question: '約束を管理できるアプリを探しています', answer: 'Pairlog の「約束」機能では、ふたりで決めたことを一覧で記録・管理できます。曜日ごとの繰り返し設定やリマインダー機能もあり、忘れずに続けられます。' },
      { question: 'ありがとうの気持ちを記録できますか？', answer: 'はい。「ありがとう」機能では、相手にしてもらったことをタイトルとメモで記録できます。ポイントもたまるので、小さな感謝を積み重ねるきっかけになります。' },
      { question: '無料ですか？', answer: 'はい。iPhoneで無料でダウンロードできます。' },
      { question: 'ひとりでも始められますか？', answer: 'はい。あとから招待リンクでパートナーをつなげられます。まず自分だけで使い始めることもできます。' },
      { question: '遠距離カップルでも使えますか？', answer: 'はい。インターネットを通じてふたりのデータを同期しているので、離れていても同じ記録をリアルタイムで共有できます。' },
      { question: 'Android はありますか？', answer: '現時点の公開対象は iPhone のみです。' },
    ],
    footerPrivacy: 'プライバシーポリシー',
  }
}

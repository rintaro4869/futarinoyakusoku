'use client'

import { useEffect, useState } from 'react'

type Lang = 'ja' | 'en' | 'ko' | 'zh-Hant' | 'zh-Hans'

const LANG_LABELS: Record<Lang, string> = {
  ja: '日本語',
  en: 'English',
  ko: '한국어',
  'zh-Hant': '繁體中文',
  'zh-Hans': '简体中文',
}

const CONTENT: Record<Lang, {
  pageTitle: string
  title: string
  intro: string
  sections: { title: string; body: string[] }[]
}> = {
  ja: {
    pageTitle: 'プライバシーポリシー | Pairlog',
    title: 'プライバシーポリシー',
    intro: 'Pairlog は、ふたりの約束を安心して記録できることを大切にしています。このページでは、アプリ内で扱う情報と、その使い方をわかりやすくまとめています。',
    sections: [
      {
        title: '1. 取得する情報',
        body: [
          'Pairlog では、アカウント利用に必要なメールアドレス、パスワード、約束の内容、記録、ポイント情報を扱います。',
          '通知を有効にした場合は、リマインドのための通知設定も利用します。',
        ],
      },
      {
        title: '2. 利用目的',
        body: [
          'ふたりの約束を記録し、達成状況やごほうびの進み具合を表示するために使います。',
          'パスワード再設定、障害対応、安全機能の提供にも利用します。',
        ],
      },
      {
        title: '3. 保管と共有',
        body: [
          'データは Pairlog の提供に必要な範囲で保存され、第三者へ販売しません。',
          'メール送信やインフラ運用に必要な外部サービスを利用する場合があります。',
        ],
      },
      {
        title: '4. データ削除',
        body: [
          'アプリ内の「設定」から、アカウント、共有記録、ペア情報を削除できます。',
          '削除後はログインやパスワード再設定に使う情報も無効になります。',
        ],
      },
      {
        title: '5. お問い合わせ',
        body: [
          'プライバシーに関するお問い合わせは、アプリ配信ページまたは案内済みの連絡先からご連絡ください。',
        ],
      },
    ],
  },

  en: {
    pageTitle: 'Privacy Policy | Pairlog',
    title: 'Privacy Policy',
    intro: 'Pairlog is committed to keeping your shared memories safe. This page explains what information the app handles and how it is used.',
    sections: [
      {
        title: '1. Information We Collect',
        body: [
          'Pairlog handles your email address, password, promise records, logs, and point information needed to use the app.',
          'If you enable notifications, we also use notification settings to send reminders.',
        ],
      },
      {
        title: '2. How We Use Your Information',
        body: [
          'To record your promises and display progress and reward status.',
          'For password resets, incident response, and providing safety features.',
        ],
      },
      {
        title: '3. Storage & Sharing',
        body: [
          'Data is stored only as necessary to provide Pairlog and is never sold to third parties.',
          'We may use external services for email delivery and infrastructure operation.',
        ],
      },
      {
        title: '4. Data Deletion',
        body: [
          'You can delete your account, shared records, and pair information from "Settings" in the app.',
          'After deletion, information used for login and password resets will also be invalidated.',
        ],
      },
      {
        title: '5. Contact',
        body: [
          'For privacy-related inquiries, please contact us through the app\'s distribution page or the contact information provided.',
        ],
      },
    ],
  },

  ko: {
    pageTitle: '개인정보 처리방침 | Pairlog',
    title: '개인정보 처리방침',
    intro: 'Pairlog는 두 사람의 소중한 기록을 안전하게 보관하는 것을 중요하게 생각합니다. 이 페이지에서는 앱에서 다루는 정보와 그 사용 방법을 안내합니다.',
    sections: [
      {
        title: '1. 수집하는 정보',
        body: [
          'Pairlog는 계정 이용에 필요한 이메일 주소, 비밀번호, 약속 내용, 기록, 포인트 정보를 처리합니다.',
          '알림을 활성화한 경우, 리마인드를 위한 알림 설정도 이용합니다.',
        ],
      },
      {
        title: '2. 이용 목적',
        body: [
          '두 사람의 약속을 기록하고 달성 현황 및 보상 진행 상황을 표시하기 위해 사용합니다.',
          '비밀번호 재설정, 장애 대응, 안전 기능 제공에도 이용합니다.',
        ],
      },
      {
        title: '3. 보관 및 공유',
        body: [
          '데이터는 Pairlog 제공에 필요한 범위 내에서 보관되며, 제3자에게 판매하지 않습니다.',
          '이메일 발송 및 인프라 운영에 필요한 외부 서비스를 이용할 수 있습니다.',
        ],
      },
      {
        title: '4. 데이터 삭제',
        body: [
          '앱 내 「설정」에서 계정, 공유 기록, 페어 정보를 삭제할 수 있습니다.',
          '삭제 후에는 로그인 및 비밀번호 재설정에 사용되는 정보도 무효화됩니다.',
        ],
      },
      {
        title: '5. 문의',
        body: [
          '개인정보와 관련된 문의는 앱 배포 페이지 또는 안내된 연락처로 문의해 주세요.',
        ],
      },
    ],
  },

  'zh-Hant': {
    pageTitle: '隱私權政策 | Pairlog',
    title: '隱私權政策',
    intro: 'Pairlog 致力於安全地保存兩人的記錄。本頁面說明應用程式處理的資訊及其使用方式。',
    sections: [
      {
        title: '1. 收集的資訊',
        body: [
          'Pairlog 處理帳戶使用所需的電子郵件地址、密碼、約定內容、記錄及點數資訊。',
          '若您啟用通知，也會使用通知設定來傳送提醒。',
        ],
      },
      {
        title: '2. 使用目的',
        body: [
          '用於記錄兩人的約定，並顯示達成狀況及獎勵進度。',
          '也用於密碼重設、事故處理及安全功能的提供。',
        ],
      },
      {
        title: '3. 儲存與分享',
        body: [
          '資料僅在提供 Pairlog 所需的範圍內儲存，不會出售給第三方。',
          '可能使用外部服務來進行電子郵件傳送及基礎設施運營。',
        ],
      },
      {
        title: '4. 資料刪除',
        body: [
          '您可以在應用程式內的「設定」中刪除帳戶、共享記錄及配對資訊。',
          '刪除後，用於登入及密碼重設的資訊也將失效。',
        ],
      },
      {
        title: '5. 聯絡方式',
        body: [
          '如有隱私相關問題，請透過應用程式發布頁面或已提供的聯絡資訊與我們聯繫。',
        ],
      },
    ],
  },

  'zh-Hans': {
    pageTitle: '隐私政策 | Pairlog',
    title: '隐私政策',
    intro: 'Pairlog 致力于安全地保存两人的记录。本页面说明应用程序处理的信息及其使用方式。',
    sections: [
      {
        title: '1. 收集的信息',
        body: [
          'Pairlog 处理账户使用所需的电子邮件地址、密码、约定内容、记录及积分信息。',
          '若您启用通知，也会使用通知设置来发送提醒。',
        ],
      },
      {
        title: '2. 使用目的',
        body: [
          '用于记录两人的约定，并显示达成状况及奖励进度。',
          '也用于密码重置、故障处理及安全功能的提供。',
        ],
      },
      {
        title: '3. 存储与共享',
        body: [
          '数据仅在提供 Pairlog 所需的范围内存储，不会出售给第三方。',
          '可能使用外部服务来进行电子邮件发送及基础设施运营。',
        ],
      },
      {
        title: '4. 数据删除',
        body: [
          '您可以在应用程序内的「设置」中删除账户、共享记录及配对信息。',
          '删除后，用于登录及密码重置的信息也将失效。',
        ],
      },
      {
        title: '5. 联系方式',
        body: [
          '如有隐私相关问题，请通过应用程序发布页面或已提供的联系方式与我们联系。',
        ],
      },
    ],
  },
}

function detectLang(): Lang {
  if (typeof navigator === 'undefined') return 'ja'
  const lang = navigator.language.toLowerCase()
  if (lang.startsWith('ko')) return 'ko'
  if (lang.startsWith('zh')) {
    if (lang.includes('hant') || lang.includes('tw') || lang.includes('hk') || lang.includes('mo')) return 'zh-Hant'
    return 'zh-Hans'
  }
  if (lang.startsWith('en')) return 'en'
  return 'ja'
}

export default function PrivacyPage() {
  const [lang, setLang] = useState<Lang>('ja')

  useEffect(() => {
    setLang(detectLang())
  }, [])

  const c = CONTENT[lang]

  return (
    <main className="min-h-screen bg-[#fff7fb] px-5 py-10">
      <div className="mx-auto max-w-2xl rounded-[28px] border border-[#f3d7e5] bg-white px-6 py-8 shadow-sm">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-[#d45b8b]">Pairlog</p>
        <h1 className="mb-4 text-3xl font-black tracking-tight text-[#2f2330]">{c.title}</h1>

        {/* Language selector */}
        <div className="mb-6 flex flex-wrap gap-2">
          {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                lang === l
                  ? 'bg-[#d45b8b] text-white'
                  : 'bg-[#fce7f3] text-[#d45b8b] hover:bg-[#f8d0e5]'
              }`}
            >
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>

        <p className="mb-8 text-sm leading-7 text-[#6b5a68]">{c.intro}</p>

        <div className="space-y-5">
          {c.sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-[#f4e4ec] bg-[#fffafb] p-5">
              <h2 className="mb-3 text-base font-bold text-[#2f2330]">{section.title}</h2>
              <div className="space-y-3 text-sm leading-7 text-[#5f5260]">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}

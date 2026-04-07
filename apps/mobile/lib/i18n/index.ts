// ─── i18n ────────────────────────────────────────────────────
// 軽量な多言語対応の仕組み。
// 現時点ではデバイスのロケールに基づいて
// ja / en / ko / zh-Hant / zh-Hans を自動選択する。
// 将来は設定画面から切り替えられるようにする想定。

import { ja, TranslationKeys } from './ja'
import { en } from './en'
import { ko } from './ko'
import { zhHant } from './zhHant'
import { zhHans } from './zhHans'
import { getLocales } from 'expo-localization'

type Locale = 'ja' | 'en' | 'ko' | 'zh-Hant' | 'zh-Hans'

const dictionaries: Record<Locale, TranslationKeys> = {
  ja,
  en,
  ko,
  'zh-Hant': zhHant,
  'zh-Hans': zhHans,
}

const localeTags: Record<Locale, string> = {
  ja: 'ja-JP',
  en: 'en-US',
  ko: 'ko-KR',
  'zh-Hant': 'zh-Hant-TW',
  'zh-Hans': 'zh-Hans-CN',
}

// ─── デバイスのロケールを取得 ────────────────────────────────
function getDeviceLocale(): Locale {
  try {
    const locales = getLocales()
    const primary = locales[0]
    const lang = primary?.languageCode?.toLowerCase() ?? 'ja'
    const script = primary?.languageScriptCode?.toLowerCase() ?? ''
    const region = primary?.regionCode?.toLowerCase() ?? ''
    const tag = primary?.languageTag?.toLowerCase() ?? ''

    if (lang === 'en') return 'en'
    if (lang === 'ko') return 'ko'
    if (lang === 'zh') {
      if (
        script === 'hant' ||
        tag.includes('hant') ||
        region === 'tw' ||
        region === 'hk' ||
        region === 'mo'
      ) {
        return 'zh-Hant'
      }
      if (
        script === 'hans' ||
        tag.includes('hans') ||
        region === 'cn' ||
        region === 'sg'
      ) {
        return 'zh-Hans'
      }
      return 'zh-Hans'
    }

    return 'ja'
  } catch {
    return 'ja'
  }
}

let currentLocale: Locale = getDeviceLocale()

// ─── ロケール操作 ────────────────────────────────────────────
export function setLocale(locale: Locale) {
  currentLocale = locale
}

export function getLocale(): Locale {
  return currentLocale
}

export function getLocaleTag(): string {
  return localeTags[currentLocale] ?? localeTags.ja
}

// ─── 翻訳取得 ────────────────────────────────────────────────
// t() でネストしたキーを '.' 区切りで取得できる
// 例: t('home.title') → 'ホーム'
// 例: t('points.remaining', { n: 5 }) → 'あと 5pt'

export function t(key: string, params?: Record<string, string | number>): string {
  const dict = dictionaries[currentLocale] ?? dictionaries.ja
  const keys = key.split('.')
  let value: any = dict
  for (const k of keys) {
    value = value?.[k]
    if (value === undefined) break
  }

  if (typeof value !== 'string') {
    // fallback to Japanese
    value = dictionaries.ja as any
    for (const k of keys) {
      value = value?.[k]
      if (value === undefined) break
    }
  }

  if (typeof value !== 'string') {
    return key // key自体を返す（辞書漏れ検出用）
  }

  // テンプレート変数の展開: {n}, {title}, {date} など
  if (params) {
    return value.replace(/\{(\w+)\}/g, (_, name) => {
      const v = params[name]
      return v !== undefined ? String(v) : `{${name}}`
    })
  }

  return value
}

// ─── React Hook ──────────────────────────────────────────────
// コンポーネント内で使う場合: const { t } = useI18n()
// ※ 現時点ではシングルトンなので re-render は不要
export function useI18n() {
  return { t, locale: currentLocale, setLocale }
}

// Re-export
export { ja } from './ja'
export { en } from './en'
export { ko } from './ko'
export { zhHant } from './zhHant'
export { zhHans } from './zhHans'
export type { TranslationKeys } from './ja'

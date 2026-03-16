// ja-JP.json を唯一のソースにする
import copy from '../../public/locales/ja-JP.json'

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export function t(key: string): string {
  const keys = key.split('.')
  let current: unknown = copy
  for (const k of keys) {
    if (typeof current !== 'object' || current === null) return key
    current = (current as Record<string, unknown>)[k]
  }
  return typeof current === 'string' ? current : key
}

export { copy as messages }

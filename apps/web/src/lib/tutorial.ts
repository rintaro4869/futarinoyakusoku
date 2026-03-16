const TUTORIAL_KEY = 'fny_tutorial_seen_v1'

export function hasSeenTutorial(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(TUTORIAL_KEY) === '1'
}

export function markTutorialSeen(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TUTORIAL_KEY, '1')
}

export function resetTutorial(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TUTORIAL_KEY)
}

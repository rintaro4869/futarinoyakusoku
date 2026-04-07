import * as SecureStore from 'expo-secure-store'

const KEY_TOKEN = 'fny_token'
const KEY_USER_ID = 'fny_user_id'
const KEY_COUPLE_ID = 'fny_couple_id'
const KEY_TUTORIAL_SEEN = 'fny_tutorial_seen'
const KEY_PAIRING_DEFERRED = 'fny_pairing_deferred'

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY_TOKEN)
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEY_TOKEN, token)
}

export async function getUserId(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY_USER_ID)
}

export async function setUserId(id: string): Promise<void> {
  await SecureStore.setItemAsync(KEY_USER_ID, id)
}

export async function getCoupleId(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY_COUPLE_ID)
}

export async function setCoupleId(id: string | null): Promise<void> {
  if (id) {
    await SecureStore.setItemAsync(KEY_COUPLE_ID, id)
  } else {
    await SecureStore.deleteItemAsync(KEY_COUPLE_ID)
  }
}

export async function getTutorialSeen(): Promise<boolean> {
  const val = await SecureStore.getItemAsync(KEY_TUTORIAL_SEEN)
  return val === 'true'
}

export async function setTutorialSeen(): Promise<void> {
  await SecureStore.setItemAsync(KEY_TUTORIAL_SEEN, 'true')
}

export async function getPairingDeferred(): Promise<boolean> {
  const val = await SecureStore.getItemAsync(KEY_PAIRING_DEFERRED)
  return val === 'true'
}

export async function setPairingDeferred(deferred: boolean): Promise<void> {
  if (deferred) {
    await SecureStore.setItemAsync(KEY_PAIRING_DEFERRED, 'true')
  } else {
    await SecureStore.deleteItemAsync(KEY_PAIRING_DEFERRED)
  }
}

const KEY_INVITE_CODE = 'fny_invite_code'
const KEY_INVITE_URL = 'fny_invite_url'

export async function getInviteCode(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY_INVITE_CODE)
}

export async function getInviteUrl(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY_INVITE_URL)
}

export async function setInviteInfo(code: string, url: string): Promise<void> {
  await SecureStore.setItemAsync(KEY_INVITE_CODE, code)
  await SecureStore.setItemAsync(KEY_INVITE_URL, url)
}

export async function clearInviteInfo(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY_INVITE_CODE)
  await SecureStore.deleteItemAsync(KEY_INVITE_URL)
}

// ─── Rewards ────────────────────────────────────────────────
const KEY_REWARDS = 'fny_rewards'
const KEY_REWARD_UNLOCK_SEEN = 'fny_reward_unlock_seen'

export type StoredReward = {
  id: string
  name: string
  pointsRequired: number
  pointType: 'promise' | 'thankyou' | 'total'
  assignee?: 'self' | 'partner' | 'both'
  baselinePoints?: {
    promise: number
    thankyou: number
    total: number
  }
  status: 'locked' | 'unlocked' | 'used'
  createdAt: string
  usedAt?: string
}

export async function getRewards(): Promise<StoredReward[]> {
  const raw = await SecureStore.getItemAsync(KEY_REWARDS)
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

export async function setRewards(rewards: StoredReward[]): Promise<void> {
  await SecureStore.setItemAsync(KEY_REWARDS, JSON.stringify(rewards))
}

export async function getSeenRewardUnlocks(): Promise<string[]> {
  const raw = await SecureStore.getItemAsync(KEY_REWARD_UNLOCK_SEEN)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

export async function markRewardUnlockSeen(rewardId: string): Promise<void> {
  const current = await getSeenRewardUnlocks()
  if (current.includes(rewardId)) return
  await SecureStore.setItemAsync(KEY_REWARD_UNLOCK_SEEN, JSON.stringify([...current, rewardId]))
}

export async function clearRewardUnlockSeen(rewardId: string): Promise<void> {
  const current = await getSeenRewardUnlocks()
  await SecureStore.setItemAsync(
    KEY_REWARD_UNLOCK_SEEN,
    JSON.stringify(current.filter((item) => item !== rewardId))
  )
}

export async function clearAll(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY_TOKEN)
  await SecureStore.deleteItemAsync(KEY_USER_ID)
  await SecureStore.deleteItemAsync(KEY_COUPLE_ID)
  await SecureStore.deleteItemAsync(KEY_PAIRING_DEFERRED)
  await SecureStore.deleteItemAsync(KEY_INVITE_CODE)
  await SecureStore.deleteItemAsync(KEY_INVITE_URL)
  await SecureStore.deleteItemAsync(KEY_REWARDS)
  await SecureStore.deleteItemAsync(KEY_REWARD_UNLOCK_SEEN)
}

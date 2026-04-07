import { create } from 'zustand'
import { getToken, setToken as persistToken, getUserId, setUserId as persistUserId, getCoupleId, setCoupleId as persistCoupleId, clearAll as storageClearAll } from './storage'

interface AuthState {
  token: string | null
  userId: string | null
  coupleId: string | null
  hydrated: boolean

  setAuth: (token: string, userId: string) => Promise<void>
  setCoupleId: (id: string | null) => Promise<void>
  clearAuth: () => Promise<void>
  hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  coupleId: null,
  hydrated: false,

  setAuth: async (token: string, userId: string) => {
    await persistToken(token)
    await persistUserId(userId)
    set({ token, userId })
  },

  setCoupleId: async (id: string | null) => {
    await persistCoupleId(id)
    set({ coupleId: id })
  },

  clearAuth: async () => {
    await storageClearAll()
    set({ token: null, userId: null, coupleId: null })
  },

  hydrate: async () => {
    const [token, userId, coupleId] = await Promise.all([
      getToken(),
      getUserId(),
      getCoupleId(),
    ])
    set({ token, userId, coupleId, hydrated: true })
  },
}))

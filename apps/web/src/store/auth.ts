import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile } from '@ribera/types'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'

interface AuthState {
  user: Profile | null
  loading: boolean
  setUser: (user: Profile | null) => void
  signOut: () => Promise<void>
  syncProfile: (data?: Partial<Profile>) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: true,
      setUser: (user) => set({ user, loading: false }),
      signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null })
      },
      syncProfile: async (data) => {
        try {
          const res = await api.post('/auth/sync-profile', data)
          set({ user: res.data.data, loading: false })
        } catch {
          set({ loading: false })
        }
      },
    }),
    { name: 'ribera-auth', partialize: (s) => ({ user: s.user }) }
  )
)

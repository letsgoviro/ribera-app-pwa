'use client'

import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
})

export function Providers({ children }: { children: React.ReactNode }) {
  const { setUser, syncProfile } = useAuthStore()

  useEffect(() => {
    // Sync auth state on mount
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) syncProfile()
      else setUser(null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        syncProfile()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [setUser, syncProfile])

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

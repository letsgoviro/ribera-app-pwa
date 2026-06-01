'use client'

import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@/lib/api'
import { useRouter, usePathname } from 'next/navigation'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

const PUBLIC_PATHS = ['/login', '/apply']

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  // One-time initial auth check on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
      if (!data.session && !isPublic) {
        router.replace('/login')
      } else {
        setReady(true)
      }
    })

    // Sign-out listener only — we do NOT rely on authed state to avoid race conditions
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') router.replace('/login')
      if (event === 'SIGNED_IN') setReady(true)
    })
    return () => listener.subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Guard protected routes on each navigation by re-checking session
  useEffect(() => {
    if (!ready) return
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
    if (isPublic) return
    // Re-check session on every protected navigation to catch stale state
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/login')
    })
  }, [pathname, ready, router])

  if (!ready) {
    return (
      <div className="min-h-dvh bg-surface-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

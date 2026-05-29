'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import { Loader2 } from 'lucide-react'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      // PKCE flow: exchange `code` param for session
      const code = searchParams.get('code')
      const next = searchParams.get('next') ?? '/'
      const errorParam = searchParams.get('error')

      if (errorParam) {
        router.replace(`/auth?error=${encodeURIComponent(searchParams.get('error_description') ?? errorParam)}`)
        return
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          console.error('OAuth exchange error:', error.message)
          router.replace('/auth?error=auth_failed')
          return
        }
      }

      // Check session (covers implicit flow via URL fragment too)
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        // Sync profile to our DB (Google users may not have a profile yet)
        try {
          const meta = data.session.user.user_metadata ?? {}
          await api.post('/auth/sync-profile', {
            display_name: meta['full_name'] ?? meta['name'] ?? null,
            phone: data.session.user.phone ?? null,
            avatar_url: meta['avatar_url'] ?? meta['picture'] ?? null,
          })
        } catch {
          // Profile may already exist — not fatal
        }
        router.replace(next)
      } else {
        router.replace('/auth')
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-dvh bg-surface-900 flex flex-col items-center justify-center gap-4">
      <img src="/logo.png" alt="Ribera" className="w-14 h-14 rounded-2xl" />
      <div className="flex items-center gap-2">
        <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
        <p className="text-gray-400 text-sm">Signing you in…</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-surface-900 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}

'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/api'
import { Loader2 } from 'lucide-react'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handle = async () => {
      const code = searchParams.get('code')
      const error = searchParams.get('error')

      if (error) {
        router.replace(`/login?error=${encodeURIComponent(searchParams.get('error_description') ?? error)}`)
        return
      }

      if (code) {
        await supabase.auth.exchangeCodeForSession(code)
      }

      const { data } = await supabase.auth.getSession()
      router.replace(data.session ? '/' : '/login')
    }

    handle()
  }, [router, searchParams])

  return (
    <div className="min-h-dvh bg-surface-900 flex flex-col items-center justify-center gap-4">
      <img src="/logo.png" alt="Ribera" className="w-14 h-14 rounded-2xl" />
      <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
      <p className="text-gray-400 text-sm">Signing you in…</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-surface-900 flex items-center justify-center"><Loader2 className="w-6 h-6 text-brand-500 animate-spin" /></div>}>
      <CallbackContent />
    </Suspense>
  )
}

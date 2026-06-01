'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LandingPage } from '@/components/landing/LandingPage'

export default function RootPage() {
  const router = useRouter()
  const [state, setState] = useState<'checking' | 'landing'>('checking')
  const [language, setLanguage] = useState<'en' | 'sw'>('en')

  useEffect(() => {
    async function check() {
      // Returning visitor or authenticated → go straight to app
      const hasVisited = localStorage.getItem('ribera_has_visited')
      const { data: { session } } = await supabase.auth.getSession()

      if (session || hasVisited) {
        router.replace('/app')
        return
      }

      // First-time visitor — show landing, mark as visited
      localStorage.setItem('ribera_has_visited', '1')
      setState('landing')
    }
    check()
  }, [router])

  if (state === 'checking') {
    return (
      <div className="min-h-dvh bg-surface-900 flex items-center justify-center">
        <img
          src="/logo.png"
          alt="Ribera"
          className="w-12 h-12 rounded-xl animate-pulse"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      </div>
    )
  }

  return (
    <LandingPage
      language={language}
      onLanguageChange={setLanguage}
      onEnterApp={() => router.push('/app')}
    />
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/api'
import { Loader2, ShieldAlert } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (authError || !data.user) {
      setError(authError?.message ?? 'Login failed')
      return
    }

    const role = data.user.user_metadata?.['role']
    if (role !== 'admin') {
      await supabase.auth.signOut()
      setError('Access denied — admin accounts only')
      return
    }

    router.replace('/')
  }

  return (
    <div className="min-h-dvh bg-surface-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <img src="/logo.png" alt="Ribera" className="w-14 h-14 rounded-2xl shadow-lg" />
          </div>
          <h1 className="text-2xl font-black text-brand-500">Ribera Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Restricted access — Ribera staff only</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ribera.app"
              required
              className="w-full bg-surface-800 border border-surface-600 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-surface-800 border border-surface-600 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-500 text-sm"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full bg-brand-500 text-white rounded-xl py-3.5 font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/api'
import { Mail, ChevronLeft, Loader2, Eye, EyeOff, CheckCircle, KeyRound } from 'lucide-react'

type Step = 'email' | 'forgot' | 'reset-sent'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const inputClass = 'w-full bg-surface-800 border border-surface-600 rounded-2xl px-4 py-3.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-500 transition-colors text-sm'

  const handleEmailSignIn = async () => {
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    router.replace('/')
  }

  const handleForgotPassword = async () => {
    const target = forgotEmail || email
    if (!target) { setError('Enter your email address first'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(target, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setStep('reset-sent')
  }

  return (
    <div className="min-h-dvh bg-surface-900 flex flex-col">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 via-transparent to-purple-600/10" />
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-brand-500/15 rounded-full blur-3xl" />
        <div className="relative px-6 pt-14 pb-8 text-center">
          <div className="flex justify-center mb-3">
            <img src="/logo.png" alt="Ribera" className="w-14 h-14 rounded-2xl shadow-lg" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Ribera</h1>
          <p className="text-gray-400 text-sm mt-1">Organiser Portal</p>
        </div>
      </div>

      <div className="flex-1 px-6 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">

          {/* Email + Password */}
          {step === 'email' && (
            <motion.div key="email" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-4">
              <p className="text-white font-bold text-xl mb-1">Welcome back</p>
              <p className="text-gray-500 text-sm mb-4">Sign in to manage your events</p>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailSignIn()}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                  <button
                    type="button"
                    onClick={() => { setForgotEmail(email); setStep('forgot'); setError('') }}
                    className="text-xs text-brand-500 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputClass + ' pr-11'}
                    onKeyDown={(e) => e.key === 'Enter' && handleEmailSignIn()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-xl px-3 py-2">{error}</p>}

              <button
                onClick={handleEmailSignIn}
                disabled={!email || !password || loading}
                className="w-full bg-brand-500 text-white rounded-2xl py-4 font-bold disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
              </button>

              <p className="text-center text-xs text-gray-600 pt-2">
                Not an organiser yet?{' '}
                <button onClick={() => router.push('/apply')} className="text-brand-500 font-medium">Apply to join →</button>
              </p>
            </motion.div>
          )}

          {/* Forgot password */}
          {step === 'forgot' && (
            <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <button onClick={() => { setStep('email'); setError('') }} className="flex items-center gap-1 text-gray-400 text-sm mb-2">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-brand-500/20 rounded-2xl flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-brand-500" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg leading-tight">Reset password</p>
                  <p className="text-gray-500 text-xs">We'll email you a reset link</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Email address</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword()}
                />
              </div>
              {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-xl px-3 py-2">{error}</p>}
              <button
                onClick={handleForgotPassword}
                disabled={!forgotEmail || loading}
                className="w-full bg-brand-500 text-white rounded-2xl py-4 font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
              </button>
            </motion.div>
          )}

          {/* Reset sent */}
          {step === 'reset-sent' && (
            <motion.div key="reset-sent" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-4">
              <div className="w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-3xl flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-white font-black text-xl mb-2">Check your inbox</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-2">We sent a password reset link to</p>
              <p className="text-white font-semibold text-sm mb-5">{forgotEmail || email}</p>
              <p className="text-gray-500 text-xs leading-relaxed mb-6">The link expires in 1 hour. Check your spam folder if you don't see it.</p>
              <button
                onClick={() => { setStep('email'); setError('') }}
                className="w-full bg-surface-800 border border-surface-600 text-white rounded-2xl py-3.5 font-semibold text-sm"
              >
                Back to Sign In
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <p className="text-center text-xs text-gray-700 px-8 py-6">
        Ribera Organiser Portal · Tanzania 🇹🇿
      </p>
    </div>
  )
}

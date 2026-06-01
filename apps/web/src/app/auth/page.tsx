'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import { Mail, ArrowRight, ChevronLeft, Loader2, Users, Star, Ticket, Eye, EyeOff, CheckCircle, KeyRound } from 'lucide-react'

type Step = 'method' | 'email' | 'verify' | 'forgot' | 'reset-sent'

const SOCIAL_PROOF = [
  { icon: Users, text: '10,000+ event-goers' },
  { icon: Ticket, text: '500+ events listed' },
  { icon: Star, text: '4.8 rated on Play Store' },
]

function AuthPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextUrl = searchParams.get('next') ?? '/'
  const errorParam = searchParams.get('error')
  const [step, setStep] = useState<Step>('method')
  // Show any error passed back from the OAuth callback
  const [initError] = useState(() => {
    if (errorParam === 'auth_failed') return 'Google sign-in failed. Try again or use email & password.'
    if (errorParam) return decodeURIComponent(errorParam)
    return ''
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState(initError)
  const [isSignUp, setIsSignUp] = useState(false)

  const handleEmailAuth = async () => {
    setLoading(true); setError('')
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      setLoading(false)
      if (error) { setError(error.message); return }
      // No session means email confirmation required
      if (!data.session) {
        setStep('verify')
        return
      }
      router.replace(nextUrl)
    } else {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (error) { setError(error.message); return }
      // Ensure profile row exists (may be missing for older accounts)
      if (signInData.session) {
        const meta = signInData.session.user.user_metadata ?? {}
        const name = meta['full_name'] ?? meta['name'] ?? null
        const avatar = meta['avatar_url'] ?? meta['picture'] ?? null
        api.post('/auth/sync-profile', { display_name: name, avatar_url: avatar }).catch(() => {})
      }
      router.replace(nextUrl)
    }
  }

  const handleForgotPassword = async () => {
    const target = forgotEmail || email
    if (!target) { setError('Enter your email address above'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(target, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setStep('reset-sent')
  }

  const handleGoogle = async () => {
    setGoogleLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
        queryParams: { prompt: 'select_account' },
      },
    })
    setGoogleLoading(false)
    if (error) {
      setError('Google sign-in failed. Try opening Ribera in your default browser, or use email & password instead.')
    }
  }

  const inputClass = 'w-full bg-surface-800 border border-surface-600 rounded-2xl px-4 py-3.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-500 transition-colors text-sm'

  return (
    <div className="min-h-dvh bg-surface-900 flex flex-col">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/30 via-brand-500/10 to-purple-600/20" />
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-600/20 rounded-full blur-2xl" />

        <div className="relative px-6 pt-14 pb-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="inline-flex items-center gap-1.5 bg-brand-500/20 border border-brand-500/30 rounded-full px-3 py-1 mb-4">
              <span className="text-xs font-bold text-brand-500">🇹🇿 Tanzania's #1</span>
            </div>
            <div className="flex justify-center mb-3">
              <img src="/logo.png" alt="Ribera" className="w-16 h-16 rounded-2xl shadow-lg" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-1">Ribera</h1>
            <p className="text-gray-400 text-sm">Discover & buy event tickets</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center gap-3 mt-5 flex-wrap"
          >
            {SOCIAL_PROOF.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                <Icon className="w-3 h-3 text-brand-500" />
                <span className="text-xs text-gray-300 font-medium">{text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Sign in / Sign up toggle — only on method step */}
      {step === 'method' && (
        <div className="px-6 mb-4">
          <div className="flex gap-1 bg-surface-800 border border-surface-600 rounded-2xl p-1">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${!isSignUp ? 'bg-brand-500 text-white' : 'text-gray-400'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${isSignUp ? 'bg-brand-500 text-white' : 'text-gray-400'}`}
            >
              Create Account
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 px-6">
        <AnimatePresence mode="wait">

          {/* Method select */}
          {step === 'method' && (
            <motion.div
              key="method"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-3"
            >
              {/* Google — primary CTA */}
              <button
                onClick={handleGoogle}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 rounded-2xl px-5 py-4 font-semibold text-sm hover:bg-gray-100 transition-all active:scale-[0.98] disabled:opacity-70"
              >
                {googleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Continue with Google
              </button>

              {error && (
                <p className="text-orange-400 text-xs bg-orange-500/10 rounded-xl px-3 py-2 text-center leading-relaxed">
                  {error}
                </p>
              )}

              <div className="relative flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-surface-600" />
                <span className="text-xs text-gray-600 font-medium">or</span>
                <div className="flex-1 h-px bg-surface-600" />
              </div>

              {/* Email option */}
              <button
                onClick={() => setStep('email')}
                className="w-full flex items-center gap-4 bg-surface-800 border border-surface-600 rounded-2xl px-5 py-4 hover:border-brand-500/50 transition-all active:scale-[0.98]"
              >
                <div className="w-10 h-10 bg-purple-500/15 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-white text-sm">Email & Password</p>
                  <p className="text-gray-500 text-xs">{isSignUp ? 'Create account with email' : 'Sign in with your email'}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500" />
              </button>

              {/* Guest / browse hint */}
              <button
                onClick={() => router.replace('/')}
                className="w-full text-center text-sm text-gray-600 py-2 hover:text-gray-400 transition-colors"
              >
                Browse events without signing in →
              </button>
            </motion.div>
          )}

          {/* Email step */}
          {step === 'email' && (
            <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <button onClick={() => { setStep('method'); setError('') }} className="flex items-center gap-1 text-gray-400 text-sm mb-2">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <p className="text-white font-bold text-lg">{isSignUp ? 'Create your account' : 'Welcome back'}</p>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => { setForgotEmail(email); setStep('forgot'); setError('') }}
                      className="text-xs text-brand-500 font-medium"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignUp ? 'Create a password (min 6 chars)' : '••••••••'}
                    className={inputClass + ' pr-11'}
                    onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
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
                onClick={handleEmailAuth}
                disabled={!email || !password || loading}
                className="w-full bg-brand-500 text-white rounded-2xl py-4 font-bold disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError('') }}
                className="w-full text-center text-sm text-gray-500"
              >
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <span className="text-brand-500 font-semibold">{isSignUp ? 'Sign In' : 'Sign Up'}</span>
              </button>
            </motion.div>
          )}

          {/* Email verification sent */}
          {step === 'verify' && (
            <motion.div key="verify" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-4">
              <div className="w-20 h-20 bg-brand-500/20 border border-brand-500/30 rounded-3xl flex items-center justify-center mx-auto mb-5">
                <Mail className="w-10 h-10 text-brand-500" />
              </div>
              <h2 className="text-white font-black text-xl mb-2">Check your inbox</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-2">
                We sent a verification link to
              </p>
              <p className="text-white font-semibold text-sm mb-5">{email}</p>
              <p className="text-gray-500 text-xs leading-relaxed mb-6">
                Click the link in the email to activate your account. Check your spam folder if you don't see it within a minute.
              </p>
              <button
                onClick={() => { setStep('email'); setPassword('') }}
                className="w-full bg-surface-800 border border-surface-600 text-white rounded-2xl py-3.5 font-semibold text-sm"
              >
                Back to Sign In
              </button>
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

          {/* Reset email sent */}
          {step === 'reset-sent' && (
            <motion.div key="reset-sent" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-4">
              <div className="w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-3xl flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-white font-black text-xl mb-2">Reset link sent!</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-2">
                Check your inbox at
              </p>
              <p className="text-white font-semibold text-sm mb-5">{forgotEmail || email}</p>
              <p className="text-gray-500 text-xs leading-relaxed mb-6">
                Click the link in the email to set a new password. The link expires in 1 hour.
              </p>
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
        By continuing you agree to Ribera's{' '}
        <button onClick={() => router.push('/privacy')} className="text-gray-500 hover:text-gray-400">Terms of Service and Privacy Policy</button>
      </p>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageInner />
    </Suspense>
  )
}

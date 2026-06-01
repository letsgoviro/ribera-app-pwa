'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Loader2, CheckCircle, KeyRound, AlertCircle } from 'lucide-react'

function ResetPasswordInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')

  const [sessionReady, setSessionReady] = useState(false)
  const [sessionError, setSessionError] = useState('')
  const [exchanging, setExchanging] = useState(true)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Exchange code or read implicit session from hash
  useEffect(() => {
    async function init() {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          setSessionError(error.message)
        } else {
          setSessionReady(true)
        }
        setExchanging(false)
        return
      }

      // No code param — check if Supabase already set a session via hash fragment
      // (implicit flow: #access_token=... in URL)
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        setSessionReady(true)
      } else {
        setSessionError('Invalid or expired reset link. Please request a new one.')
      }
      setExchanging(false)
    }

    init()
  }, [code])

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setSuccess(true)
  }

  const inputClass =
    'w-full bg-surface-800 border border-surface-600 rounded-2xl px-4 py-3.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-500 transition-colors text-sm'

  if (exchanging) {
    return (
      <div className="min-h-dvh bg-surface-900 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
      </div>
    )
  }

  if (sessionError) {
    return (
      <div className="min-h-dvh bg-surface-900 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-red-500/20 border border-red-500/30 rounded-3xl flex items-center justify-center mx-auto mb-5">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-white font-black text-xl mb-2">Link expired</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-xs">{sessionError}</p>
        <button
          onClick={() => router.replace('/auth')}
          className="bg-brand-500 text-white rounded-2xl px-6 py-3.5 font-bold text-sm"
        >
          Back to Sign In
        </button>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-dvh bg-surface-900 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-white font-black text-xl mb-2">Password updated!</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-xs">
            Your password has been changed. You can now sign in with your new password.
          </p>
          <button
            onClick={() => router.replace('/')}
            className="w-full bg-brand-500 text-white rounded-2xl py-4 font-bold text-sm"
          >
            Go to Ribera →
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-surface-900 flex flex-col px-6 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm mx-auto space-y-5"
      >
        {/* Icon + title */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-brand-500/20 border border-brand-500/30 rounded-2xl flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-brand-500" />
          </div>
          <div>
            <h1 className="text-white font-black text-xl leading-tight">Set new password</h1>
            <p className="text-gray-500 text-xs">Choose a strong password</p>
          </div>
        </div>

        {/* New password */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
            New Password
          </label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className={inputClass + ' pr-11'}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your new password"
              className={inputClass + ' pr-11'}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Match indicator */}
        {confirmPassword.length > 0 && (
          <p
            className={`text-xs font-medium ${
              newPassword === confirmPassword ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
          </p>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!newPassword || !confirmPassword || loading}
          className="w-full bg-brand-500 text-white rounded-2xl py-4 font-bold disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
        </button>

        <button
          onClick={() => router.replace('/auth')}
          className="w-full text-center text-sm text-gray-600 py-1 hover:text-gray-400 transition-colors"
        >
          Back to Sign In
        </button>
      </motion.div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-surface-900 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
        </div>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  )
}

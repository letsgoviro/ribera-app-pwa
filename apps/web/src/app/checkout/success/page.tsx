'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Order, ApiResponse } from '@ribera/types'
import { CheckCircle, Ticket, Calendar, MapPin, Loader2, XCircle } from 'lucide-react'

type VerifyState = 'idle' | 'verifying' | 'done' | 'failed'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Regular success params
  const orderId = searchParams.get('order_id') ?? searchParams.get('CompanyRef')
  const isFree = searchParams.get('free') === 'true'

  // DPO redirect params
  const transactionToken = searchParams.get('TransactionToken')
  const companyRef = searchParams.get('CompanyRef')

  const [verifyState, setVerifyState] = useState<VerifyState>(
    transactionToken && companyRef ? 'verifying' : 'idle'
  )
  const [verifyError, setVerifyError] = useState('')

  // Auto-verify DPO payment on redirect
  useEffect(() => {
    if (!transactionToken || !companyRef) return

    const verify = async () => {
      try {
        await api.post('/payment/verify', {
          order_id: companyRef,
          transaction_token: transactionToken,
        })
        setVerifyState('done')
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } }
        const msg = e?.response?.data?.error ?? 'Payment verification failed'
        // If already paid, treat as success
        if (msg.includes('already')) {
          setVerifyState('done')
        } else {
          setVerifyError(msg)
          setVerifyState('failed')
        }
      }
    }

    verify()
  }, [transactionToken, companyRef])

  // Fire confetti when ready
  useEffect(() => {
    if (verifyState !== 'idle' && verifyState !== 'done') return
    let cancelled = false
    import('canvas-confetti').then(({ default: confetti }) => {
      if (cancelled) return
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ['#0066FF', '#F5A623', '#ffffff', '#34D399'] })
      setTimeout(() => { if (!cancelled) confetti({ particleCount: 60, spread: 100, origin: { y: 0.4 }, angle: 60 }) }, 300)
      setTimeout(() => { if (!cancelled) confetti({ particleCount: 60, spread: 100, origin: { y: 0.4 }, angle: 120 }) }, 500)
    })
    return () => { cancelled = true }
  }, [verifyState])

  const { data: order } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => api.get<ApiResponse<Order>>(`/orders/${orderId}`).then((r) => r.data.data),
    enabled: !!orderId && verifyState !== 'verifying',
  })

  // Verifying state
  if (verifyState === 'verifying') {
    return (
      <div className="min-h-dvh bg-surface-900 flex flex-col items-center justify-center gap-4 px-4">
        <img src="/logo.png" alt="Ribera" className="w-16 h-16 rounded-2xl mb-2" />
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-white font-bold text-lg">Confirming your payment…</p>
        <p className="text-gray-500 text-sm text-center">Please wait while we verify your transaction with DPO Pay</p>
      </div>
    )
  }

  // Payment failed verification
  if (verifyState === 'failed') {
    return (
      <div className="min-h-dvh bg-surface-900 flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
          <XCircle className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-2xl font-black text-white">Payment not confirmed</h1>
        <p className="text-gray-400 text-sm text-center max-w-xs">{verifyError}</p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-surface-800 border border-surface-600 text-white rounded-2xl font-semibold text-sm"
          >
            Go home
          </button>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-brand-500 text-white rounded-2xl font-bold text-sm"
          >
            Try again
          </button>
        </div>
        {orderId && <p className="text-xs text-gray-600">Order: {orderId.slice(0, 8).toUpperCase()}</p>}
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-surface-900 flex flex-col items-center justify-start pt-16 pb-8 px-4 safe-top">
      {/* Success icon */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6"
      >
        <CheckCircle className="w-12 h-12 text-green-400" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl font-black text-white mb-2">
          {isFree ? "You're in!" : 'Payment successful!'}
        </h1>
        <p className="text-gray-400 text-sm">
          Your tickets have been confirmed. Check your email for a copy.
        </p>
      </motion.div>

      {/* Order card */}
      <AnimatePresence>
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full bg-surface-800 border border-surface-600 rounded-3xl overflow-hidden mb-6"
          >
            {order.event?.cover_image_url && (
              <div className="h-32 bg-surface-700 relative">
                <img src={order.event.cover_image_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-800/80 to-transparent" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Ticket className="w-4 h-4 text-brand-500" />
                <p className="text-brand-500 text-xs font-bold uppercase tracking-wider">Confirmed</p>
              </div>
              <p className="font-bold text-white text-lg leading-tight mb-3">{order.event?.title}</p>

              {order.event?.starts_at && (
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  {new Date(order.event.starts_at).toLocaleDateString('en-TZ', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </div>
              )}

              {order.event?.venue_name && (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  {order.event.venue_name}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-surface-600 space-y-1">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-400">{item.tier_name} × {item.quantity}</span>
                    <span className="text-white font-medium">{order.currency} {(item.unit_price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold pt-1">
                  <span className="text-gray-400">Total paid</span>
                  <span className="text-white">{order.currency} {order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full space-y-3"
      >
        <button
          onClick={() => router.push('/wallet')}
          className="w-full bg-brand-500 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <Ticket className="w-5 h-5" />
          View my tickets
        </button>

        <button
          onClick={() => router.push('/')}
          className="w-full bg-surface-800 border border-surface-600 text-white rounded-2xl py-4 font-semibold active:scale-[0.98] transition-transform"
        >
          Browse more events
        </button>
      </motion.div>

      {orderId && (
        <p className="text-xs text-gray-600 mt-6">Order ID: {orderId.slice(0, 8).toUpperCase()}</p>
      )}
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-surface-900 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}

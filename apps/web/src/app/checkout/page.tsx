'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import type { Event, ApiResponse } from '@ribera/types'
import { ChevronLeft, Loader2, Tag, AlertCircle } from 'lucide-react'

interface OrderItem {
  tier_id: string
  quantity: number
}

const SERVICE_FEE_PERCENT = 5

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const eventId = searchParams.get('event_id') ?? ''
  const itemsRaw = searchParams.get('items') ?? '[]'
  const items: OrderItem[] = JSON.parse(itemsRaw)

  const [attendeeName, setAttendeeName] = useState('')
  const [attendeeEmail, setAttendeeEmail] = useState('')
  const [attendeePhone, setAttendeePhone] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { data: event } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => api.get<ApiResponse<Event>>(`/events/${eventId}`).then((r) => r.data.data),
    enabled: !!eventId,
  })

  // Auth guard — if not signed in, redirect to /auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/auth')
      } else {
        // Pre-fill from Supabase user
        setAttendeeEmail(data.session.user.email ?? '')
        setAttendeePhone(data.session.user.phone ?? '')
      }
    })
  }, [router])

  const subtotal = event?.tiers?.reduce((sum, tier) => {
    const item = items.find((i) => i.tier_id === tier.id)
    return sum + (item ? item.quantity * tier.price : 0)
  }, 0) ?? 0

  const serviceFee = Math.floor(subtotal * SERVICE_FEE_PERCENT / 100)
  const total = subtotal + serviceFee

  const handlePlaceOrder = async () => {
    if (!attendeeName || !attendeeEmail || !attendeePhone) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const redirectBase = window.location.origin
      const { data } = await api.post('/orders', {
        event_id: eventId,
        items,
        attendee_name: attendeeName,
        attendee_email: attendeeEmail,
        attendee_phone: attendeePhone,
        promo_code: promoApplied ? promoCode : undefined,
        currency: event?.tiers?.[0]?.currency ?? 'TZS',
        redirect_url: `${redirectBase}/checkout/success`,
        back_url: `${redirectBase}/events/${eventId}`,
      })

      if (data.data.free) {
        router.push('/checkout/success?free=true')
      } else {
        window.location.href = data.data.payment_url
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e?.response?.data?.error ?? 'Failed to create order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!event) {
    return (
      <div className="min-h-dvh bg-surface-900 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
      </div>
    )
  }

  const currency = event.tiers?.[0]?.currency ?? 'TZS'

  return (
    <div className="min-h-dvh bg-surface-900 pb-8">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 safe-top flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-surface-800 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-xl font-black text-white">Checkout</h1>
      </div>

      <div className="px-4 space-y-5">
        {/* Order summary */}
        <div className="bg-surface-800 border border-surface-600 rounded-2xl p-4">
          <p className="text-white font-bold mb-1 text-sm line-clamp-1">{event.title}</p>
          <p className="text-gray-500 text-xs mb-3">
            {new Date(event.starts_at).toLocaleDateString('en-TZ', { weekday: 'short', day: 'numeric', month: 'short' })}
            {event.venue_name && ` · ${event.venue_name}`}
          </p>

          <div className="space-y-1.5">
            {items.map((item) => {
              const tier = event.tiers?.find((t) => t.id === item.tier_id)
              if (!tier) return null
              return (
                <div key={item.tier_id} className="flex justify-between text-sm">
                  <span className="text-gray-400">{tier.name} × {item.quantity}</span>
                  <span className="text-white font-medium">{currency} {(tier.price * item.quantity).toLocaleString()}</span>
                </div>
              )
            })}

            <div className="h-px bg-surface-600 my-2" />

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-300">{currency} {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Service fee (5%)</span>
              <span className="text-gray-300">{currency} {serviceFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-white">Total</span>
              <span className="text-brand-500 text-lg">{total === 0 ? 'Free' : `${currency} ${total.toLocaleString()}`}</span>
            </div>
          </div>
        </div>

        {/* Attendee details */}
        <div>
          <h2 className="text-white font-bold mb-3">Your details</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Full name *</label>
              <input
                value={attendeeName}
                onChange={(e) => setAttendeeName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-surface-800 border border-surface-600 rounded-2xl px-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-500 text-sm transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email address *</label>
              <input
                type="email"
                value={attendeeEmail}
                onChange={(e) => setAttendeeEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-surface-800 border border-surface-600 rounded-2xl px-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-500 text-sm transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Phone number *</label>
              <input
                type="tel"
                value={attendeePhone}
                onChange={(e) => setAttendeePhone(e.target.value)}
                placeholder="+255 712 345 678"
                className="w-full bg-surface-800 border border-surface-600 rounded-2xl px-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-500 text-sm transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Promo code */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5 font-medium">Promo code (optional)</label>
          <div className="flex gap-2">
            <input
              value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoApplied(false) }}
              placeholder="EARLY20"
              className="flex-1 bg-surface-800 border border-surface-600 rounded-2xl px-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-500 text-sm transition-colors font-mono"
            />
            <button
              onClick={() => setPromoApplied(true)}
              disabled={!promoCode}
              className="px-4 bg-surface-700 border border-surface-500 rounded-2xl text-sm font-semibold text-white disabled:opacity-40 flex items-center gap-1.5"
            >
              <Tag className="w-3.5 h-3.5" />
              Apply
            </button>
          </div>
          {promoApplied && <p className="text-xs text-green-400 mt-1.5">Code applied — discount calculated at payment</p>}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-2xl p-3.5"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        {/* CTA */}
        <button
          onClick={handlePlaceOrder}
          disabled={loading || !attendeeName || !attendeeEmail || !attendeePhone}
          className="w-full bg-brand-500 text-white rounded-2xl py-4 font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
          ) : total === 0 ? (
            'Get Free Tickets'
          ) : (
            `Pay ${currency} ${total.toLocaleString()}`
          )}
        </button>

        <p className="text-center text-xs text-gray-600">
          Secured by DPO Pay · Your payment is protected
        </p>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-surface-900 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}

'use client'

import { useState, use, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import type { Event, ApiResponse } from '@ribera/types'
import {
  Calendar, MapPin, ChevronLeft, Share2, ExternalLink,
  Users, ShieldCheck, Minus, Plus, Ticket, Tag, Lock, Hash, Link2
} from 'lucide-react'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default function EventDetailPage({ params }: PageProps) {
  const { slug } = use(params)
  const router = useRouter()
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [showFullDesc, setShowFullDesc] = useState(false)
  const [stickyVisible, setStickyVisible] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        setStickyVisible(window.scrollY > heroRef.current.clientHeight - 60)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const { data, isLoading, error } = useQuery({
    queryKey: ['event', slug],
    queryFn: () => api.get<ApiResponse<Event>>(`/events/${slug}`).then((r) => r.data.data),
  })

  const event = data

  const totalQty = Object.values(quantities).reduce((a, b) => a + b, 0)
  const totalPrice = event?.tiers?.reduce((sum, tier) => {
    return sum + (quantities[tier.id] ?? 0) * tier.price
  }, 0) ?? 0

  const setQty = (tierId: string, delta: number, maxPerOrder = 10, available = 9999) => {
    setQuantities((prev) => {
      const current = prev[tierId] ?? 0
      const next = Math.max(0, Math.min(Math.min(maxPerOrder, available), current + delta))
      if (next === 0) {
        const copy = { ...prev }
        delete copy[tierId]
        return copy
      }
      return { ...prev, [tierId]: next }
    })
  }

  const handleCheckout = async () => {
    // Require sign-in before checkout — redirect back to this event after auth
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      router.push(`/auth?next=${encodeURIComponent(`/events/${event!.slug}`)}`)
      return
    }
    const items = Object.entries(quantities).map(([tier_id, quantity]) => ({ tier_id, quantity }))
    const params = new URLSearchParams({
      event_id: event!.id,
      items: JSON.stringify(items),
    })
    router.push(`/checkout?${params}`)
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: event?.title ?? '', url: window.location.href })
    } else {
      await navigator.clipboard.writeText(window.location.href)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-surface-900 animate-pulse">
        <div className="h-72 bg-surface-800" />
        <div className="p-4 space-y-3">
          <div className="h-8 bg-surface-800 rounded-xl w-3/4" />
          <div className="h-4 bg-surface-800 rounded-xl w-1/2" />
          <div className="h-4 bg-surface-800 rounded-xl w-2/3" />
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-dvh bg-surface-900 flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-6xl">😕</p>
        <p className="text-white font-bold text-xl">Event not found</p>
        <button onClick={() => router.push('/')} className="text-brand-500 text-sm">Go home</button>
      </div>
    )
  }

  const starts = new Date(event.starts_at)
  const currency = event.tiers?.[0]?.currency ?? 'TZS'

  return (
    <div className="min-h-dvh bg-surface-900 pb-40">
      {/* Sticky header — appears after scrolling past hero */}
      <AnimatePresence>
        {stickyVisible && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-0 left-0 right-0 z-50 bg-surface-900/95 backdrop-blur-md border-b border-surface-600 safe-top"
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={() => router.back()}
                className="w-8 h-8 rounded-full bg-surface-800 flex items-center justify-center flex-shrink-0"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <p className="flex-1 text-white font-bold text-sm truncate">{event.title}</p>
              {totalQty > 0 && (
                <button
                  onClick={handleCheckout}
                  className="bg-brand-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1"
                >
                  <Ticket className="w-3 h-3" /> {totalQty} · {currency} {totalPrice.toLocaleString()}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <div className="relative" ref={heroRef}>
        <div className="h-72 bg-surface-800">
          {event.cover_image_url ? (
            <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl">🎉</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-900 via-surface-900/30 to-transparent" />
        </div>

        {/* Nav buttons */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12 safe-top">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
          >
            <Share2 className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-6 relative z-10">
        {/* Organiser */}
        {event.organiser && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-surface-700 overflow-hidden flex items-center justify-center text-xs font-bold text-brand-500">
              {event.organiser.logo_url ? (
                <img src={event.organiser.logo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                event.organiser.org_name[0]
              )}
            </div>
            <span className="text-gray-400 text-sm">{event.organiser.org_name}</span>
            {event.organiser.verified && (
              <ShieldCheck className="w-4 h-4 text-brand-500" />
            )}
          </div>
        )}

        <h1 className="text-2xl font-black text-white leading-tight mb-4">{event.title}</h1>

        {/* Meta chips */}
        <div className="flex flex-col gap-2.5 mb-5">
          <div className="flex items-center gap-2.5 text-gray-300 text-sm">
            <div className="w-8 h-8 rounded-xl bg-brand-500/15 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-brand-500" />
            </div>
            <div>
              <p className="font-semibold text-white">
                {starts.toLocaleDateString('en-TZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-xs text-gray-500">
                {starts.toLocaleTimeString('en-TZ', { hour: '2-digit', minute: '2-digit' })}
                {event.ends_at && ` – ${new Date(event.ends_at).toLocaleTimeString('en-TZ', { hour: '2-digit', minute: '2-digit' })}`}
              </p>
            </div>
          </div>

          {event.venue_name && (
            <div className="flex items-center gap-2.5 text-gray-300 text-sm">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white">{event.venue_name}</p>
                {event.address && <p className="text-xs text-gray-500 mt-0.5">{event.address}</p>}
              </div>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(`${event.venue_name} ${event.address ?? ''}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-purple-400 font-semibold bg-purple-500/10 px-2.5 py-1 rounded-full flex-shrink-0"
              >
                <ExternalLink className="w-3 h-3" /> Map
              </a>
            </div>
          )}

          {event.online_url && (
            <div className="flex items-center gap-2.5 text-gray-300 text-sm">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                <ExternalLink className="w-4 h-4 text-blue-400" />
              </div>
              <a href={event.online_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 font-medium text-sm">
                Join online
              </a>
            </div>
          )}

          {(event as unknown as Record<string, string>).venue_code && (
            <div className="flex items-center gap-2.5 text-gray-300 text-sm">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <Hash className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Venue / Door Code</p>
                <p className="font-mono font-bold text-amber-300 text-sm">
                  {(event as unknown as Record<string, string>).venue_code}
                </p>
              </div>
            </div>
          )}

          {(event as unknown as Record<string, string>).timetable_url && (
            <div className="flex items-center gap-2.5 text-gray-300 text-sm">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
                <Link2 className="w-4 h-4 text-cyan-400" />
              </div>
              <a
                href={(event as unknown as Record<string, string>).timetable_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 font-medium text-sm flex items-center gap-1"
              >
                View Schedule / Timetable
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {event.min_age > 0 && (
            <div className="flex items-center gap-2.5 text-gray-300 text-sm">
              <div className="w-8 h-8 rounded-xl bg-orange-500/15 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-orange-400" />
              </div>
              <p className="text-sm text-gray-400">Age {event.min_age}+</p>
            </div>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <div className="mb-6">
            <h2 className="text-white font-bold mb-2">About</h2>
            <p className={`text-gray-400 text-sm leading-relaxed ${showFullDesc ? '' : 'line-clamp-4'}`}>
              {event.description}
            </p>
            <button onClick={() => setShowFullDesc(!showFullDesc)} className="text-brand-500 text-sm mt-1">
              {showFullDesc ? 'Show less' : 'Read more'}
            </button>
          </div>
        )}

        {/* Ticket Tiers */}
        <h2 className="text-white font-bold mb-3 flex items-center gap-2">
          <Ticket className="w-4 h-4 text-brand-500" />
          Tickets
        </h2>

        <div className="space-y-3">
          {event.tiers?.map((tier) => {
            const available = tier.quantity - tier.sold
            const soldOut = available <= 0
            const qty = quantities[tier.id] ?? 0
            const maxPerOrder = tier.max_per_order ?? 10
            const tierType = tier.tier_type ?? 'general'
            const seatsPerUnit = tier.seats_per_unit ?? 1

            const TIER_BADGE: Record<string, { label: string; emoji: string; color: string }> = {
              general:  { label: 'General',        emoji: '🎫', color: 'text-gray-400 bg-gray-500/15'    },
              vip:      { label: 'VIP',             emoji: '⭐', color: 'text-yellow-400 bg-yellow-500/15' },
              table:    { label: 'Table',           emoji: '🪑', color: 'text-amber-400 bg-amber-500/15'  },
              seat:     { label: 'Reserved Seat',   emoji: '💺', color: 'text-blue-400 bg-blue-500/15'    },
              standing: { label: 'Standing',        emoji: '🕺', color: 'text-purple-400 bg-purple-500/15' },
              online:   { label: 'Virtual',         emoji: '📲', color: 'text-cyan-400 bg-cyan-500/15'    },
            }
            const badge = TIER_BADGE[tierType] ?? TIER_BADGE.general

            return (
              <div
                key={tier.id}
                className={`bg-surface-800 border rounded-2xl p-4 transition-all ${
                  soldOut ? 'border-surface-600 opacity-60' : qty > 0 ? 'border-brand-500 bg-brand-500/5' : 'border-surface-600'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-white">{tier.name}</p>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${badge.color}`}>
                        {badge.emoji} {badge.label}
                      </span>
                    </div>

                    {/* Seating info */}
                    {tierType === 'table' && (
                      <p className="text-amber-300 text-xs font-medium mb-1">
                        🪑 Table for {seatsPerUnit} · max {maxPerOrder} table{maxPerOrder > 1 ? 's' : ''} per order
                      </p>
                    )}
                    {tierType === 'seat' && seatsPerUnit > 1 && (
                      <p className="text-blue-300 text-xs font-medium mb-1">
                        💺 {seatsPerUnit} reserved seat{seatsPerUnit > 1 ? 's' : ''} per ticket
                      </p>
                    )}

                    {tier.description && (
                      <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{tier.description}</p>
                    )}

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <p className={`font-black text-lg ${tier.price === 0 ? 'text-green-400' : 'text-brand-500'}`}>
                        {tier.price === 0 ? 'Free' : `${tier.currency} ${tier.price.toLocaleString()}`}
                      </p>
                      {tierType === 'table' && tier.price > 0 && (
                        <span className="text-xs text-gray-500">per table</span>
                      )}
                      {!soldOut && available <= 20 && (
                        <span className="text-xs text-orange-400 font-medium">{available} left</span>
                      )}
                      {!soldOut && maxPerOrder < 10 && (
                        <span className="text-xs text-gray-600">max {maxPerOrder}/order</span>
                      )}
                    </div>
                  </div>

                  {soldOut ? (
                    <span className="text-xs text-red-400 font-semibold bg-red-500/10 px-3 py-1.5 rounded-full mt-1 flex-shrink-0">
                      Sold out
                    </span>
                  ) : (
                    <div className="flex items-center gap-3 mt-1 flex-shrink-0">
                      <button
                        onClick={() => setQty(tier.id, -1, maxPerOrder, available)}
                        disabled={qty === 0}
                        className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
                      >
                        <Minus className="w-3.5 h-3.5 text-white" />
                      </button>
                      <span className="text-white font-bold w-5 text-center">{qty}</span>
                      <button
                        onClick={() => setQty(tier.id, 1, maxPerOrder, available)}
                        disabled={qty >= Math.min(maxPerOrder, available)}
                        className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
                      >
                        <Plus className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Refund policy */}
        {event.refund_policy !== 'none' && (
          <p className="text-xs text-gray-600 mt-4 text-center">
            Refunds available up to {event.refund_policy} before the event
          </p>
        )}
      </div>

      {/* Sticky checkout bar */}
      <AnimatePresence>
        {totalQty > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-4 bg-gradient-to-t from-surface-900 via-surface-900/95 to-transparent"
          >
            <button
              onClick={handleCheckout}
              className="w-full bg-brand-500 text-white rounded-2xl py-4 font-bold text-base flex items-center justify-between px-5 active:scale-[0.98] transition-transform"
            >
              <span>{totalQty} ticket{totalQty > 1 ? 's' : ''}</span>
              <span>
                {totalPrice === 0 ? 'Get Free Tickets' : `${currency} ${totalPrice.toLocaleString()} →`}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

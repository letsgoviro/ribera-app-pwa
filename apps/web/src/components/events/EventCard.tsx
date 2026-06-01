'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import type { Event } from '@ribera/types'
import { MapPin } from 'lucide-react'

interface Props {
  event: Event
}

const CATEGORY_COLORS: Record<string, string> = {
  music:      'bg-purple-500/20 text-purple-300 border-purple-500/30',
  sports:     'bg-green-500/20 text-green-300 border-green-500/30',
  nightlife:  'bg-pink-500/20 text-pink-300 border-pink-500/30',
  arts:       'bg-orange-500/20 text-orange-300 border-orange-500/30',
  food:       'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  business:   'bg-blue-500/20 text-blue-300 border-blue-500/30',
  comedy:     'bg-amber-500/20 text-amber-300 border-amber-500/30',
  wellness:   'bg-teal-500/20 text-teal-300 border-teal-500/30',
}

function formatEventDate(isoString: string): string {
  const d = new Date(isoString)
  const day = d.toLocaleDateString('en-TZ', { weekday: 'short' }).toUpperCase()
  const date = d.getDate()
  const month = d.toLocaleDateString('en-TZ', { month: 'short' }).toUpperCase()
  const time = d.toLocaleTimeString('en-TZ', { hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(':00', '').replace(' ', '')
  return `${day} ${date} ${month} · ${time}`
}

export function EventCard({ event }: Props) {
  const tiers = event.tiers ?? []
  const lowestPrice = tiers.length > 0 ? tiers.reduce((min, t) => (t.price < min ? t.price : min), Infinity) : 0
  const totalCapacity = tiers.reduce((sum, t) => sum + t.quantity, 0)
  const totalSold = tiers.reduce((sum, t) => sum + t.sold, 0)
  const soldOut = tiers.length > 0 && tiers.every((t) => (t.quantity - t.sold) <= 0)
  const isFree = lowestPrice === 0
  const capacityPct = totalCapacity > 0 ? Math.min(100, Math.round((totalSold / totalCapacity) * 100)) : 0
  const categoryId = (event as Event & { category?: string }).category ?? ''
  const categoryColor = CATEGORY_COLORS[categoryId] ?? 'bg-white/10 text-gray-300 border-white/10'
  const currency = event.tiers?.[0]?.currency ?? 'TZS'

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.22 }}
    >
      <Link href={`/events/${event.slug ?? event.id}`}>
        <div className="relative bg-surface-800 rounded-3xl overflow-hidden border border-surface-600 hover:border-brand-500/40 hover:shadow-[0_0_0_1px_rgba(0,102,255,0.25),0_8px_32px_rgba(0,102,255,0.12)] transition-all duration-200 active:scale-[0.985]">

          {/* Cover image — 16:9 ratio via padding trick */}
          <div className="relative h-52 bg-surface-700 overflow-hidden">
            {event.cover_image_url ? (
              <img
                src={event.cover_image_url}
                alt={event.title}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-brand-500/20 to-purple-600/20">
                🎉
              </div>
            )}

            {/* Multi-layer gradient: shimmer at top, dark fade at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-900/95 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

            {/* Sold out diagonal ribbon */}
            {soldOut && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-5 -right-7 rotate-45 bg-red-500 text-white text-[10px] font-black tracking-wider px-8 py-1 shadow-lg">
                  SOLD OUT
                </div>
              </div>
            )}

            {/* Organiser pill — top left, like Instagram account name */}
            {event.organiser && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-md rounded-full px-2.5 py-1.5 border border-white/10">
                <div className="w-4.5 h-4.5 rounded-full bg-surface-600 flex items-center justify-center text-[9px] font-black text-brand-500 overflow-hidden flex-shrink-0" style={{ width: '18px', height: '18px' }}>
                  {event.organiser.logo_url ? (
                    <img src={event.organiser.logo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    event.organiser.org_name[0]
                  )}
                </div>
                <span className="text-white/90 text-[11px] font-semibold leading-none truncate max-w-[120px]">
                  {event.organiser.org_name}
                </span>
                {event.organiser.verified && (
                  <span className="text-brand-500 text-[10px] font-black leading-none">✓</span>
                )}
              </div>
            )}

            {/* Category chip — top right */}
            {categoryId && (
              <div className="absolute top-3 right-3">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-sm ${categoryColor}`}>
                  {categoryId.charAt(0).toUpperCase() + categoryId.slice(1)}
                </span>
              </div>
            )}
          </div>

          {/* Card body */}
          <div className="px-4 pt-3.5 pb-4">

            {/* Date row */}
            <p className="text-brand-500 text-[11px] font-bold tracking-wide uppercase mb-1.5">
              {formatEventDate(event.starts_at)}
            </p>

            {/* Title */}
            <h3 className="font-black text-white text-xl leading-tight mb-2.5 line-clamp-2 tracking-tight">
              {event.title}
            </h3>

            {/* Venue row */}
            {event.venue_name && (
              <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-3">
                <MapPin className="w-3 h-3 flex-shrink-0 text-brand-500" />
                <span className="line-clamp-1">{event.venue_name}</span>
              </div>
            )}

            {/* Price + capacity */}
            <div className="flex items-center justify-between">
              {soldOut ? (
                <span className="text-red-400 text-xs font-bold">Sold out</span>
              ) : isFree ? (
                <span className="bg-green-500/15 text-green-400 border border-green-500/25 text-xs font-bold px-3 py-1.5 rounded-full">
                  Free entry
                </span>
              ) : (
                <div className="flex flex-col gap-0.5">
                  <span className="text-gray-500 text-[10px] font-semibold uppercase tracking-wide">Tickets from</span>
                  <span className="text-white font-black text-sm">
                    {currency} {lowestPrice.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Capacity heat indicator */}
              {!soldOut && totalCapacity > 0 && (
                <div className="flex flex-col items-end gap-1">
                  <span className="text-gray-500 text-[10px]">
                    {capacityPct >= 80 ? '🔥 Filling fast' : capacityPct >= 50 ? 'Selling well' : 'Available'}
                  </span>
                  <div className="w-20 h-1 bg-surface-600 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        capacityPct >= 80 ? 'bg-red-400' : capacityPct >= 50 ? 'bg-orange-400' : 'bg-green-400'
                      }`}
                      style={{ width: `${capacityPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

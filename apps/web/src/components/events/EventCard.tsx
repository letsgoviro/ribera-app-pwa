'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import type { Event } from '@ribera/types'
import { Calendar, MapPin } from 'lucide-react'

interface Props {
  event: Event
}

export function EventCard({ event }: Props) {
  const tiers = event.tiers ?? []
  const lowestPrice = tiers.length > 0 ? tiers.reduce((min, t) => (t.price < min ? t.price : min), Infinity) : 0
  const soldOut = tiers.length > 0 && tiers.every((t) => (t.quantity - t.sold) <= 0)
  const isFree = lowestPrice === 0

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/events/${event.slug ?? event.id}`}>
        <div className="relative bg-surface-800 rounded-3xl overflow-hidden border border-surface-600 hover:border-brand-500/50 transition-all active:scale-[0.98]">
          {/* Cover image */}
          <div className="relative h-48 bg-surface-700">
            {event.cover_image_url ? (
              <img
                src={event.cover_image_url}
                alt={event.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">🎉</div>
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-900/80 to-transparent" />

            {/* Sold out / price badge */}
            <div className="absolute top-3 right-3">
              {soldOut ? (
                <span className="bg-red-500/90 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                  Sold Out
                </span>
              ) : isFree ? (
                <span className="bg-green-500/90 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                  Free
                </span>
              ) : (
                <span className="bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                  From {event.tiers?.[0]?.currency} {lowestPrice.toLocaleString()}
                </span>
              )}
            </div>

            {/* Event type + verified badge row */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              {(event as Event & { event_type?: string }).event_type && (event as Event & { event_type?: string }).event_type !== 'paid' && (() => {
                const et = (event as Event & { event_type?: string }).event_type!
                const labels: Record<string, string> = { free: '🆓 Free', online: '💻 Online', donation: '💝 Donation', hybrid: '🌐 Hybrid' }
                const colors: Record<string, string> = { free: 'bg-green-500/90', online: 'bg-blue-500/90', donation: 'bg-pink-500/90', hybrid: 'bg-purple-500/90' }
                return (
                  <span className={`${colors[et] ?? 'bg-gray-700/90'} text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm`}>
                    {labels[et] ?? et}
                  </span>
                )
              })()}
              {event.organiser?.verified && (
                <span className="bg-brand-500/90 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm">
                  ✓ Verified
                </span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="p-4">
            <h3 className="font-bold text-white text-lg leading-tight mb-2 line-clamp-2">{event.title}</h3>

            <div className="flex items-center gap-1.5 text-gray-400 text-sm mb-1.5">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-brand-500" />
              <span>
                {new Date(event.starts_at).toLocaleDateString('en-TZ', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {event.venue_name && (
              <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-brand-500" />
                <span className="line-clamp-1">{event.venue_name}</span>
              </div>
            )}

            {/* Organiser */}
            {event.organiser && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-600">
                <div className="w-6 h-6 rounded-full bg-surface-700 flex items-center justify-center text-xs font-bold text-brand-500 overflow-hidden">
                  {event.organiser.logo_url ? (
                    <img src={event.organiser.logo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    event.organiser.org_name[0]
                  )}
                </div>
                <span className="text-gray-400 text-xs">{event.organiser.org_name}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

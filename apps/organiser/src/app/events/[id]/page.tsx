'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Shell } from '@/components/layout/Shell'
import type { Event, ApiResponse } from '@ribera/types'
import { Calendar, MapPin, Users, CheckCircle, XCircle, Clock, Zap, Lock, Pencil } from 'lucide-react'

interface AttendeeTicket {
  id: string
  status: string
  checked_in_at: string | null
  qr_token: string
  tier: { name: string }
  order: { attendee_name: string; attendee_email: string; attendee_phone: string }
  holder: { display_name: string | null }
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const { data: eventData } = useQuery({
    queryKey: ['organiser-event', id],
    queryFn: () => api.get<ApiResponse<Event>>(`/organiser/events/${id}`).then(r => r.data.data),
  })

  const { data: attendeesData, isLoading: loadingAttendees } = useQuery({
    queryKey: ['organiser-event-attendees', id],
    queryFn: () => api.get<{ data: AttendeeTicket[]; has_boost: boolean }>(`/organiser/events/${id}/attendees`).then(r => r.data),
  })

  const event = eventData
  const attendees = attendeesData?.data ?? []
  const hasBoost = attendeesData?.has_boost ?? false
  const checkedIn = attendees.filter(a => a.status === 'used').length
  const total = attendees.filter(a => a.status !== 'cancelled').length
  // prices are in TZS (no sub-unit division needed)
  const revenue = event?.tiers?.reduce((s, t) => s + t.sold * Number(t.price), 0) ?? 0
  const currency = event?.tiers?.[0]?.currency ?? 'TZS'

  return (
    <Shell>
      {/* Event header */}
      <div className="mb-6">
        {event ? (
          <>
            {/* Cover image */}
            {event.cover_image_url && (
              <div className="h-40 rounded-2xl overflow-hidden mb-4 bg-surface-700">
                <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-white">{event.title}</h1>
                <div className="flex items-center gap-2 mt-1 text-gray-400 text-sm">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(event.starts_at).toLocaleDateString('en-TZ', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
                {event.venue_name && (
                  <div className="flex items-center gap-2 mt-0.5 text-gray-400 text-sm">
                    <MapPin className="w-3.5 h-3.5" />
                    {event.venue_name}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                  event.status === 'published' ? 'bg-green-500/20 text-green-400' :
                  event.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>{event.status}</span>
                <Link
                  href={`/events/${id}/edit`}
                  className="w-8 h-8 bg-surface-700 border border-surface-500 rounded-lg flex items-center justify-center hover:border-brand-500/40 transition-colors"
                  title="Edit event"
                >
                  <Pencil className="w-3.5 h-3.5 text-gray-400" />
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-surface-800 border border-surface-600 rounded-2xl p-3 text-center">
                <p className="text-2xl font-black text-white">{total}</p>
                <p className="text-xs text-gray-500 mt-0.5">Tickets Sold</p>
              </div>
              <div className="bg-surface-800 border border-surface-600 rounded-2xl p-3 text-center">
                <p className="text-2xl font-black text-brand-500">{checkedIn}</p>
                <p className="text-xs text-gray-500 mt-0.5">Checked In</p>
              </div>
              <div className="bg-surface-800 border border-surface-600 rounded-2xl p-3 text-center">
                <p className="text-lg font-black text-white">{currency} {revenue.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-0.5">Revenue</p>
              </div>
            </div>

            {/* Tier breakdown */}
            {event.tiers && event.tiers.length > 0 && (
              <div className="bg-surface-800 border border-surface-600 rounded-2xl p-4 mb-6">
                <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">Ticket Tiers</p>
                <div className="space-y-3">
                  {event.tiers.map(tier => {
                    const pct = tier.quantity > 0 ? Math.round((tier.sold / tier.quantity) * 100) : 0
                    return (
                      <div key={tier.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white font-medium">{tier.name}</span>
                          <span className="text-gray-400">{tier.sold} / {tier.quantity}</span>
                        </div>
                        <div className="h-1.5 bg-surface-600 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="h-32 bg-surface-800 rounded-2xl animate-pulse mb-6" />
        )}
      </div>

      {/* Attendees */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-500" />
          Attendees ({attendees.length})
          {!hasBoost && <Lock className="w-3.5 h-3.5 text-gray-500" />}
        </h2>
        <Link
          href={`/scanner?event_id=${id}`}
          className="text-xs bg-brand-500 text-white px-3 py-1.5 rounded-lg font-semibold"
        >
          Open Scanner
        </Link>
      </div>

      {/* Boost gate banner */}
      {!hasBoost && attendees.length > 0 && (
        <Link
          href={`/boost?event_id=${id}`}
          className="block mb-4 bg-gradient-to-r from-brand-500/20 to-purple-500/20 border border-brand-500/30 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-brand-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">Unlock Full Attendee Details</p>
              <p className="text-gray-400 text-xs mt-0.5">Boost your event to see full names, emails & phones. Also sends reminders.</p>
            </div>
            <span className="text-brand-500 text-xs font-bold flex-shrink-0">Boost →</span>
          </div>
        </Link>
      )}

      {loadingAttendees ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="h-16 bg-surface-800 rounded-xl animate-pulse" />)}
        </div>
      ) : attendees.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No attendees yet</p>
        </div>
      ) : (
        <motion.div
          className="space-y-2"
          initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.03 } } }}
        >
          {attendees.map(a => (
            <motion.div
              key={a.id}
              variants={{ hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0 } }}
              className="bg-surface-800 border border-surface-600 rounded-xl px-4 py-3 flex items-center gap-3"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                a.status === 'used' ? 'bg-green-500/20' : 'bg-surface-700'
              }`}>
                {a.status === 'used'
                  ? <CheckCircle className="w-4 h-4 text-green-400" />
                  : a.status === 'cancelled'
                    ? <XCircle className="w-4 h-4 text-red-400" />
                    : <Clock className="w-4 h-4 text-gray-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {a.order.attendee_name}
                </p>
                <p className="text-gray-500 text-xs truncate">
                  {a.tier.name}
                  {hasBoost
                    ? ` · ${a.order.attendee_phone} · ${a.order.attendee_email}`
                    : <span className="text-gray-700"> · 🔒 {a.order.attendee_phone} · {a.order.attendee_email}</span>
                  }
                </p>
              </div>
              {a.checked_in_at && (
                <span className="text-xs text-green-400 flex-shrink-0">
                  {new Date(a.checked_in_at).toLocaleTimeString('en-TZ', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </Shell>
  )
}

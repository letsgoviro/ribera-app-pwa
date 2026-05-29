'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Shell } from '@/components/layout/Shell'
import type { Event, PaginatedResponse } from '@ribera/types'
import { CalendarPlus, Calendar, MapPin, Users, TrendingUp, Search } from 'lucide-react'

function EventStatusBadge({ status }: { status: Event['status'] }) {
  const map = {
    draft: 'bg-gray-500/20 text-gray-400',
    published: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
    completed: 'bg-blue-500/20 text-blue-400',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${map[status]}`}>
      {status}
    </span>
  )
}

export default function EventsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['organiser-events', search, statusFilter],
    queryFn: () =>
      api.get<PaginatedResponse<Event>>('/organiser/events', {
        params: { search: search || undefined, status: statusFilter === 'all' ? undefined : statusFilter, limit: 50 },
      }).then((r) => r.data),
  })

  const events = data?.data ?? []

  return (
    <Shell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Events</h1>
          <p className="text-gray-400 text-sm mt-0.5">{data?.total ?? 0} events total</p>
        </div>
        <Link
          href="/events/create"
          className="flex items-center gap-2 bg-brand-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-400 transition-colors"
        >
          <CalendarPlus className="w-4 h-4" />
          Create
        </Link>
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="w-full bg-surface-800 border border-surface-600 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-surface-800 border border-surface-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500"
        >
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Events list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-surface-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20">
          <CalendarPlus className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 font-semibold">No events yet</p>
          <p className="text-gray-600 text-sm mt-1">Create your first event to get started</p>
          <Link href="/events/create" className="mt-4 inline-block bg-brand-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">
            Create Event
          </Link>
        </div>
      ) : (
        <motion.div
          className="space-y-3"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        >
          {events.map((event) => {
            const sold = event.tiers?.reduce((s, t) => s + t.sold, 0) ?? 0
            const total = event.tiers?.reduce((s, t) => s + t.quantity, 0) ?? 0
            const pct = total > 0 ? Math.round((sold / total) * 100) : 0

            return (
              <motion.div
                key={event.id}
                variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.15 }}
              >
                <Link href={`/events/${event.id}`}>
                  <div className="bg-surface-800 border border-surface-600 rounded-2xl p-4 flex gap-4 hover:border-brand-500/40 transition-all active:scale-[0.99]">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-xl bg-surface-700 flex-shrink-0 overflow-hidden">
                      {event.cover_image_url ? (
                        <img src={event.cover_image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">🎉</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-bold text-white text-sm leading-tight line-clamp-2">{event.title}</p>
                        <EventStatusBadge status={event.status} />
                      </div>

                      <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(event.starts_at).toLocaleDateString('en-TZ', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>

                      {event.venue_name && (
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-2">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{event.venue_name}</span>
                        </div>
                      )}

                      {/* Progress */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-surface-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {sold}/{total}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </Shell>
  )
}

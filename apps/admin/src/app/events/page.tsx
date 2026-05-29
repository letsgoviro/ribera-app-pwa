'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { api } from '@/lib/api'
import { AdminShell } from '@/components/layout/AdminShell'
import { Calendar, Ticket, Search, Loader2, ChevronRight, Building2 } from 'lucide-react'

interface EventRow {
  id: string
  title: string
  slug: string
  status: string
  starts_at: string
  category: string
  event_type: string
  organiser: { id: string; org_name: string; verified: boolean }
  tiers: Array<{ quantity: number; sold: number }>
  _count: { tickets: number; orders: number }
}

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'published', label: 'Live' },
  { key: 'draft', label: 'Draft' },
  { key: 'cancelled', label: 'Cancelled' },
]

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-green-500/15 text-green-400',
  draft: 'bg-gray-500/15 text-gray-400',
  cancelled: 'bg-red-500/15 text-red-400',
  completed: 'bg-blue-500/15 text-blue-400',
}

export default function AdminEventsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery<{ data: EventRow[]; total: number }>({
    queryKey: ['admin-events', statusFilter, search],
    queryFn: () =>
      api.get('/admin/events', {
        params: {
          limit: 50,
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(search ? { search } : {}),
        },
      }).then(r => r.data),
    staleTime: 30000,
  })

  const events = data?.data ?? []

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Events</h1>
          <p className="text-gray-400 text-sm mt-0.5">{data?.total ?? 0} total</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search events…"
          className="w-full bg-surface-800 border border-surface-600 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-brand-500"
        />
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              statusFilter === tab.key
                ? 'bg-brand-500 text-white'
                : 'bg-surface-800 border border-surface-600 text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-surface-800 border border-surface-600 rounded-2xl">
          <Calendar className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No events found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const sold = event.tiers.reduce((s, t) => s + t.sold, 0)
            const capacity = event.tiers.reduce((s, t) => s + t.quantity, 0)
            const pct = capacity > 0 ? Math.round((sold / capacity) * 100) : 0

            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="flex items-center gap-4 bg-surface-800 border border-surface-600 hover:border-brand-500/40 rounded-2xl p-4 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[event.status] ?? 'bg-gray-500/15 text-gray-400'}`}>
                      {event.status}
                    </span>
                    <span className="text-gray-600 text-xs">{event.category}</span>
                  </div>
                  <p className="text-white font-semibold text-sm line-clamp-1">{event.title}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Building2 className="w-3 h-3 text-gray-600" />
                    <p className="text-gray-500 text-xs">{event.organiser.org_name}</p>
                    <span className="text-gray-700 text-xs">·</span>
                    <Calendar className="w-3 h-3 text-gray-600" />
                    <p className="text-gray-500 text-xs">
                      {new Date(event.starts_at).toLocaleDateString('en-TZ', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Ticket sold indicator */}
                <div className="flex-shrink-0 text-right">
                  <div className="flex items-center gap-1 justify-end mb-1">
                    <Ticket className="w-3.5 h-3.5 text-brand-500" />
                    <span className="text-white text-sm font-bold">{sold}</span>
                    <span className="text-gray-600 text-xs">/ {capacity}</span>
                  </div>
                  <div className="w-20 h-1.5 bg-surface-600 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </AdminShell>
  )
}

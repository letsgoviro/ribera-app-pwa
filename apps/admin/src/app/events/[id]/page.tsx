'use client'

import { use } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { api } from '@/lib/api'
import { AdminShell } from '@/components/layout/AdminShell'
import {
  ChevronLeft, Calendar, MapPin, DollarSign, Ticket, Users,
  Loader2, AlertCircle, Globe, Clock, Building2, CheckCircle, XCircle,
} from 'lucide-react'

interface TierDetail {
  id: string
  name: string
  price: number | string
  currency: string
  quantity: number
  sold: number
  sort_order: number
}

interface EventDetail {
  id: string
  title: string
  slug: string
  description: string | null
  cover_image_url: string | null
  category: string
  event_type: string
  status: string
  starts_at: string
  ends_at: string | null
  timezone: string
  venue_name: string | null
  address: string | null
  online_url: string | null
  created_at: string
  published_at: string | null
  cancelled_at: string | null
  min_age: number
  allow_transfer: boolean
  refund_policy: string
  organiser: { id: string; org_name: string; verified: boolean; logo_url: string | null }
  tiers: TierDetail[]
  total_revenue: number
  ribera_fees: number
  total_orders: number
  checked_in: number
  _count: { tickets: number; orders: number }
}

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-green-500/15 text-green-400 border-green-500/30',
  draft: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
  completed: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
}

export default function AdminEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const qc = useQueryClient()

  const { data, isLoading, error } = useQuery<{ data: EventDetail }>({
    queryKey: ['admin-event-detail', id],
    queryFn: () => api.get(`/admin/events/${id}`).then(r => r.data),
  })

  const cancelMutation = useMutation({
    mutationFn: () => api.delete(`/events/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-event-detail', id] }),
  })

  const publishMutation = useMutation({
    mutationFn: () => api.post(`/events/${id}/publish`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-event-detail', id] }),
  })

  if (isLoading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      </AdminShell>
    )
  }

  if (error || !data?.data) {
    return (
      <AdminShell>
        <div className="text-center py-16">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-white font-bold">Event not found</p>
          <Link href="/events" className="text-brand-500 text-sm mt-2 inline-block">← Back to events</Link>
        </div>
      </AdminShell>
    )
  }

  const event = data.data
  const totalCapacity = event.tiers.reduce((s, t) => s + t.quantity, 0)
  const totalSold = event.tiers.reduce((s, t) => s + t.sold, 0)
  const fillPct = totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0

  return (
    <AdminShell>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/events" className="text-gray-400 hover:text-white text-sm flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Events
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-white text-sm font-medium line-clamp-1">{event.title}</span>
      </div>

      {/* Cover + Header */}
      <div className="bg-surface-800 border border-surface-600 rounded-3xl overflow-hidden mb-6">
        {event.cover_image_url && (
          <div className="h-48 bg-surface-700">
            <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_COLORS[event.status] ?? 'bg-gray-500/15 text-gray-400'}`}>
                  {event.status}
                </span>
                <span className="text-gray-500 text-xs capitalize">{event.category}</span>
                <span className="text-gray-500 text-xs capitalize">· {event.event_type}</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">{event.title}</h1>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Calendar className="w-4 h-4 flex-shrink-0 text-brand-500" />
                  <span>{new Date(event.starts_at).toLocaleDateString('en-TZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {event.venue_name && (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <MapPin className="w-4 h-4 flex-shrink-0 text-brand-500" />
                    <span>{event.venue_name}{event.address ? ` · ${event.address}` : ''}</span>
                  </div>
                )}
                {event.online_url && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 flex-shrink-0 text-brand-500" />
                    <a href={event.online_url} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline">
                      {event.online_url}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              {event.status === 'draft' && (
                <button
                  onClick={() => publishMutation.mutate()}
                  disabled={publishMutation.isPending}
                  className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 text-green-400 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-green-500/30 disabled:opacity-40"
                >
                  {publishMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  Publish
                </button>
              )}
              {event.status === 'published' && (
                <button
                  onClick={() => {
                    if (confirm('Cancel this event? This cannot be undone.')) cancelMutation.mutate()
                  }}
                  disabled={cancelMutation.isPending}
                  className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-400 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-red-500/30 disabled:opacity-40"
                >
                  {cancelMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  Cancel Event
                </button>
              )}
            </div>
          </div>

          {/* Organiser */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-surface-600">
            <div className="w-8 h-8 bg-surface-700 rounded-lg flex items-center justify-center overflow-hidden">
              {event.organiser.logo_url ? (
                <img src={event.organiser.logo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <Link href={`/organisers/${event.organiser.id}`} className="text-white text-sm font-semibold hover:text-brand-500">
                {event.organiser.org_name}
              </Link>
              {event.organiser.verified && (
                <span className="ml-2 text-xs text-green-400">✓ Verified</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Revenue', value: `TZS ${event.total_revenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Ribera Fees', value: `TZS ${event.ribera_fees.toLocaleString()}`, icon: DollarSign, color: 'text-brand-500', bg: 'bg-brand-500/10' },
          { label: 'Check-ins', value: `${event.checked_in} / ${totalSold}`, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Tickets Sold', value: `${totalSold} / ${totalCapacity}`, icon: Ticket, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-surface-800 border border-surface-600 rounded-2xl p-4">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-xl font-black text-white">{value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Fill rate */}
      <div className="bg-surface-800 border border-surface-600 rounded-2xl p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <p className="text-white font-semibold text-sm">Capacity</p>
          <p className="text-gray-400 text-sm">{fillPct}% filled</p>
        </div>
        <div className="h-3 bg-surface-600 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${fillPct}%`,
              background: fillPct > 90 ? '#ef4444' : fillPct > 60 ? '#f59e0b' : '#6d28d9',
            }}
          />
        </div>
        <p className="text-gray-500 text-xs mt-1.5">{totalSold} sold · {totalCapacity - totalSold} remaining</p>
      </div>

      {/* Ticket Tiers */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white mb-3">Ticket Tiers</h2>
        <div className="space-y-2">
          {event.tiers.map((tier) => {
            const tierPct = tier.quantity > 0 ? Math.round((tier.sold / tier.quantity) * 100) : 0
            return (
              <div key={tier.id} className="bg-surface-800 border border-surface-600 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white font-semibold text-sm">{tier.name}</p>
                  <div className="text-right">
                    <p className="text-white font-bold text-sm">{tier.currency} {Number(tier.price).toLocaleString()}</p>
                    <p className="text-gray-500 text-xs">{tier.sold}/{tier.quantity} sold</p>
                  </div>
                </div>
                <div className="h-1.5 bg-surface-600 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: `${tierPct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Event metadata */}
      <div className="bg-surface-800 border border-surface-600 rounded-2xl p-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Event Details</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-gray-500 text-xs">Min Age</p><p className="text-white">{event.min_age === 0 ? 'All ages' : `${event.min_age}+`}</p></div>
          <div><p className="text-gray-500 text-xs">Transfers</p><p className="text-white">{event.allow_transfer ? 'Allowed' : 'Not allowed'}</p></div>
          <div><p className="text-gray-500 text-xs">Refund Policy</p><p className="text-white capitalize">{event.refund_policy}</p></div>
          <div><p className="text-gray-500 text-xs">Timezone</p><p className="text-white">{event.timezone}</p></div>
          {event.published_at && (
            <div className="col-span-2"><p className="text-gray-500 text-xs">Published</p><p className="text-white">{new Date(event.published_at).toLocaleString('en-TZ')}</p></div>
          )}
        </div>
        {event.description && (
          <div className="mt-3 pt-3 border-t border-surface-600">
            <p className="text-gray-500 text-xs mb-1">Description</p>
            <p className="text-gray-300 text-sm leading-relaxed line-clamp-4">{event.description}</p>
          </div>
        )}
      </div>
    </AdminShell>
  )
}

'use client'

import { use } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { api } from '@/lib/api'
import { AdminShell } from '@/components/layout/AdminShell'
import {
  ChevronLeft, Building2, Mail, Phone, Globe, MapPin,
  CheckCircle, XCircle, Calendar, Ticket, DollarSign, TrendingUp,
  ExternalLink, ShieldCheck, Loader2, AlertCircle,
} from 'lucide-react'

interface EventSummary {
  id: string
  title: string
  slug: string
  status: string
  starts_at: string
  category: string
  _count: { tickets: number; orders: number }
  tiers: Array<{ quantity: number; sold: number }>
}

interface PayoutDetails {
  method?: 'bank' | 'mobile_money'
  bank_name?: string
  account_number?: string
  account_name?: string
  mobile_money_number?: string
  mobile_money_provider?: string
}

interface OrgDetail {
  id: string
  org_name: string
  full_name: string | null
  phone: string | null
  bio: string | null
  logo_url: string | null
  banner_url: string | null
  website: string | null
  verified: boolean
  verified_at: string | null
  id_doc_url: string | null
  payout_details: PayoutDetails
  balance: number
  created_at: string
  email: string | null
  total_revenue: number
  ribera_fees: number
  total_orders: number
  profile: { display_name: string | null; phone: string | null; city: string | null; created_at: string }
  events: EventSummary[]
}

export default function OrganiserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const qc = useQueryClient()

  const { data, isLoading, error } = useQuery<{ data: OrgDetail }>({
    queryKey: ['admin-organiser-detail', id],
    queryFn: () => api.get(`/admin/organisers/${id}`).then(r => r.data),
  })

  const verifyMutation = useMutation({
    mutationFn: (approved: boolean) =>
      api.put(`/admin/organisers/${id}/verify`, { approved }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-organiser-detail', id] })
      qc.invalidateQueries({ queryKey: ['admin-organisers'] })
    },
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
          <p className="text-white font-bold">Organiser not found</p>
          <Link href="/organisers" className="text-brand-500 text-sm mt-2 inline-block">← Back to organisers</Link>
        </div>
      </AdminShell>
    )
  }

  const org = data.data
  const totalCapacity = org.events.reduce((sum, e) => sum + e.tiers.reduce((s, t) => s + t.quantity, 0), 0)
  const totalSold = org.events.reduce((sum, e) => sum + e.tiers.reduce((s, t) => s + t.sold, 0), 0)

  return (
    <AdminShell>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/organisers" className="text-gray-400 hover:text-white text-sm flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Organisers
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-white text-sm font-medium">{org.org_name}</span>
      </div>

      {/* Header */}
      <div className="bg-surface-800 border border-surface-600 rounded-3xl p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 bg-surface-700 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
            {org.logo_url ? (
              <img src={org.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-10 h-10 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{org.org_name}</h1>
              {org.verified ? (
                <span className="inline-flex items-center gap-1 bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold px-2.5 py-1 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-bold px-2.5 py-1 rounded-full">
                  <AlertCircle className="w-3.5 h-3.5" /> Pending
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm mt-0.5">{org.profile.display_name ?? 'No name'}</p>

            {/* Contact row */}
            <div className="flex flex-wrap gap-3 mt-3">
              {org.email && (
                <a href={`mailto:${org.email}`} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs">
                  <Mail className="w-3.5 h-3.5" /> {org.email}
                </a>
              )}
              {org.profile.phone && (
                <span className="flex items-center gap-1.5 text-gray-400 text-xs">
                  <Phone className="w-3.5 h-3.5" /> {org.profile.phone}
                </span>
              )}
              {org.website && (
                <a href={org.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-brand-500 hover:underline text-xs">
                  <Globe className="w-3.5 h-3.5" /> {org.website}
                </a>
              )}
              {org.profile.city && (
                <span className="flex items-center gap-1.5 text-gray-400 text-xs">
                  <MapPin className="w-3.5 h-3.5" /> {org.profile.city}
                </span>
              )}
            </div>
          </div>

          {/* Verify / Unverify buttons */}
          {!org.verified ? (
            <button
              onClick={() => verifyMutation.mutate(true)}
              disabled={verifyMutation.isPending}
              className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-500/30 transition-colors disabled:opacity-40"
            >
              {verifyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Approve
            </button>
          ) : (
            <span className="text-gray-600 text-xs">
              Verified {org.verified_at ? new Date(org.verified_at).toLocaleDateString() : ''}
            </span>
          )}
        </div>

        {org.bio && (
          <p className="text-gray-400 text-sm mt-4 leading-relaxed border-t border-surface-600 pt-4">{org.bio}</p>
        )}
      </div>

      {/* Application Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Identity */}
        <div className="bg-surface-800 border border-surface-600 rounded-2xl p-4">
          <h3 className="text-white font-bold text-sm mb-3">Application Details</h3>
          <div className="space-y-2.5">
            {org.full_name && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Legal Name</p>
                <p className="text-white font-medium text-sm">{org.full_name}</p>
              </div>
            )}
            {(org.phone ?? org.profile.phone) && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Phone</p>
                <p className="text-white font-medium text-sm">{org.phone ?? org.profile.phone}</p>
              </div>
            )}
            {org.email && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
                <a href={`mailto:${org.email}`} className="text-brand-500 text-sm hover:underline">{org.email}</a>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Applied</p>
              <p className="text-white font-medium text-sm">{new Date(org.created_at).toLocaleDateString('en-TZ', { dateStyle: 'medium' })}</p>
            </div>
          </div>
        </div>

        {/* Payout details */}
        {org.payout_details && Object.keys(org.payout_details).length > 0 && (
          <div className="bg-surface-800 border border-surface-600 rounded-2xl p-4">
            <h3 className="text-white font-bold text-sm mb-3">Payout Account</h3>
            <div className="space-y-2.5">
              {org.payout_details.method && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Method</p>
                  <p className="text-white font-medium text-sm capitalize">{org.payout_details.method.replace('_', ' ')}</p>
                </div>
              )}
              {org.payout_details.mobile_money_provider && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Provider</p>
                  <p className="text-white font-medium text-sm">{org.payout_details.mobile_money_provider}</p>
                </div>
              )}
              {org.payout_details.mobile_money_number && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Mobile Number</p>
                  <p className="text-white font-mono text-sm">{org.payout_details.mobile_money_number}</p>
                </div>
              )}
              {org.payout_details.bank_name && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Bank</p>
                  <p className="text-white font-medium text-sm">{org.payout_details.bank_name}</p>
                </div>
              )}
              {org.payout_details.account_number && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Account Number</p>
                  <p className="text-white font-mono text-sm">{org.payout_details.account_number}</p>
                </div>
              )}
              {org.payout_details.account_name && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Account Name</p>
                  <p className="text-white font-medium text-sm">{org.payout_details.account_name}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ID Document inline viewer */}
      {org.id_doc_url && (
        <div className="bg-surface-800 border border-surface-600 rounded-2xl p-4 mb-6">
          <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-brand-500" />
            ID Document
          </h3>
          {org.id_doc_url.match(/\.(jpg|jpeg|png|webp|gif)$/i) || org.id_doc_url.includes('supabase') ? (
            <div className="rounded-xl overflow-hidden border border-surface-600 max-h-96">
              <img
                src={org.id_doc_url}
                alt="ID Document"
                className="w-full h-full object-contain bg-surface-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          ) : null}
          <a
            href={org.id_doc_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-brand-500 text-sm mt-3 hover:underline"
          >
            <ExternalLink className="w-4 h-4" /> Open in new tab
          </a>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Revenue', value: `TZS ${(org.total_revenue).toLocaleString()}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Ribera Fees', value: `TZS ${(org.ribera_fees).toLocaleString()}`, icon: TrendingUp, color: 'text-brand-500', bg: 'bg-brand-500/10' },
          { label: 'Total Events', value: org.events.length, icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Tickets Sold', value: `${totalSold} / ${totalCapacity}`, icon: Ticket, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-surface-800 border border-surface-600 rounded-2xl p-4">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} />
            </div>
            <p className="text-xl font-black text-white">{value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Balance */}
      <div className="bg-brand-500/10 border border-brand-500/25 rounded-2xl p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">Current Balance (pending payout)</p>
          <p className="text-2xl font-black text-white mt-0.5">TZS {Number(org.balance).toLocaleString()}</p>
        </div>
        <Link href="/payouts" className="text-brand-500 text-sm hover:underline">View Payouts →</Link>
      </div>

      {/* Events */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Events ({org.events.length})</h2>
        {org.events.length === 0 ? (
          <div className="text-center py-12 bg-surface-800 border border-surface-600 rounded-2xl">
            <Calendar className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No events yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {org.events.map((event) => {
              const sold = event.tiers.reduce((s, t) => s + t.sold, 0)
              const capacity = event.tiers.reduce((s, t) => s + t.quantity, 0)
              const pct = capacity > 0 ? Math.round((sold / capacity) * 100) : 0

              const statusColors: Record<string, string> = {
                published: 'text-green-400 bg-green-500/10',
                draft: 'text-gray-400 bg-gray-500/10',
                cancelled: 'text-red-400 bg-red-500/10',
                completed: 'text-blue-400 bg-blue-500/10',
              }

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="flex items-center gap-4 bg-surface-800 border border-surface-600 hover:border-brand-500/40 rounded-2xl p-4 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm line-clamp-1">{event.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {new Date(event.starts_at).toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric' })}
                      {' · '}
                      <span className={`font-medium ${statusColors[event.status]?.split(' ')[0] ?? 'text-gray-400'}`}>{event.status}</span>
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="w-24 flex-shrink-0">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{sold}</span>
                      <span>{capacity}</span>
                    </div>
                    <div className="h-1.5 bg-surface-600 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 text-right mt-0.5">{pct}%</p>
                  </div>

                  <ChevronLeft className="w-4 h-4 text-gray-600 rotate-180 flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </AdminShell>
  )
}

'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { AdminShell } from '@/components/layout/AdminShell'
import type { AdminStats } from '@ribera/types'
import {
  CalendarDays, Ticket, DollarSign, Users,
  Building2, Clock, TrendingUp, ShieldCheck
} from 'lucide-react'

function StatCard({
  label, value, icon: Icon, sub, highlight
}: {
  label: string
  value: string | number
  icon: React.ElementType
  sub?: string
  highlight?: boolean
}) {
  return (
    <div className={`bg-surface-800 border rounded-2xl p-5 ${highlight ? 'border-brand-500/30' : 'border-surface-600'}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${highlight ? 'bg-brand-500/15' : 'bg-surface-700'}`}>
          <Icon className={`w-4 h-4 ${highlight ? 'text-brand-500' : 'text-gray-400'}`} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${highlight ? 'text-brand-500' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  )
}

export default function OverviewPage() {
  const { data, isLoading } = useQuery<{ data: AdminStats }>({
    queryKey: ['admin-overview'],
    queryFn: () => api.get('/admin/overview').then((r) => r.data),
    refetchInterval: 30_000,
  })

  const stats = data?.data

  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-gray-400 text-sm mt-1">Real-time stats · refreshes every 30s</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 bg-surface-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Events" value={stats?.total_events ?? 0} icon={CalendarDays} />
            <StatCard label="Tickets Sold" value={stats?.total_tickets_sold ?? 0} icon={Ticket} highlight />
            <StatCard
              label="Gross Revenue (GMV)"
              value={`TZS ${(stats?.total_gmv ?? 0).toLocaleString()}`}
              icon={TrendingUp}
              highlight
            />
            <StatCard
              label="Ribera Revenue"
              value={`TZS ${(stats?.ribera_revenue ?? 0).toLocaleString()}`}
              icon={DollarSign}
              sub="5% service fees"
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label="Monthly Active Users" value={stats?.mau ?? 0} icon={Users} />
            <StatCard
              label="New Organisers (MTD)"
              value={stats?.new_organisers_month ?? 0}
              icon={Building2}
            />
            <StatCard
              label="Pending Verifications"
              value={stats?.pending_verifications ?? 0}
              icon={Clock}
              highlight={!!stats?.pending_verifications && stats.pending_verifications > 0}
            />
          </div>

          {(stats?.pending_verifications ?? 0) > 0 && (
            <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-5 py-4 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-yellow-300 font-semibold text-sm">
                  {stats?.pending_verifications} organiser{(stats?.pending_verifications ?? 0) > 1 ? 's' : ''} awaiting verification
                </p>
                <p className="text-yellow-600 text-xs mt-0.5">Review applications in the Organisers tab</p>
              </div>
              <a href="/organisers" className="text-yellow-400 text-sm font-semibold hover:underline">Review →</a>
            </div>
          )}
        </>
      )}
    </AdminShell>
  )
}

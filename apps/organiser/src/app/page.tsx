'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Shell } from '@/components/layout/Shell'
import { StatCard } from '@/components/dashboard/StatCard'
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents'
import { CalendarPlus, ScanLine, Wallet, CalendarDays, Ticket, TrendingUp, Users, Zap, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface DashboardStats {
  total_events: number
  live_events: number
  tickets_sold_month: number
  revenue_month: number
  revenue_last_month: number
  revenue_trend_pct: number | null
  total_tickets_ever: number
  total_revenue_ever: number
  currency: string
  balance: number
  active_boosts: number
  upcoming_events: Array<{
    id: string
    title: string
    starts_at: string
    tiers: Array<{ quantity: number; sold: number }>
  }>
}

const QUICK_ACTIONS = [
  { href: '/events/create', icon: CalendarPlus, label: 'New Event', color: 'bg-brand-500', desc: 'Create & publish' },
  { href: '/scanner', icon: ScanLine, label: 'Scanner', color: 'bg-purple-600', desc: 'Check in attendees' },
  { href: '/payouts', icon: Wallet, label: 'Payouts', color: 'bg-green-600', desc: 'Withdraw earnings' },
  { href: '/boost', icon: Zap, label: 'Boost', color: 'bg-orange-500', desc: 'Promote events' },
]

export default function DashboardPage() {
  const { data, isLoading } = useQuery<{ data: DashboardStats }>({
    queryKey: ['organiser-dashboard'],
    queryFn: () => api.get('/organiser/dashboard').then((r) => r.data),
    refetchInterval: 60_000,
  })

  const { data: chartData } = useQuery({
    queryKey: ['organiser-revenue-chart'],
    queryFn: () => api.get('/organiser/analytics/revenue').then(r => r.data.data ?? []),
  })

  const stats = data?.data

  const revTrend = stats?.revenue_trend_pct
  const revTrendIcon = revTrend !== null && revTrend !== undefined
    ? revTrend >= 0 ? ArrowUpRight : ArrowDownRight
    : undefined
  const revTrendColor = revTrend !== null && revTrend !== undefined
    ? revTrend >= 0 ? 'text-green-400' : 'text-red-400'
    : ''

  return (
    <Shell>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1 text-sm">Your events at a glance</p>
      </div>

      {/* Balance banner */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-brand-500/20 to-purple-500/10 border border-brand-500/25 rounded-2xl p-4 mb-6 flex items-center justify-between"
        >
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold">Available Balance</p>
            <p className="text-2xl font-black text-white mt-0.5">
              {stats.currency} {Number(stats.balance).toLocaleString()}
            </p>
          </div>
          <Link
            href="/payouts"
            className="flex items-center gap-1.5 bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors"
          >
            <Wallet className="w-4 h-4" /> Withdraw
          </Link>
        </motion.div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {QUICK_ACTIONS.map(({ href, icon: Icon, label, color, desc }, i) => (
          <motion.div
            key={href}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Link
              href={href}
              className="bg-surface-800 border border-surface-600 rounded-2xl p-3 flex flex-col items-center gap-2 hover:border-brand-500/40 transition-all active:scale-95 group"
            >
              <div className={`${color} rounded-xl p-2.5 group-hover:scale-105 transition-transform`}>
                <Icon className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-white block">{label}</span>
                <span className="text-[10px] text-gray-500 hidden lg:block mt-0.5">{desc}</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Total Events" value={stats?.total_events ?? 0} loading={isLoading} icon={CalendarDays} />
        <StatCard
          label="Live Now"
          value={stats?.live_events ?? 0}
          loading={isLoading}
          highlight
          icon={TrendingUp}
          trend={stats?.live_events ? { direction: 'up', pct: 0 } : undefined}
        />
        <StatCard label="Tickets (MTD)" value={stats?.tickets_sold_month ?? 0} loading={isLoading} icon={Ticket} />
        <StatCard
          label="Revenue (MTD)"
          value={stats ? `${stats.currency} ${stats.revenue_month.toLocaleString()}` : '—'}
          loading={isLoading}
          highlight
          icon={Wallet}
        />
      </div>

      {/* Secondary stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface-800 border border-surface-600 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-green-400" />
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">All-time Revenue</p>
          </div>
          {isLoading ? (
            <div className="h-7 w-28 bg-surface-600 rounded animate-pulse" />
          ) : (
            <p className="text-xl font-black text-white">
              {stats?.currency} {(stats?.total_revenue_ever ?? 0).toLocaleString()}
            </p>
          )}
          <p className="text-xs text-gray-600 mt-0.5">{(stats?.total_tickets_ever ?? 0).toLocaleString()} total tickets</p>
        </div>

        <div className="bg-surface-800 border border-surface-600 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-purple-400" />
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">MoM Revenue</p>
          </div>
          {isLoading ? (
            <div className="h-7 w-20 bg-surface-600 rounded animate-pulse" />
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-xl font-black text-white">
                {revTrend !== null && revTrend !== undefined ? `${revTrend >= 0 ? '+' : ''}${revTrend}%` : '—'}
              </p>
              {revTrendIcon && (
                <span className={`text-sm font-bold ${revTrendColor}`}>
                  {(() => { const Icon = revTrendIcon; return <Icon className="w-4 h-4" /> })()}
                </span>
              )}
            </div>
          )}
          <p className="text-xs text-gray-600 mt-0.5">vs last month</p>
        </div>

        <div className="bg-surface-800 border border-surface-600 rounded-2xl p-4 col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-orange-400" />
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Active Boosts</p>
          </div>
          {isLoading ? (
            <div className="h-7 w-12 bg-surface-600 rounded animate-pulse" />
          ) : (
            <p className="text-xl font-black text-white">{stats?.active_boosts ?? 0}</p>
          )}
          {!isLoading && (stats?.active_boosts ?? 0) === 0 && (
            <Link href="/boost" className="text-xs text-brand-500 mt-0.5 block hover:underline">
              Boost an event →
            </Link>
          )}
        </div>
      </div>

      {/* Revenue chart — last 30 days */}
      {chartData && chartData.length > 0 && (
        <div className="bg-surface-800 border border-surface-600 rounded-2xl p-5 mb-6">
          <p className="text-sm font-bold text-white mb-4">Revenue — last 30 days</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0066FF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0066FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#141420', border: '1px solid #1e1e30', borderRadius: 8 }} labelStyle={{ color: '#9090aa', fontSize: 11 }} formatter={(v: number) => [`TZS ${v.toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#0066FF" strokeWidth={2} fill="url(#rev)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Upcoming events */}
      <UpcomingEvents events={stats?.upcoming_events ?? []} loading={isLoading} />
    </Shell>
  )
}

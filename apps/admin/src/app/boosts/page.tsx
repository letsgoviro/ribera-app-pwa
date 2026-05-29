'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { AdminShell } from '@/components/layout/AdminShell'
import {
  Zap, Flame, Star, MessageSquare, CheckCircle, Clock,
  TrendingUp, DollarSign, Send, AlertCircle, Loader2, X
} from 'lucide-react'

interface AdminBoost {
  id: string
  package: 'spark' | 'flame' | 'inferno'
  status: 'pending' | 'active' | 'expired' | 'cancelled'
  sms_status: 'not_applicable' | 'pending_credits' | 'sent'
  sms_sent_at: string | null
  price_paid: number
  currency: string
  starts_at: string
  ends_at: string
  created_at: string
  impressions: number
  clicks: number
  dpo_ref: string | null
  event: { id: string; title: string; starts_at: string }
  organiser: { id: string; org_name: string }
}

interface Analytics {
  total_revenue: number
  by_package: { package: string; count: number; total_tzs: number }[]
  pending_sms: number
}

const PKG_CONFIG = {
  spark:   { icon: Star,  color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', label: 'Spark'   },
  flame:   { icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30', label: 'Flame'   },
  inferno: { icon: Zap,   color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/30',    label: 'Inferno' },
}

const STATUS_CONFIG = {
  pending:   { color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  active:    { color: 'text-green-400',  bg: 'bg-green-500/15'  },
  expired:   { color: 'text-gray-400',   bg: 'bg-gray-500/15'   },
  cancelled: { color: 'text-red-400',    bg: 'bg-red-500/15'    },
}

function SmsModal({ boost, onClose }: { boost: AdminBoost; onClose: () => void }) {
  const qc = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => api.post(`/admin/boosts/${boost.id}/send-sms`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-boosts'] }); onClose() },
  })

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-surface-800 border border-surface-600 rounded-3xl p-6 max-w-md w-full"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-bold text-white text-lg">Send SMS Blast</h2>
            <p className="text-gray-400 text-sm mt-0.5">{boost.event.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-surface-900 rounded-2xl p-4 mb-5 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Organiser</span>
            <span className="text-white font-medium">{boost.organiser.org_name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Package</span>
            <span className="text-red-400 font-bold">Inferno</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Revenue</span>
            <span className="text-green-400 font-bold">TZS {Number(boost.price_paid).toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-5 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-200 text-xs">Make sure Brevo SMS credits are loaded before sending. Each SMS costs credits.</p>
        </div>

        {mutation.isError && (
          <p className="text-red-400 text-sm bg-red-500/10 rounded-xl px-3 py-2 mb-4">
            SMS send failed. Check Brevo credit balance.
          </p>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-surface-700 rounded-xl text-gray-300 text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {mutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
              : <><Send className="w-4 h-4" /> Send SMS Blast</>
            }
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function BoostsAdminPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending'>('all')
  const [smsFilter, setSmsFilter]       = useState<'all' | 'pending_credits'>('all')
  const [selectedBoost, setSelectedBoost] = useState<AdminBoost | null>(null)

  const { data, isLoading } = useQuery<{ data: AdminBoost[]; analytics: Analytics }>({
    queryKey: ['admin-boosts', statusFilter, smsFilter],
    queryFn: () =>
      api.get(`/admin/boosts?status=${statusFilter}&sms_status=${smsFilter}`).then(r => r.data),
  })

  const boosts    = data?.data ?? []
  const analytics = data?.analytics

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Boost Campaigns</h1>
        <p className="text-gray-400 text-sm mt-0.5">Revenue analytics · SMS queue · Campaign management</p>
      </div>

      {/* Revenue analytics strip */}
      {analytics && (
        <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4">
          <div className="bg-surface-800 border border-surface-600 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-brand-500" />
              <p className="text-gray-400 text-xs font-medium">Total Revenue</p>
            </div>
            <p className="text-2xl font-black text-white">
              TZS {analytics.total_revenue.toLocaleString()}
            </p>
          </div>

          {analytics.by_package.map(pkg => {
            const cfg = PKG_CONFIG[pkg.package as keyof typeof PKG_CONFIG]
            if (!cfg) return null
            const Icon = cfg.icon
            return (
              <div key={pkg.package} className={`bg-surface-800 border ${cfg.border} rounded-2xl p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                  <p className="text-gray-400 text-xs font-medium">{cfg.label}</p>
                </div>
                <p className={`text-xl font-black ${cfg.color}`}>{pkg.count} sold</p>
                <p className="text-gray-500 text-xs">TZS {pkg.total_tzs.toLocaleString()}</p>
              </div>
            )
          })}

          {analytics.pending_sms > 0 && (
            <div className="bg-surface-800 border border-red-500/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-red-400" />
                <p className="text-gray-400 text-xs font-medium">SMS Pending</p>
              </div>
              <p className="text-2xl font-black text-red-400">{analytics.pending_sms}</p>
              <p className="text-gray-500 text-xs">awaiting credits</p>
            </div>
          )}

          <div className="bg-surface-800 border border-surface-600 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-brand-500" />
              <p className="text-gray-400 text-xs font-medium">Total Campaigns</p>
            </div>
            <p className="text-2xl font-black text-white">{boosts.length}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex gap-1.5">
          {(['all', 'active', 'pending'] as const).map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${statusFilter === f ? 'bg-brand-500 text-white' : 'bg-surface-800 border border-surface-600 text-gray-400'}`}>
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={() => setSmsFilter(smsFilter === 'pending_credits' ? 'all' : 'pending_credits')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${smsFilter === 'pending_credits' ? 'bg-red-500/20 border border-red-500/40 text-red-400' : 'bg-surface-800 border border-surface-600 text-gray-400'}`}
        >
          <MessageSquare className="w-3 h-3" /> SMS Pending Only
        </button>
      </div>

      {/* Campaign list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-surface-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : boosts.length === 0 ? (
        <div className="text-center py-20">
          <Zap className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 font-semibold">No boost campaigns found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {boosts.map(b => {
            const pkg = PKG_CONFIG[b.package] ?? PKG_CONFIG.spark
            const st  = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.active
            const Icon = pkg.icon
            const smsPending = b.sms_status === 'pending_credits'
            const smsSent    = b.sms_status === 'sent'
            const endsAt     = new Date(b.ends_at)
            const daysLeft   = Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / 86400000))

            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-surface-800 border ${smsPending ? 'border-red-500/30' : 'border-surface-600'} rounded-2xl px-5 py-4`}
              >
                <div className="flex items-start gap-4">
                  {/* Package icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${pkg.bg}`}>
                    <Icon className={`w-5 h-5 ${pkg.color}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-white text-sm truncate">{b.event.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${st.color} ${st.bg}`}>
                        {b.status}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${pkg.color} ${pkg.bg}`}>
                        {pkg.label}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs">{b.organiser.org_name}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="text-green-400 font-bold">TZS {Number(b.price_paid).toLocaleString()}</span>
                      {b.status === 'active' && <span>{daysLeft}d left</span>}
                      <span>{b.impressions} impressions · {b.clicks} clicks</span>
                    </div>
                  </div>

                  {/* SMS action / status */}
                  <div className="flex-shrink-0">
                    {smsPending && (
                      <button
                        onClick={() => setSelectedBoost(b)}
                        className="flex items-center gap-1.5 bg-red-500 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-red-400 transition-colors"
                      >
                        <Send className="w-3 h-3" /> Send SMS
                      </button>
                    )}
                    {smsSent && (
                      <div className="flex items-center gap-1.5 text-green-400 text-xs font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        SMS sent {b.sms_sent_at ? new Date(b.sms_sent_at).toLocaleDateString() : ''}
                      </div>
                    )}
                    {b.sms_status === 'not_applicable' && b.package !== 'inferno' && (
                      <span className="text-gray-600 text-xs">No SMS</span>
                    )}
                  </div>
                </div>

                {/* Campaign dates */}
                <div className="mt-3 pt-3 border-t border-surface-700 flex items-center gap-4 text-xs text-gray-600">
                  <Clock className="w-3 h-3" />
                  <span>Started {new Date(b.starts_at).toLocaleDateString()}</span>
                  <span>·</span>
                  <span>Ends {new Date(b.ends_at).toLocaleDateString()}</span>
                  {b.dpo_ref && <span className="ml-auto font-mono">ref: {b.dpo_ref.slice(0, 8)}</span>}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {selectedBoost && (
          <SmsModal boost={selectedBoost} onClose={() => setSelectedBoost(null)} />
        )}
      </AnimatePresence>
    </AdminShell>
  )
}

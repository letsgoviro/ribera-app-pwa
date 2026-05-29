'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '@/lib/api'
import { AdminShell } from '@/components/layout/AdminShell'
import type { Payout } from '@ribera/types'
import {
  Wallet, CheckCircle, XCircle, Clock, Loader2,
  ArrowRight, Building2
} from 'lucide-react'

interface AdminPayout extends Payout {
  organiser: { org_name: string }
}

const STATUS_STYLES: Record<'pending' | 'processing' | 'completed' | 'failed', { color: string; bg: string; icon: React.ElementType }> = {
  pending: { color: 'text-yellow-400', bg: 'bg-yellow-500/15', icon: Clock },
  processing: { color: 'text-blue-400', bg: 'bg-blue-500/15', icon: Loader2 },
  completed: { color: 'text-green-400', bg: 'bg-green-500/15', icon: CheckCircle },
  failed: { color: 'text-red-400', bg: 'bg-red-500/15', icon: XCircle },
}

function ProcessModal({ payout, onClose }: { payout: AdminPayout; onClose: () => void }) {
  const [status, setStatus] = useState<'processing' | 'completed' | 'failed'>('completed')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => api.put(`/admin/payouts/${payout.id}`, { status, reference: reference || undefined, note: note || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-payouts'] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-800 border border-surface-600 rounded-3xl p-6 max-w-md w-full">
        <h2 className="font-bold text-white text-lg mb-1">Process Payout</h2>
        <p className="text-gray-400 text-sm mb-5">
          {payout.organiser.org_name} · TZS {Number(payout.amount).toLocaleString()}
          {' via '}<span className="capitalize">{payout.method}</span>
        </p>

        <div className="bg-surface-900 rounded-xl p-3 mb-4 text-sm">
          <p className="text-gray-400 mb-1">Account details:</p>
          {Object.entries(payout.account_details).map(([k, v]) => (
            <p key={k} className="text-white"><span className="text-gray-500 capitalize">{k}:</span> {v}</p>
          ))}
        </div>

        <div className="mb-4">
          <label className="block text-xs text-gray-400 mb-1.5 font-medium">Update status</label>
          <div className="flex gap-2">
            {(['processing', 'completed', 'failed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize border transition-all ${
                  status === s
                    ? STATUS_STYLES[s].color + ' ' + STATUS_STYLES[s].bg + ' border-current/30'
                    : 'text-gray-400 bg-surface-700 border-surface-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs text-gray-400 mb-1.5 font-medium">Reference / Transaction ID (optional)</label>
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. MPESA-123456"
            className="w-full bg-surface-900 border border-surface-600 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="mb-5">
          <label className="block text-xs text-gray-400 mb-1.5 font-medium">Admin note (optional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Internal note..."
            className="w-full bg-surface-900 border border-surface-600 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>

        {mutation.isError && <p className="text-red-400 text-sm mb-4">Update failed — please try again</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-surface-700 rounded-xl text-gray-300 text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 py-3 bg-brand-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PayoutsAdminPage() {
  const [selected, setSelected] = useState<AdminPayout | null>(null)
  const [filterStatus, setFilterStatus] = useState<'pending' | 'all'>('pending')

  const { data, isLoading } = useQuery<{ data: AdminPayout[] }>({
    queryKey: ['admin-payouts', filterStatus],
    queryFn: () => api.get(`/admin/payouts/pending?status=${filterStatus}`).then((r) => r.data),
  })

  const payouts = data?.data ?? []
  const pendingCount = payouts.filter(p => p.status === 'pending').length

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Payouts</h1>
          <p className="text-gray-400 text-sm mt-0.5">{pendingCount} pending · {payouts.length} total shown</p>
        </div>
      </div>
      <div className="flex gap-1.5 mb-6">
        {(['pending', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilterStatus(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${filterStatus === f ? 'bg-brand-500 text-white' : 'bg-surface-800 border border-surface-600 text-gray-400 hover:text-white'}`}>
            {f === 'all' ? 'All' : 'Pending'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-surface-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : payouts.length === 0 ? (
        <div className="text-center py-20">
          <Wallet className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 font-semibold">{filterStatus === 'pending' ? 'No pending payouts' : 'No payouts yet'}</p>
          <p className="text-gray-600 text-sm mt-1">{filterStatus === 'pending' ? 'All withdrawals have been processed' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payouts.map((p) => {
            const cfg = STATUS_STYLES[p.status as 'pending' | 'processing' | 'completed' | 'failed'] ?? STATUS_STYLES.pending
            const Icon = cfg.icon
            return (
              <div
                key={p.id}
                className="bg-surface-800 border border-surface-600 rounded-2xl px-5 py-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 bg-surface-700 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-gray-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-white text-sm">{p.organiser.org_name}</p>
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.color} ${cfg.bg}`}>
                      <Icon className="w-3 h-3" /> {p.status}
                    </span>
                  </div>
                  <p className="text-white font-bold">TZS {Number(p.amount).toLocaleString()}</p>
                  <p className="text-gray-500 text-xs capitalize">
                    {p.method} · Requested {new Date(p.requested_at).toLocaleDateString()}
                  </p>
                </div>

                <button
                  onClick={() => setSelected(p)}
                  className="flex items-center gap-1 text-sm text-brand-500 font-semibold flex-shrink-0 hover:underline"
                >
                  Process <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {selected && <ProcessModal payout={selected} onClose={() => setSelected(null)} />}
    </AdminShell>
  )
}

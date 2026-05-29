'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { Shell } from '@/components/layout/Shell'
import type { Payout } from '@ribera/types'
import { Wallet, ArrowDownToLine, CheckCircle, Clock, XCircle, Loader2, AlertCircle } from 'lucide-react'

function PayoutStatusBadge({ status }: { status: Payout['status'] }) {
  const map = {
    pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
    processing: { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-500/15' },
    completed: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/15' },
    failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/15' },
  }
  const cfg = map[status]
  const Icon = cfg.icon
  return (
    <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${cfg.color} ${cfg.bg}`}>
      <Icon className="w-3 h-3" />{status}
    </span>
  )
}

export default function PayoutsPage() {
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('mpesa')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['payouts'],
    queryFn: () => api.get<{ data: Payout[]; balance: number }>('/organiser/payouts').then(r => r.data),
  })

  const payouts = data?.data ?? []
  const balance = data?.balance ?? 0

  const withdrawMutation = useMutation({
    mutationFn: () => api.post('/organiser/withdraw', {
      amount: Number(amount),
      method,
      account_details: { phone },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payouts'] })
      setShowWithdraw(false)
      setAmount(''); setPhone('')
      setError('')
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { error?: string } } }
      setError(err?.response?.data?.error ?? 'Withdrawal failed')
    },
  })

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-white mb-6">Payouts</h1>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-brand-500/20 to-brand-500/5 border border-brand-500/30 rounded-3xl p-6 mb-6">
        <p className="text-gray-400 text-sm mb-1">Available Balance</p>
        <p className="text-4xl font-black text-white mb-4">
          TZS {balance.toLocaleString()}
        </p>
        <button
          onClick={() => setShowWithdraw(!showWithdraw)}
          disabled={balance < 10000}
          className="flex items-center gap-2 bg-brand-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
        >
          <ArrowDownToLine className="w-4 h-4" />
          Withdraw
        </button>
        {balance < 10000 && (
          <p className="text-xs text-gray-500 mt-2">Minimum withdrawal: TZS 10,000</p>
        )}
      </div>

      {/* Withdraw form */}
      {showWithdraw && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-800 border border-surface-600 rounded-2xl p-4 mb-6 space-y-4"
        >
          <p className="font-bold text-white">Withdrawal Request</p>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Amount (TZS)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="10000"
              max={balance}
              className="w-full bg-surface-900 border border-surface-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Method</label>
            <select value={method} onChange={e => setMethod(e.target.value)}
              className="w-full bg-surface-900 border border-surface-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-500">
              <option value="mpesa">M-Pesa</option>
              <option value="airtel">Airtel Money</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Mobile / Account number</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+255712345678"
              className="w-full bg-surface-900 border border-surface-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-xl px-3 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => setShowWithdraw(false)} className="flex-1 py-3 bg-surface-700 rounded-xl text-gray-300 text-sm font-medium">Cancel</button>
            <button
              onClick={() => withdrawMutation.mutate()}
              disabled={!amount || !phone || withdrawMutation.isPending}
              className="flex-1 py-3 bg-brand-500 text-white rounded-xl text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {withdrawMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
            </button>
          </div>
        </motion.div>
      )}

      {/* History */}
      <h2 className="font-bold text-white mb-3 flex items-center gap-2">
        <Wallet className="w-4 h-4 text-brand-500" />
        Payout History
      </h2>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-surface-800 rounded-xl animate-pulse" />)}</div>
      ) : payouts.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <Wallet className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No payouts yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payouts.map(p => (
            <div key={p.id} className="bg-surface-800 border border-surface-600 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-semibold">TZS {Number(p.amount).toLocaleString()}</p>
                <p className="text-gray-500 text-xs capitalize">{p.method} · {new Date(p.requested_at).toLocaleDateString()}</p>
              </div>
              <PayoutStatusBadge status={p.status} />
            </div>
          ))}
        </div>
      )}
    </Shell>
  )
}

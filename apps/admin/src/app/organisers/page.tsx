'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { AdminShell } from '@/components/layout/AdminShell'
import type { Organiser } from '@ribera/types'
import Link from 'next/link'
import {
  ShieldCheck, ShieldX, Building2, CheckCircle, XCircle,
  Loader2, Search, ExternalLink, ChevronDown, ChevronRight,
} from 'lucide-react'

interface OrgWithProfile extends Organiser {
  profile: { display_name: string | null; phone: string | null }
}

function VerifyModal({
  organiser,
  onClose,
}: {
  organiser: OrgWithProfile
  onClose: () => void
}) {
  const [reason, setReason] = useState('')
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: (approved: boolean) =>
      api.put(`/admin/organisers/${organiser.id}/verify`, { approved, reason: reason || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-organisers'] })
      qc.invalidateQueries({ queryKey: ['admin-overview'] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-800 border border-surface-600 rounded-3xl p-6 max-w-md w-full animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 bg-surface-700 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
            {organiser.logo_url ? (
              <img src={organiser.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div>
            <p className="font-bold text-white">{organiser.org_name}</p>
            <p className="text-gray-400 text-sm">{organiser.profile.display_name ?? 'Unknown'}</p>
          </div>
        </div>

        {organiser.bio && (
          <p className="text-gray-400 text-sm mb-4 bg-surface-900 rounded-xl p-3">{organiser.bio}</p>
        )}

        {organiser.id_doc_url && (
          <a
            href={organiser.id_doc_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-brand-500 text-sm mb-4 hover:underline"
          >
            <ExternalLink className="w-4 h-4" /> View ID document
          </a>
        )}

        <div className="mb-5">
          <label className="block text-xs text-gray-400 mb-1.5 font-medium">
            Rejection reason (optional — only shown if rejecting)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="e.g. ID document unclear, please resubmit"
            className="w-full bg-surface-900 border border-surface-600 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-brand-500 resize-none"
          />
        </div>

        {mutation.isError && (
          <p className="text-red-400 text-sm mb-4">Action failed — please try again</p>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-surface-700 rounded-xl text-gray-300 text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate(false)}
            disabled={mutation.isPending}
            className="flex-1 py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Reject
          </button>
          <button
            onClick={() => mutation.mutate(true)}
            disabled={mutation.isPending}
            className="flex-1 py-3 bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Approve
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OrganisersPage() {
  const [filter, setFilter] = useState<'pending' | 'verified' | 'all'>('pending')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<OrgWithProfile | null>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery<{ data: OrgWithProfile[] }>({
    queryKey: ['admin-organisers', filter],
    queryFn: () =>
      api.get('/admin/organisers', {
        params: filter === 'all' ? {} : { verified: filter === 'verified' },
      }).then((r) => r.data),
  })

  const organisers = (data?.data ?? []).filter((o) =>
    !search || o.org_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Organisers</h1>
          <p className="text-gray-400 text-sm mt-0.5">{data?.data.length ?? 0} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organisers..."
            className="w-full bg-surface-800 border border-surface-600 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex gap-1 bg-surface-800 border border-surface-600 rounded-xl p-1">
          {(['pending', 'verified', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                filter === f ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-surface-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : organisers.length === 0 ? (
        <div className="text-center py-20">
          <ShieldCheck className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 font-semibold">No organisers found</p>
          {filter === 'pending' && (
            <p className="text-gray-600 text-sm mt-1">All applications have been reviewed</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {organisers.map((org) => (
            <div
              key={org.id}
              className="bg-surface-800 border border-surface-600 rounded-2xl px-5 py-4 flex items-center gap-4 hover:border-brand-500/30 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-surface-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                {org.logo_url ? (
                  <img src={org.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-5 h-5 text-gray-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white text-sm">{org.org_name}</p>
                  {org.verified ? (
                    <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/15 px-2 py-0.5 rounded-full font-semibold">
                      <CheckCircle className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="text-xs text-yellow-400 bg-yellow-500/15 px-2 py-0.5 rounded-full font-semibold">
                      Pending
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-xs mt-0.5">
                  {org.profile.display_name ?? 'Unknown'} · Joined {new Date(org.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {!org.verified && (
                <button
                  onClick={() => setSelected(org)}
                  className="flex items-center gap-1.5 text-sm text-brand-500 font-semibold bg-brand-500/10 hover:bg-brand-500/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Review
                </button>
                )}
                <Link
                  href={`/organisers/${org.id}`}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors px-2 py-1.5 rounded-lg hover:bg-surface-700"
                >
                  Details <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && <VerifyModal organiser={selected} onClose={() => setSelected(null)} />}
    </AdminShell>
  )
}

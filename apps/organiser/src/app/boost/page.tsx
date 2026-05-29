'use client'

import { useState, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { Shell } from '@/components/layout/Shell'
import type { Event, PaginatedResponse } from '@ribera/types'
import { BOOST_PACKAGES } from '@ribera/config'
import { Zap, Flame, Star, Loader2, Check, X, ChevronDown } from 'lucide-react'

const PKG_STYLES = {
  spark:   { gradient: 'from-yellow-500/15 to-yellow-500/5',  border: 'border-yellow-500/30',  active: 'border-yellow-400',  icon: Star,  iconColor: 'text-yellow-400',  badge: 'bg-yellow-500/20 text-yellow-400' },
  flame:   { gradient: 'from-orange-500/15 to-orange-500/5',  border: 'border-orange-500/30',  active: 'border-orange-400',  icon: Flame, iconColor: 'text-orange-400',  badge: 'bg-orange-500/20 text-orange-400' },
  inferno: { gradient: 'from-red-500/15 to-red-500/5',        border: 'border-red-500/30',      active: 'border-red-400',     icon: Zap,   iconColor: 'text-red-400',     badge: 'bg-red-500/20 text-red-400' },
} as const

// make features array writable
type PkgId = 'spark' | 'flame' | 'inferno'

function BoostPageContent() {
  const searchParams = useSearchParams()
  const preselectedEventId = searchParams.get('event_id') ?? ''
  const [selectedEvent, setSelectedEvent] = useState(preselectedEventId)
  const [selectedPkg, setSelectedPkg] = useState<PkgId | null>(null)
  const [expandedPkg, setExpandedPkg] = useState<PkgId | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { data: eventsData } = useQuery({
    queryKey: ['organiser-events-boost'],
    queryFn: () => api.get<PaginatedResponse<Event>>('/organiser/events', { params: { status: 'published', limit: 50 } }).then(r => r.data),
  })

  const events = eventsData?.data ?? []
  const pkg = selectedPkg ? BOOST_PACKAGES.find(p => p.id === selectedPkg) : null

  const handleBoost = async () => {
    if (!selectedEvent || !selectedPkg) return
    setLoading(true); setError('')
    try {
      const base = window.location.origin
      const { data } = await api.post('/boost/purchase', {
        event_id: selectedEvent,
        package_id: selectedPkg,
        redirect_url: `${base}/boost/success`,
        back_url: `${base}/boost`,
      })
      window.location.href = data.data.payment_url
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      setError(err?.response?.data?.error ?? 'Failed to start boost')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Shell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Zap className="w-6 h-6 text-brand-500" />
          Boost Event
        </h1>
        <p className="text-gray-400 text-sm mt-1">Sell more tickets with targeted promotion across the app</p>
      </div>

      {/* What you unlock */}
      <div className="bg-brand-500/10 border border-brand-500/25 rounded-2xl p-4 mb-6">
        <p className="text-brand-500 font-bold text-sm mb-2">All boost packages include:</p>
        <div className="grid grid-cols-2 gap-1.5 text-xs text-gray-300">
          <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />Full attendee analytics</div>
          <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />Name, email & phone</div>
          <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />Email reminders</div>
          <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />Featured placement</div>
        </div>
      </div>

      {/* Event selector */}
      <div className="mb-5">
        <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">Select event to boost</label>
        <select
          value={selectedEvent}
          onChange={e => setSelectedEvent(e.target.value)}
          className="w-full bg-surface-800 border border-surface-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-500"
        >
          <option value="">Choose a published event...</option>
          {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
      </div>

      {/* Packages */}
      <div className="space-y-3 mb-5">
        {BOOST_PACKAGES.map((p) => {
          const s = PKG_STYLES[p.id as PkgId]
          const Icon = s.icon
          const isSelected = selectedPkg === p.id
          const isExpanded = expandedPkg === p.id || isSelected
          const features = p.features as Array<{ label: string; included: boolean }>

          return (
            <motion.div
              key={p.id}
              layout
              onClick={() => setSelectedPkg(isSelected ? null : p.id as PkgId)}
              className={`cursor-pointer bg-gradient-to-br border rounded-2xl overflow-hidden transition-all ${
                isSelected
                  ? `${p.gradient} ${s.active} ring-1 ring-current`
                  : `from-surface-800 to-surface-800 border-surface-600`
              }`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-white/10' : 'bg-surface-700'}`}>
                    <Icon className={`w-5 h-5 ${isSelected ? s.iconColor : 'text-gray-400'}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-black text-white text-base">{p.name}</p>
                      {p.badge && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.badge}`}>
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs font-medium mb-1 ${isSelected ? s.iconColor : 'text-gray-500'}`}>{p.tagline}</p>
                    <p className="text-gray-400 text-xs leading-relaxed">{p.description}</p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-white text-base">TZS {p.price_tzs.toLocaleString()}</p>
                    <p className="text-gray-500 text-xs">${p.price_usd} · {p.duration_days} days</p>
                  </div>
                </div>

                {/* Feature toggle */}
                <button
                  onClick={(e) => { e.stopPropagation(); setExpandedPkg(isExpanded ? null : p.id as PkgId) }}
                  className="flex items-center gap-1 text-xs text-gray-500 mt-3 hover:text-gray-300 transition-colors"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  {isExpanded ? 'Hide' : 'See'} what's included
                </button>
              </div>

              {/* Features list */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-white/5 px-4 py-3 space-y-2"
                >
                  {features.map((f, fi) => (
                    <div key={fi} className={`flex items-center gap-2.5 text-xs ${f.included ? 'text-gray-300' : 'text-gray-600'}`}>
                      {f.included
                        ? <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                        : <X className="w-3.5 h-3.5 text-gray-700 flex-shrink-0" />
                      }
                      {f.label}
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Summary + CTA */}
      {pkg && selectedEvent && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-800 border border-surface-600 rounded-2xl p-4 mb-4"
        >
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="text-gray-400">{pkg.name} · {pkg.duration_days} days</span>
            <span className="text-white font-bold">TZS {pkg.price_tzs.toLocaleString()}</span>
          </div>
          <p className="text-xs text-gray-600">Secured by DPO Pay · No refunds after boost starts</p>
        </motion.div>
      )}

      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">{error}</p>
      )}

      <button
        onClick={handleBoost}
        disabled={!selectedEvent || !selectedPkg || loading}
        className="w-full bg-brand-500 text-white rounded-2xl py-4 font-bold disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        {loading
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
          : <><Zap className="w-5 h-5" /> {pkg ? `Boost with ${pkg.name} — TZS ${pkg.price_tzs.toLocaleString()}` : 'Select a package'}</>
        }
      </button>
    </Shell>
  )
}

export default function BoostPage() {
  return (
    <Suspense>
      <BoostPageContent />
    </Suspense>
  )
}

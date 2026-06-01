'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Event, PaginatedResponse } from '@ribera/types'
import { EVENT_CATEGORIES } from '@ribera/config'
import { EventCard } from '@/components/events/EventCard'
import { BottomNav } from '@/components/layout/BottomNav'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, MapPin } from 'lucide-react'
import { useState } from 'react'

export default function DiscoverPage() {
  const [category, setCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'popular'>('date')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['events:discover', category, search, sortBy],
    queryFn: () =>
      api
        .get<PaginatedResponse<Event>>('/events', {
          params: {
            category: category ?? undefined,
            search: search || undefined,
            limit: 30,
          },
        })
        .then((r) => r.data),
  })

  return (
    <div className="min-h-dvh bg-surface-900 pb-24 safe-top">
      {/* Header */}
      <header className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-black text-white">Discover</h1>
          <div className="flex items-center gap-2">
            <a
              href={`https://www.google.com/maps/search/events+${encodeURIComponent(category ? EVENT_CATEGORIES.find(c => c.id === category)?.label ?? '' : '')}+Tanzania/@-6.7924,39.2083,12z`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-800 border border-surface-600 rounded-full text-xs font-semibold text-gray-300"
            >
              <MapPin className="w-3 h-3" />
              Map
            </a>
            <button
              onClick={() => setSortBy((s) => (s === 'date' ? 'popular' : 'date'))}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-800 border border-surface-600 rounded-full text-xs font-semibold text-gray-300"
            >
              <SlidersHorizontal className="w-3 h-3" />
              {sortBy === 'date' ? 'By date' : 'Popular'}
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, artists, venues…"
            className="w-full bg-surface-800 text-white placeholder:text-gray-500 rounded-2xl pl-10 pr-4 py-3 text-sm border border-surface-600 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={() => setCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              !category ? 'bg-brand-500 text-white' : 'bg-surface-800 text-gray-400 border border-surface-600'
            }`}
          >
            All
          </button>
          {EVENT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id === category ? null : cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                category === cat.id ? 'bg-brand-500 text-white' : 'bg-surface-800 text-gray-400 border border-surface-600'
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4">
        {isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-surface-800 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📡</p>
            <p className="font-semibold text-white">Couldn't load events</p>
            <p className="text-sm text-gray-500 mt-1">Check your connection and try again</p>
          </div>
        ) : (
          <motion.div
            className="grid gap-4"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
          >
            {data?.data.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
            {!data?.data?.length && (
              <div className="text-center py-20 text-gray-500">
                <p className="text-5xl mb-4">🔭</p>
                <p className="font-semibold text-white">Nothing found</p>
                <p className="text-sm mt-1">Try a different category or search term</p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

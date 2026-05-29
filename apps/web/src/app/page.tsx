'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Event, PaginatedResponse } from '@ribera/types'
import { EVENT_CATEGORIES } from '@ribera/config'
import { EventCard } from '@/components/events/EventCard'
import { BottomNav } from '@/components/layout/BottomNav'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bell, MapPin, Calendar, TrendingUp, LogIn } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type DateFilter = 'all' | 'today' | 'weekend' | 'month'

function FeaturedEventHero({ event }: { event: Event }) {
  const starts = new Date(event.starts_at)
  const lowestPrice = event.tiers?.reduce((m, t) => (t.price < m ? t.price : m), Infinity) ?? 0
  const isFree = lowestPrice === 0 || (event.tiers?.length ?? 0) === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/events/${event.slug ?? event.id}`}>
        <div className="mx-4 relative rounded-3xl overflow-hidden h-52 active:scale-[0.98] transition-transform">
          {event.cover_image_url ? (
            <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-500/40 to-purple-600/40 flex items-center justify-center text-7xl">
              🎉
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Featured badge */}
          <div className="absolute top-3 left-3">
            <span className="flex items-center gap-1 bg-brand-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" /> Featured
            </span>
          </div>

          {/* Price badge */}
          <div className="absolute top-3 right-3">
            <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
              {isFree ? 'Free' : `From TZS ${lowestPrice.toLocaleString()}`}
            </span>
          </div>

          {/* Event info */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-white font-black text-lg leading-tight line-clamp-2 mb-1.5">{event.title}</p>
            <div className="flex items-center gap-3 text-white/80 text-xs">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {starts.toLocaleDateString('en-TZ', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              {event.venue_name && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{event.venue_name}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function FeaturedSkeleton() {
  return <div className="mx-4 h-52 bg-surface-800 rounded-3xl animate-pulse" />
}

const DATE_FILTERS: { id: DateFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'weekend', label: 'Weekend' },
  { id: 'month', label: 'This Month' },
]

function getDateRange(filter: DateFilter): { from?: string; to?: string } {
  const now = new Date()
  if (filter === 'today') {
    const end = new Date(now); end.setHours(23, 59, 59, 999)
    return { from: now.toISOString(), to: end.toISOString() }
  }
  if (filter === 'weekend') {
    const day = now.getDay()
    const daysToFri = day <= 5 ? 5 - day : 6
    const fri = new Date(now); fri.setDate(now.getDate() + daysToFri); fri.setHours(0, 0, 0, 0)
    const sun = new Date(fri); sun.setDate(fri.getDate() + 2); sun.setHours(23, 59, 59, 999)
    return { from: fri.toISOString(), to: sun.toISOString() }
  }
  if (filter === 'month') {
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    return { from: now.toISOString(), to: end.toISOString() }
  }
  return {}
}

export default function HomePage() {
  const router = useRouter()
  const [category, setCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [userName, setUserName] = useState<string | null>(null)
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        setIsGuest(true)
        return
      }
      const name = data.user?.user_metadata?.['full_name'] ?? data.user?.email?.split('@')[0] ?? null
      setUserName(name)
    })
  }, [])

  const dateRange = getDateRange(dateFilter)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['events', category, search, dateFilter],
    queryFn: () =>
      api.get<PaginatedResponse<Event>>('/events', {
        params: {
          category: category ?? undefined,
          search: search || undefined,
          limit: 20,
          ...dateRange,
        },
      }).then((r) => r.data),
    retry: 1,
  })

  const events = data?.data ?? []
  const featuredEvent = events[0]
  const remainingEvents = events.slice(1)

  return (
    <div className="min-h-dvh bg-surface-900 pb-24">
      {/* Header */}
      <header className="px-4 pt-12 pb-4 safe-top">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Ribera" className="w-9 h-9 rounded-xl" />
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                <span className="text-brand-500">Ribera</span>
              </h1>
              {userName && (
                <p className="text-gray-400 text-xs mt-0.5">
                  Hey {userName.split(' ')[0]} 👋
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isGuest ? (
              <button
                onClick={() => router.push('/auth')}
                className="flex items-center gap-1.5 bg-brand-500 text-white text-xs font-bold px-3 py-2 rounded-full hover:bg-brand-600 transition-colors active:scale-[0.97]"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign in
              </button>
            ) : (
              <Link
                href="/notifications"
                className="w-10 h-10 bg-surface-800 border border-surface-600 rounded-full flex items-center justify-center relative"
              >
                <Bell className="w-4 h-4 text-gray-400" />
              </Link>
            )}
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, venues, artists..."
            className="w-full bg-surface-800 text-white placeholder:text-gray-500 rounded-2xl pl-10 pr-4 py-3.5 text-sm border border-surface-600 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Date filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-none pb-0.5">
          {DATE_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setDateFilter(f.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                dateFilter === f.id
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                  : 'bg-surface-800 text-gray-400 border border-surface-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
          <button
            onClick={() => setCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              !category ? 'bg-white/10 text-white border border-white/20' : 'bg-surface-800 text-gray-500 border border-surface-600'
            }`}
          >
            All
          </button>
          {EVENT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id === category ? null : cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                category === cat.id
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-surface-800 text-gray-500 border border-surface-600'
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          <FeaturedSkeleton />
          <div className="px-4 space-y-3">
            <p className="text-xs text-gray-600 font-semibold uppercase tracking-widest">Upcoming</p>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 bg-surface-800 rounded-3xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : isError ? (
        <div className="text-center py-20 px-6">
          <p className="text-5xl mb-4">📡</p>
          <p className="font-bold text-white text-lg">Couldn't load events</p>
          <p className="text-sm text-gray-500 mt-1">Check your connection and try again</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 px-6">
          <p className="text-5xl mb-4">🎭</p>
          <p className="font-bold text-white text-lg">No events found</p>
          <p className="text-sm text-gray-500 mt-1">Try a different category, date, or search term</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Featured hero card */}
          {featuredEvent && <FeaturedEventHero event={featuredEvent} />}

          {/* Remaining events */}
          {remainingEvents.length > 0 && (
            <div className="px-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">Upcoming Events</p>
                <Link href="/discover" className="text-brand-500 text-xs font-semibold">See all →</Link>
              </div>
              <motion.div
                className="grid gap-4"
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
              >
                {remainingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </motion.div>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  )
}

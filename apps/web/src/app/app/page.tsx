'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Event, PaginatedResponse } from '@ribera/types'
import { EVENT_CATEGORIES } from '@ribera/config'
import { EventCard } from '@/components/events/EventCard'
import { BottomNav } from '@/components/layout/BottomNav'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bell, MapPin, Calendar, TrendingUp, LogIn, SlidersHorizontal } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type DateFilter = 'all' | 'today' | 'weekend' | 'month'

const CATEGORY_BG: Record<string, string> = {
  music:     'bg-purple-500/15 text-purple-300 border-purple-500/30',
  sports:    'bg-green-500/15 text-green-300 border-green-500/30',
  nightlife: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
  arts:      'bg-orange-500/15 text-orange-300 border-orange-500/30',
  food:      'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  business:  'bg-blue-500/15 text-blue-300 border-blue-500/30',
  comedy:    'bg-amber-500/15 text-amber-300 border-amber-500/30',
  wellness:  'bg-teal-500/15 text-teal-300 border-teal-500/30',
}

function FeaturedEventHero({ event }: { event: Event }) {
  const starts = new Date(event.starts_at)
  const lowestPrice = event.tiers?.reduce((m, t) => (t.price < m ? t.price : m), Infinity) ?? 0
  const isFree = lowestPrice === 0 || (event.tiers?.length ?? 0) === 0
  const currency = event.tiers?.[0]?.currency ?? 'TZS'

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/events/${event.slug ?? event.id}`}>
        <div className="mx-4 relative rounded-3xl overflow-hidden h-64 active:scale-[0.98] transition-transform cursor-pointer group">
          {/* Blurred background image for depth effect */}
          {event.cover_image_url && (
            <div className="absolute inset-0 scale-110">
              <img
                src={event.cover_image_url}
                alt=""
                aria-hidden
                className="w-full h-full object-cover blur-2xl opacity-60"
              />
            </div>
          )}

          {/* Main image */}
          {event.cover_image_url ? (
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/40 to-purple-600/40 flex items-center justify-center text-7xl">
              🎉
            </div>
          )}

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

          {/* Featured badge */}
          <div className="absolute top-4 left-4">
            <span className="flex items-center gap-1.5 bg-brand-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg shadow-brand-500/30">
              <TrendingUp className="w-3 h-3" /> Featured
            </span>
          </div>

          {/* Organiser — top right */}
          {event.organiser && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/50 backdrop-blur-md rounded-full px-2.5 py-1.5 border border-white/10">
              <div className="w-4 h-4 rounded-full bg-surface-600 flex items-center justify-center text-[9px] font-black text-brand-500 overflow-hidden flex-shrink-0">
                {event.organiser.logo_url ? (
                  <img src={event.organiser.logo_url} alt="" className="w-full h-full object-cover" />
                ) : event.organiser.org_name[0]}
              </div>
              <span className="text-white/90 text-[11px] font-semibold truncate max-w-[100px]">
                {event.organiser.org_name}
              </span>
              {event.organiser.verified && (
                <span className="text-brand-500 text-[10px] font-black">✓</span>
              )}
            </div>
          )}

          {/* Event info */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            {/* Date */}
            <p className="text-brand-500 text-[11px] font-bold uppercase tracking-widest mb-1.5">
              {starts.toLocaleDateString('en-TZ', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
            </p>

            <p className="text-white font-black text-2xl leading-tight line-clamp-2 mb-2.5 tracking-tight">
              {event.title}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-white/70 text-xs">
                {event.venue_name && (
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 flex-shrink-0 text-brand-500" />
                    <span className="truncate">{event.venue_name}</span>
                  </span>
                )}
              </div>

              {/* Price badge */}
              <span className="flex-shrink-0 bg-white/10 backdrop-blur-sm border border-white/15 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                {isFree ? 'Free' : `From ${currency} ${lowestPrice.toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function FeaturedSkeleton() {
  return <div className="mx-4 h-64 bg-surface-800 rounded-3xl animate-pulse" />
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

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function UserAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-brand-500/25 flex-shrink-0">
      {initials}
    </div>
  )
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
      if (!data.user) { setIsGuest(true); return }
      const name = data.user?.user_metadata?.['full_name'] ?? data.user?.email?.split('@')[0] ?? null
      setUserName(name)
    })
  }, [])

  const dateRange = getDateRange(dateFilter)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['events', category, search, dateFilter],
    queryFn: () =>
      api.get<PaginatedResponse<Event>>('/events', {
        params: { category: category ?? undefined, search: search || undefined, limit: 20, ...dateRange },
      }).then((r) => r.data),
    retry: 1,
  })

  const events = data?.data ?? []
  const featuredEvent = events[0]
  const trendingEvents = events.slice(1, 4)
  const upcomingEvents = events.slice(4)

  return (
    <div className="min-h-dvh bg-surface-900 pb-28">
      {/* Ambient gradient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/8 rounded-full blur-3xl" />
        <div className="absolute top-20 right-[-80px] w-72 h-72 bg-purple-600/6 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative px-4 pt-14 pb-5 safe-top">
        <div className="flex items-center justify-between mb-6">
          {/* Left: logo + greeting */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Ribera"
              className="w-10 h-10 rounded-2xl shadow-lg shadow-brand-500/20"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <div>
              {userName ? (
                <>
                  <p className="text-gray-400 text-xs font-medium leading-none mb-1">
                    {getGreeting()}
                  </p>
                  <h1 className="text-white font-black text-lg leading-none tracking-tight">
                    {userName.split(' ')[0]} 👋
                  </h1>
                </>
              ) : (
                <h1 className="text-2xl font-black tracking-tight leading-none">
                  <span className="text-brand-500">Ribera</span>
                </h1>
              )}
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            {isGuest ? (
              <button
                onClick={() => router.push('/auth')}
                className="flex items-center gap-1.5 bg-brand-500 text-white text-xs font-black px-4 py-2.5 rounded-full shadow-lg shadow-brand-500/30 hover:bg-brand-600 transition-colors active:scale-[0.97]"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign in
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/notifications"
                  className="w-10 h-10 bg-surface-800 border border-surface-600 rounded-full flex items-center justify-center relative hover:border-brand-500/40 transition-colors"
                >
                  <Bell className="w-4 h-4 text-gray-400" />
                </Link>
                {userName && <UserAvatar name={userName} />}
              </div>
            )}
          </div>
        </div>

        {/* Premium pill search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, venues, artists..."
            className="w-full bg-white/5 backdrop-blur-sm text-white placeholder:text-gray-500 rounded-full pl-11 pr-12 py-3.5 text-sm border border-white/10 focus:outline-none focus:border-brand-500/60 focus:bg-white/8 transition-all"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-surface-700 border border-surface-600 rounded-full flex items-center justify-center hover:border-brand-500/40 transition-colors">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>

        {/* Date quick-filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-none pb-0.5">
          {DATE_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setDateFilter(f.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                dateFilter === f.id
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                  : 'bg-surface-800 text-gray-400 border border-surface-600 hover:border-surface-500'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Category pills — colored per category */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
          <button
            onClick={() => setCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border ${
              !category
                ? 'bg-white/12 text-white border-white/20'
                : 'bg-surface-800 text-gray-500 border-surface-600 hover:border-surface-500'
            }`}
          >
            All
          </button>
          {EVENT_CATEGORIES.map((cat) => {
            const active = category === cat.id
            const colorClass = CATEGORY_BG[cat.id] ?? 'bg-white/10 text-gray-300 border-white/10'
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id === category ? null : cat.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                  active
                    ? `${colorClass} shadow-sm`
                    : 'bg-surface-800 text-gray-500 border-surface-600 hover:border-surface-500'
                }`}
              >
                <span className="text-base leading-none">{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>
      </header>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-5">
          <FeaturedSkeleton />
          <div className="px-4 space-y-4">
            <div className="h-5 w-32 bg-surface-800 rounded-lg animate-pulse" />
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
        <div className="space-y-6">
          {/* Featured hero card */}
          {featuredEvent && <FeaturedEventHero event={featuredEvent} />}

          {/* Trending section */}
          {trendingEvents.length > 0 && (
            <div className="px-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-black text-lg tracking-tight">
                  🔥 Trending
                </h2>
                <Link
                  href="/discover"
                  className="text-brand-500 text-xs font-bold hover:text-brand-400 transition-colors"
                >
                  See all →
                </Link>
              </div>
              <motion.div
                className="grid gap-4"
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
              >
                {trendingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </motion.div>
            </div>
          )}

          {/* Coming Up section */}
          {upcomingEvents.length > 0 && (
            <div className="px-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-black text-lg tracking-tight">
                  📅 Coming Up
                </h2>
                <Link
                  href="/discover"
                  className="text-brand-500 text-xs font-bold hover:text-brand-400 transition-colors"
                >
                  See all →
                </Link>
              </div>
              <motion.div
                className="grid gap-4"
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
              >
                {upcomingEvents.map((event) => (
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

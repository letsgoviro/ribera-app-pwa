import Link from 'next/link'
import { Calendar, ArrowRight } from 'lucide-react'
import type { OrganiserStats } from '@ribera/types'

type UpcomingEvent = OrganiserStats['upcoming_events'][number]

interface Props {
  events: UpcomingEvent[]
  loading: boolean
}

export function UpcomingEvents({ events, loading }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-white">Upcoming Events</h2>
        <Link href="/events" className="text-sm text-brand-500 hover:text-brand-400 flex items-center gap-1">
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-surface-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-surface-800 border border-surface-600 rounded-2xl p-8 text-center">
          <Calendar className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No upcoming events</p>
          <Link href="/events/create" className="mt-3 inline-block text-sm text-brand-500 hover:text-brand-400">
            Create your first event →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => {
            const tiers = (ev as any).tiers as { quantity: number; sold: number }[] | undefined
            const totalTickets = tiers?.reduce((s, t) => s + t.quantity, 0) ?? ev.total_tickets ?? 0
            const soldTickets = tiers?.reduce((s, t) => s + t.sold, 0) ?? ev.tickets_sold ?? 0
            const pct = totalTickets > 0 ? Math.round((soldTickets / totalTickets) * 100) : 0

            return (
              <Link key={ev.id} href={`/events/${ev.id}`}>
                <div className="bg-surface-800 border border-surface-600 rounded-2xl p-4 hover:border-brand-500/40 transition-all flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{ev.title}</p>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {new Date(ev.starts_at).toLocaleDateString('en-TZ', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-white">{soldTickets}/{totalTickets}</p>
                    <div className="w-24 h-1.5 bg-surface-700 rounded-full mt-1.5">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-accent-500' : 'bg-brand-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{pct}% sold</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import type { Ticket, OrderStatus } from '@ribera/types'
import { BottomNav } from '@/components/layout/BottomNav'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { Receipt, Loader2, CalendarDays, Ticket as TicketIcon } from 'lucide-react'
import Link from 'next/link'

// Derived order shape from grouped tickets
interface DerivedOrder {
  order_id: string
  event_title: string
  event_cover: string | null
  event_starts_at: string | null
  status: OrderStatus
  currency: string
  total: number
  ticket_count: number
  created_at: string
}

const STATUS_BADGE: Record<OrderStatus, { label: string; className: string }> = {
  paid: { label: 'Paid', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  pending: { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  reserved: { label: 'Reserved', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  refunded: { label: 'Refunded', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

function OrderCard({ order }: { order: DerivedOrder }) {
  const badge = STATUS_BADGE[order.status] ?? STATUS_BADGE['pending']

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.2 }}
      className="bg-surface-800 border border-surface-600 rounded-3xl overflow-hidden"
    >
      {/* Cover strip */}
      <div className="relative h-20 bg-surface-700">
        {order.event_cover ? (
          <img src={order.event_cover} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🎉</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-800/80 to-transparent" />

        {/* Status badge */}
        <div className="absolute top-2.5 right-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border backdrop-blur-sm ${badge.className}`}>
            {badge.label}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <p className="font-black text-white text-base leading-tight mb-1 line-clamp-2">{order.event_title}</p>

        <p className="text-gray-600 text-xs font-mono mb-3">
          Order #{order.order_id.slice(0, 8).toUpperCase()}
        </p>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {order.event_starts_at && (
              <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                <CalendarDays className="w-3.5 h-3.5" />
                {new Date(order.event_starts_at).toLocaleDateString('en-TZ', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-gray-500 text-xs">
              <TicketIcon className="w-3.5 h-3.5" />
              {order.ticket_count} {order.ticket_count === 1 ? 'ticket' : 'tickets'}
            </div>
          </div>

          <div className="text-right">
            <p className="text-white font-black text-lg">
              {order.total === 0 ? 'Free' : formatCurrency(order.total, order.currency)}
            </p>
            <p className="text-gray-600 text-xs">
              {new Date(order.created_at).toLocaleDateString('en-TZ', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function OrdersPage() {
  const { checking } = useRequireAuth()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-orders-derived'],
    queryFn: () => api.get<{ data: Ticket[] }>('/tickets/my').then((r) => r.data),
    enabled: !checking,
  })

  const tickets: Ticket[] = data?.data ?? []

  // Group tickets by order_id and derive order-level info
  const ordersMap = new Map<string, DerivedOrder>()
  for (const ticket of tickets) {
    const existing = ordersMap.get(ticket.order_id)
    if (existing) {
      existing.ticket_count += 1
      // Accumulate price if tier price is available
      if (ticket.tier?.price) {
        existing.total += ticket.tier.price
      }
    } else {
      ordersMap.set(ticket.order_id, {
        order_id: ticket.order_id,
        event_title: ticket.event?.title ?? 'Unknown Event',
        event_cover: ticket.event?.cover_image_url ?? null,
        event_starts_at: ticket.event?.starts_at ?? null,
        // Map ticket status to order status for display
        status: ticket.status === 'valid'
          ? 'paid'
          : ticket.status === 'cancelled'
          ? 'cancelled'
          : ticket.status === 'used'
          ? 'paid'
          : 'pending',
        currency: ticket.tier?.currency ?? 'TZS',
        total: ticket.tier?.price ?? 0,
        ticket_count: 1,
        created_at: ticket.created_at,
      })
    }
  }

  const orders = Array.from(ordersMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  if (checking) {
    return (
      <div className="min-h-dvh bg-surface-900 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-surface-900 pb-24 safe-top">
      {/* Header */}
      <header className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-black text-white">Order History</h1>
        <p className="text-gray-500 text-sm mt-0.5">All your ticket purchases</p>
      </header>

      <div className="px-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-surface-800 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-16 px-4">
            <p className="text-red-400 text-sm">Failed to load orders. Please try again.</p>
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 px-4"
          >
            <div className="w-20 h-20 bg-surface-800 border border-surface-600 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <Receipt className="w-10 h-10 text-gray-600" />
            </div>
            <p className="text-white font-bold text-lg mb-1">No orders yet</p>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              Your ticket purchase history will appear here once you buy your first ticket.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-brand-500 text-white px-6 py-3 rounded-2xl font-bold text-sm active:scale-[0.97] transition-transform"
            >
              Browse Events →
            </Link>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-4"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          >
            <p className="text-gray-600 text-xs font-medium pb-1">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            </p>
            {orders.map((order) => (
              <OrderCard key={order.order_id} order={order} />
            ))}
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

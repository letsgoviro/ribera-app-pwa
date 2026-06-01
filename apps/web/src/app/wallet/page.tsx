'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import type { Ticket } from '@ribera/types'
import { BottomNav } from '@/components/layout/BottomNav'
import { Ticket as TicketIcon, Calendar, MapPin, X, QrCode, CheckCircle, XCircle, Loader2, Share2, Download, Send, AlertCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import Link from 'next/link'

function RatingWidget({ eventId }: { eventId: string }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const submit = async (r: number) => {
    setRating(r)
    try {
      await api.post('/reviews', { event_id: eventId, rating: r })
      setSubmitted(true)
    } catch {
      setError('Already reviewed')
    }
  }

  if (submitted) return <p className="text-center text-green-400 text-xs">⭐ Thanks for your review!</p>

  return (
    <div className="flex items-center justify-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => submit(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className={`text-2xl transition-transform active:scale-110 ${(hover || rating) >= star ? 'text-yellow-400' : 'text-surface-600'}`}
        >
          ★
        </button>
      ))}
      {error && <p className="text-xs text-gray-500 ml-2">{error}</p>}
    </div>
  )
}

function QRCanvas({ token }: { token: string }) {
  return (
    <QRCodeCanvas
      value={token}
      size={220}
      marginSize={2}
      bgColor="#ffffff"
      fgColor="#0a0a0a"
      className="rounded-2xl"
    />
  )
}

function TicketCard({ ticket, onView }: { ticket: Ticket; onView: (t: Ticket) => void }) {
  const isUsed = ticket.status === 'used'
  const isCancelled = ticket.status === 'cancelled'
  const isValid = !isUsed && !isCancelled

  const tierTypeLabel = ticket.tier?.tier_type && ticket.tier.tier_type !== 'general'
    ? ticket.tier.tier_type === 'vip' ? '⭐ VIP'
      : ticket.tier.tier_type === 'table' ? `🪑 Table for ${ticket.tier.seats_per_unit ?? 8}`
      : ticket.tier.tier_type === 'seat' ? '💺 Reserved'
      : ticket.tier.tier_type === 'standing' ? '🕺 Standing'
      : ticket.tier.tier_type === 'online' ? '📲 Virtual'
      : null
    : null

  return (
    <motion.div
      layout
      variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.22 }}
      className={`relative rounded-3xl overflow-hidden border transition-all cursor-pointer ${
        isCancelled
          ? 'bg-surface-800 border-surface-600 opacity-50'
          : isUsed
          ? 'bg-surface-800 border-surface-600 opacity-65 active:scale-[0.98]'
          : 'bg-surface-800 border-surface-600 active:scale-[0.98] shadow-lg shadow-green-500/10 hover:shadow-green-500/20 hover:border-green-500/30'
      }`}
      onClick={() => !isCancelled && onView(ticket)}
    >
      {/* Cover image */}
      <div className="relative h-32 bg-surface-700 overflow-hidden">
        {ticket.event?.cover_image_url ? (
          <img src={ticket.event.cover_image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-brand-500/20 to-purple-600/20">
            🎉
          </div>
        )}
        {/* Gradient fade into ticket body */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-800 via-surface-800/30 to-transparent" />

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          {isUsed ? (
            <span className="bg-gray-600/80 text-gray-300 text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Used
            </span>
          ) : isCancelled ? (
            <span className="bg-red-500/80 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
              <XCircle className="w-3 h-3" /> Cancelled
            </span>
          ) : (
            <span className="bg-green-500/85 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center gap-1 shadow-sm shadow-green-500/30">
              <QrCode className="w-3 h-3" /> Valid
            </span>
          )}
        </div>

        {/* Tier badge on cover — premium pill */}
        {tierTypeLabel && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-black/60 backdrop-blur-sm text-white/90 text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/10">
              {tierTypeLabel}
            </span>
          </div>
        )}
      </div>

      {/* Physical ticket perforation line */}
      <div className="relative flex items-center px-0">
        {/* Left notch */}
        <div
          className="absolute left-0 w-6 h-6 rounded-full bg-surface-900 border-r border-dashed border-surface-600"
          style={{ transform: 'translateX(-50%)' }}
        />
        {/* Dashed line */}
        <div className="w-full border-t-2 border-dashed border-surface-600/60 mx-6" />
        {/* Right notch */}
        <div
          className="absolute right-0 w-6 h-6 rounded-full bg-surface-900 border-l border-dashed border-surface-600"
          style={{ transform: 'translateX(50%)' }}
        />
      </div>

      {/* Ticket body */}
      <div className="px-4 pt-3.5 pb-4">
        {/* Tier name */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${
            ticket.tier?.tier_type === 'vip'
              ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
              : 'bg-brand-500/15 text-brand-500 border-brand-500/30'
          }`}>
            {ticket.tier?.name ?? 'General Admission'}
          </span>
        </div>

        {/* Event title */}
        <p className="font-black text-white text-lg leading-tight mb-3 line-clamp-2 tracking-tight">
          {ticket.event?.title}
        </p>

        <div className="space-y-2">
          {ticket.event?.starts_at && (
            <div className="flex items-center gap-2 text-gray-400 text-xs">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-brand-500" />
              <span>
                {new Date(ticket.event.starts_at).toLocaleDateString('en-TZ', {
                  weekday: 'short', month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
          )}
          {ticket.event?.venue_name && (
            <div className="flex items-center gap-2 text-gray-400 text-xs">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-brand-500" />
              <span className="line-clamp-1">{ticket.event.venue_name}</span>
            </div>
          )}
        </div>

        {/* Footer hint */}
        {isValid && (
          <div className="mt-3.5 flex items-center justify-between border-t border-surface-600 pt-3">
            <span className="text-xs text-gray-500 font-medium">Tap to show QR code</span>
            <div className="flex items-center gap-1.5">
              {/* Mini QR dot-pattern placeholder */}
              <div className="grid grid-cols-4 gap-0.5 opacity-50">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 h-1 rounded-[1px] ${
                      [0,1,3,4,7,8,10,12,15].includes(i) ? 'bg-gray-400' : 'bg-surface-600'
                    }`}
                  />
                ))}
              </div>
              <QrCode className="w-4 h-4 text-gray-500" />
            </div>
          </div>
        )}

        {isUsed && (
          <div className="mt-3 flex items-center gap-2 text-gray-500 text-xs border-t border-surface-600 pt-3">
            <CheckCircle className="w-3.5 h-3.5 text-gray-600" />
            Scanned at entrance
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function WalletPage() {
  const { checking } = useRequireAuth()
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming')
  const [transferEmail, setTransferEmail] = useState('')
  const [transferView, setTransferView] = useState(false)
  const [transferMsg, setTransferMsg] = useState<{ ok: boolean; msg: string } | null>(null)
  const [refundConfirmOpen, setRefundConfirmOpen] = useState(false)
  const [refundMsg, setRefundMsg] = useState<{ ok: boolean; msg: string } | null>(null)

  const transferMutation = useMutation({
    mutationFn: (ticketId: string) => api.post(`/tickets/${ticketId}/transfer`, { recipient_email: transferEmail }),
    onSuccess: () => {
      setTransferMsg({ ok: true, msg: `Ticket sent to ${transferEmail}!` })
      setTransferEmail('')
      setTimeout(() => { setTransferMsg(null); setTransferView(false); setSelectedTicket(null) }, 3000)
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } } }
      setTransferMsg({ ok: false, msg: e?.response?.data?.error ?? 'Transfer failed' })
    },
  })

  const refundMutation = useMutation({
    mutationFn: (orderId: string) => api.post('/payment/refund', { order_id: orderId }),
    onSuccess: () => {
      setRefundMsg({ ok: true, msg: 'Refund requested — allow 3-5 business days to process.' })
      setRefundConfirmOpen(false)
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } } }
      setRefundMsg({ ok: false, msg: e?.response?.data?.error ?? 'Refund request failed. Please contact support.' })
      setRefundConfirmOpen(false)
    },
  })

  const handleShare = async (ticket: Ticket) => {
    const url = `${window.location.origin}/tickets/${ticket.qr_token}`
    if (navigator.share) {
      await navigator.share({ title: `My ticket for ${ticket.event?.title}`, url })
    } else {
      await navigator.clipboard.writeText(url)
      alert('Share link copied to clipboard!')
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: () => api.get<{ data: Ticket[] }>('/tickets/my').then((r) => r.data),
  })

  const tickets: Ticket[] = data?.data ?? []
  const now = new Date()

  const upcoming = tickets.filter((t) => t.event?.starts_at && new Date(t.event.starts_at) >= now && t.status !== 'cancelled')
  const past = tickets.filter((t) => (t.event?.starts_at && new Date(t.event.starts_at) < now) || t.status === 'used')

  const shown = filter === 'upcoming' ? upcoming : past

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
        <h1 className="text-2xl font-black text-white mb-4">My Tickets</h1>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-surface-800 p-1 rounded-xl">
          {(['upcoming', 'past'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                filter === f ? 'bg-brand-500 text-white' : 'text-gray-400'
              }`}
            >
              {f} {f === 'upcoming' ? `(${upcoming.length})` : `(${past.length})`}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-56 bg-surface-800 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 px-4"
          >
            <div className="w-20 h-20 bg-surface-800 border border-surface-600 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <TicketIcon className="w-10 h-10 text-gray-600" />
            </div>
            <p className="text-white font-bold text-lg mb-1">
              {filter === 'upcoming' ? 'No upcoming tickets' : 'No past events'}
            </p>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              {filter === 'upcoming'
                ? 'Your confirmed tickets will appear here. Start browsing events!'
                : 'Events you have attended will be archived here.'}
            </p>
            {filter === 'upcoming' && (
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-brand-500 text-white px-6 py-3 rounded-2xl font-bold text-sm active:scale-[0.97] transition-transform"
              >
                Browse Events →
              </Link>
            )}
          </motion.div>
        ) : (
          <motion.div
            className="space-y-4"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          >
            {shown.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} onView={setSelectedTicket} />
            ))}
          </motion.div>
        )}
      </div>

      {/* QR Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center"
            onClick={() => { setSelectedTicket(null); setTransferView(false); setTransferMsg(null); setRefundConfirmOpen(false); setRefundMsg(null) }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full bg-surface-900 rounded-t-3xl p-6 pb-10 safe-bottom max-h-[90dvh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="font-black text-white text-lg leading-tight">{selectedTicket.event?.title}</p>
                  <p className="text-brand-500 text-sm font-semibold">{selectedTicket.tier?.name}</p>
                </div>
                <button
                  onClick={() => { setSelectedTicket(null); setTransferView(false); setTransferMsg(null); setRefundConfirmOpen(false); setRefundMsg(null) }}
                  className="w-9 h-9 bg-surface-800 rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {!transferView ? (
                <>
                  {/* QR Code — hide for used tickets */}
                  {selectedTicket.status !== 'used' ? (
                    <>
                      <div className="flex justify-center mb-3">
                        <div className="bg-white p-3 rounded-3xl">
                          <QRCanvas token={selectedTicket.qr_token} />
                        </div>
                      </div>
                      <p className="text-center text-gray-600 text-xs font-mono mb-4">
                        {selectedTicket.qr_token.slice(0, 20)}...
                      </p>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 mb-3">
                      <CheckCircle className="w-14 h-14 text-gray-500 mb-2" />
                      <p className="text-gray-400 font-semibold text-sm">Ticket used</p>
                      <p className="text-gray-600 text-xs mt-1">This ticket was scanned at the event entrance</p>
                    </div>
                  )}

                  {/* Event info */}
                  <div className="bg-surface-800 rounded-2xl p-3 space-y-2 mb-4">
                    {selectedTicket.event?.starts_at && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="w-3.5 h-3.5 text-brand-500" />
                        {new Date(selectedTicket.event.starts_at).toLocaleDateString('en-TZ', {
                          weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                    )}
                    {selectedTicket.event?.venue_name && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <MapPin className="w-3.5 h-3.5 text-brand-500" />
                        {selectedTicket.event.venue_name}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {/* Share */}
                    <button
                      onClick={() => handleShare(selectedTicket)}
                      className="flex flex-col items-center gap-1.5 bg-surface-800 border border-surface-600 rounded-2xl py-3 hover:border-brand-500/40 transition-colors active:scale-95"
                    >
                      <Share2 className="w-5 h-5 text-brand-500" />
                      <span className="text-xs text-gray-300 font-medium">Share</span>
                    </button>
                    {/* Download */}
                    <Link
                      href={`/tickets/${selectedTicket.qr_token}`}
                      target="_blank"
                      className="flex flex-col items-center gap-1.5 bg-surface-800 border border-surface-600 rounded-2xl py-3 hover:border-brand-500/40 transition-colors active:scale-95"
                    >
                      <Download className="w-5 h-5 text-purple-400" />
                      <span className="text-xs text-gray-300 font-medium">Download</span>
                    </Link>
                    {/* Transfer */}
                    <button
                      onClick={() => setTransferView(true)}
                      className="flex flex-col items-center gap-1.5 bg-surface-800 border border-surface-600 rounded-2xl py-3 hover:border-brand-500/40 transition-colors active:scale-95"
                    >
                      <Send className="w-5 h-5 text-cyan-400" />
                      <span className="text-xs text-gray-300 font-medium">Transfer</span>
                    </button>
                  </div>

                  <p className="text-center text-xs text-gray-600">
                    Show QR at entrance · Tap Download for a shareable ticket card
                  </p>

                  {/* Refund request — only for valid tickets whose event hasn't started */}
                  {selectedTicket.status === 'valid' &&
                    selectedTicket.event?.starts_at &&
                    new Date(selectedTicket.event.starts_at) > new Date() && (
                      <div className="mt-3">
                        {refundMsg ? (
                          <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${refundMsg.ok ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                            {refundMsg.ok ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                            {refundMsg.msg}
                          </div>
                        ) : refundConfirmOpen ? (
                          <div className="bg-surface-800 border border-orange-500/30 rounded-2xl p-4 space-y-3">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-white font-semibold text-sm">Request a refund?</p>
                                <p className="text-gray-500 text-xs mt-0.5">This will cancel your ticket and cannot be undone.</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setRefundConfirmOpen(false)}
                                className="flex-1 bg-surface-700 text-gray-300 rounded-xl py-2.5 text-sm font-semibold"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => refundMutation.mutate(selectedTicket.order_id)}
                                disabled={refundMutation.isPending}
                                className="flex-1 bg-orange-500 text-white rounded-xl py-2.5 text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-1.5"
                              >
                                {refundMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-3.5 h-3.5" />
                                )}
                                Confirm Refund
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setRefundConfirmOpen(true)}
                            className="w-full flex items-center justify-center gap-2 bg-surface-800 border border-surface-600 hover:border-orange-500/40 text-orange-400 rounded-2xl py-3 text-sm font-semibold transition-colors active:scale-[0.98]"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Request Refund
                          </button>
                        )}
                      </div>
                    )}

                  {/* Star rating — only for used tickets */}
                  {selectedTicket.status === 'used' && (
                    <div className="mt-4 pt-4 border-t border-surface-600">
                      <p className="text-xs text-gray-500 mb-2 text-center">How was this event?</p>
                      <RatingWidget eventId={selectedTicket.event_id} />
                    </div>
                  )}
                </>
              ) : (
                /* Transfer view */
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <button onClick={() => { setTransferView(false); setTransferMsg(null) }} className="text-gray-400 text-sm">← Back</button>
                  </div>
                  <div>
                    <p className="text-white font-bold mb-1">Send ticket to someone</p>
                    <p className="text-gray-500 text-xs mb-4">The recipient must have a Ribera account. They'll get the ticket and a notification email.</p>
                    <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">Recipient's email</label>
                    <input
                      type="email"
                      value={transferEmail}
                      onChange={(e) => setTransferEmail(e.target.value)}
                      placeholder="friend@example.com"
                      className="w-full bg-surface-800 border border-surface-600 rounded-2xl px-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-500 text-sm"
                    />
                  </div>
                  {transferMsg && (
                    <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${transferMsg.ok ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                      {transferMsg.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {transferMsg.msg}
                    </div>
                  )}
                  <button
                    onClick={() => transferMutation.mutate(selectedTicket.id)}
                    disabled={!transferEmail || transferMutation.isPending}
                    className="w-full bg-brand-500 text-white rounded-2xl py-4 font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {transferMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send Ticket
                  </button>
                  <p className="text-xs text-gray-600 text-center">Once transferred, the ticket moves to their wallet and is removed from yours.</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  )
}

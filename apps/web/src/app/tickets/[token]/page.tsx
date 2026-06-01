'use client'

import { use, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { QRCodeCanvas } from 'qrcode.react'
import { Calendar, MapPin, Ticket, Download, Share2, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface ShareTicketData {
  ticket_id: string
  status: string
  checked_in_at: string | null
  holder_name: string
  tier_name: string
  tier_type: string
  qr_token: string
  event: {
    title: string
    starts_at: string
    ends_at: string | null
    venue_name: string | null
    address: string | null
    cover_image_url: string | null
    slug: string
  }
}

export default function TicketSharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const ticketCardRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['share-ticket', token],
    queryFn: () => api.get<{ data: ShareTicketData }>(`/tickets/share/${token}`).then(r => r.data.data),
  })

  const handleDownload = async () => {
    if (!ticketCardRef.current) return
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(ticketCardRef.current, {
        backgroundColor: '#0a0a0f',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      })
      const link = document.createElement('a')
      link.download = `ribera-ticket-${data?.ticket_id ?? 'ticket'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch {
      alert('Download failed — try screenshotting instead')
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: `My ticket for ${data?.event.title}`, url })
    } else {
      await navigator.clipboard.writeText(url)
      alert('Link copied!')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-surface-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-dvh bg-surface-900 flex flex-col items-center justify-center gap-4 px-8 text-center">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
          <XCircle className="w-10 h-10 text-red-400" />
        </div>
        <p className="text-white font-bold text-xl">Ticket not found</p>
        <p className="text-gray-500 text-sm">This link may be invalid or expired.</p>
        <Link href="/" className="text-brand-500 text-sm">Browse events →</Link>
      </div>
    )
  }

  const starts = new Date(data.event.starts_at)
  const isUsed = data.status === 'used'
  const isCancelled = data.status === 'cancelled'

  return (
    <div className="min-h-dvh bg-surface-900 flex flex-col items-center justify-start py-8 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 mb-6"
      >
        <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center">
          <Ticket className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-black text-xl tracking-tight">Ribera</span>
      </motion.div>

      {/* Ticket Card */}
      <motion.div
        ref={ticketCardRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm bg-surface-800 border border-surface-600 rounded-3xl overflow-hidden"
      >
        {/* Cover */}
        <div className="relative h-40 bg-surface-700">
          {data.event.cover_image_url ? (
            <img src={data.event.cover_image_url} alt={data.event.title} className="w-full h-full object-cover" crossOrigin="anonymous" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🎉</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-800 to-transparent" />
          {/* Status badge */}
          <div className="absolute top-3 right-3">
            {isUsed ? (
              <span className="bg-gray-500/90 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
                <CheckCircle className="w-3 h-3" /> Used
              </span>
            ) : isCancelled ? (
              <span className="bg-red-500/90 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">Cancelled</span>
            ) : (
              <span className="bg-green-500/90 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
                <CheckCircle className="w-3 h-3" /> Valid
              </span>
            )}
          </div>
        </div>

        {/* Perforated line */}
        <div className="relative flex items-center">
          <div className="w-5 h-5 rounded-full bg-surface-900 -ml-2.5 flex-shrink-0 border-r border-dashed border-surface-600" />
          <div className="flex-1 border-t border-dashed border-surface-600" />
          <div className="w-5 h-5 rounded-full bg-surface-900 -mr-2.5 flex-shrink-0 border-l border-dashed border-surface-600" />
        </div>

        {/* Info */}
        <div className="p-5">
          <h1 className="text-white font-black text-xl leading-tight mb-1">{data.event.title}</h1>
          <p className="text-brand-500 font-semibold text-sm mb-4">{data.tier_name}</p>

          <div className="space-y-2 mb-5">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Calendar className="w-4 h-4 text-brand-500 flex-shrink-0" />
              {starts.toLocaleDateString('en-TZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Calendar className="w-4 h-4 text-transparent flex-shrink-0" />
              {starts.toLocaleTimeString('en-TZ', { hour: '2-digit', minute: '2-digit' })}
              {data.event.ends_at && ` – ${new Date(data.event.ends_at).toLocaleTimeString('en-TZ', { hour: '2-digit', minute: '2-digit' })}`}
            </div>
            {data.event.venue_name && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <MapPin className="w-4 h-4 text-purple-400 flex-shrink-0" />
                {data.event.venue_name}
              </div>
            )}
          </div>

          {/* QR code */}
          {!isUsed && !isCancelled && (
            <div className="flex justify-center mb-4">
              <div className="bg-white p-3 rounded-2xl">
                <QRCodeCanvas value={data.qr_token} size={180} marginSize={2} bgColor="#ffffff" fgColor="#0a0a0a" />
              </div>
            </div>
          )}
          {isUsed && data.checked_in_at && (
            <div className="flex items-center gap-2 bg-gray-500/20 rounded-xl p-3 mb-4">
              <CheckCircle className="w-4 h-4 text-gray-400" />
              <p className="text-gray-400 text-sm">Checked in at {new Date(data.checked_in_at).toLocaleTimeString('en-TZ', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-gray-600 border-t border-surface-600 pt-3">
            <span>Holder: {data.holder_name}</span>
            <span>#{data.ticket_id}</span>
          </div>
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-sm mt-5 space-y-3"
      >
        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 bg-brand-500 text-white rounded-2xl py-3.5 font-bold active:scale-[0.98] transition-transform"
        >
          <Download className="w-4 h-4" />
          Download Ticket as Image
        </button>
        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 bg-surface-800 border border-surface-600 text-white rounded-2xl py-3.5 font-semibold active:scale-[0.98] transition-transform"
        >
          <Share2 className="w-4 h-4" />
          Copy Share Link
        </button>
        <Link
          href={`/events/${data.event.slug}`}
          className="w-full flex items-center justify-center gap-2 text-gray-500 text-sm py-2 hover:text-gray-300 transition-colors"
        >
          View Event →
        </Link>
      </motion.div>

      <p className="text-xs text-gray-700 mt-6 text-center">
        Powered by <a href="http://localhost:3000" className="text-brand-500">Ribera</a> · Tanzania's favourite events app
      </p>
    </div>
  )
}

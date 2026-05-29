'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { Shell } from '@/components/layout/Shell'
import type { Event, PaginatedResponse } from '@ribera/types'
import { ScanLine, CheckCircle, XCircle, AlertCircle, Loader2, Camera, RefreshCw } from 'lucide-react'

type ScanResult = 'valid' | 'already_used' | 'wrong_event' | 'cancelled' | 'invalid' | null

interface ScanResponse {
  result: ScanResult
  holder_name?: string
  tier_name?: string
  checked_in_at?: string
}

function ScannerContent() {
  const searchParams = useSearchParams()
  const preselectedEventId = searchParams.get('event_id') ?? ''

  const [selectedEventId, setSelectedEventId] = useState(preselectedEventId)
  const [manualToken, setManualToken] = useState('')
  const [scanning, setScanning] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [result, setResult] = useState<ScanResponse | null>(null)
  const [stats, setStats] = useState<{ total: number; checked_in: number; remaining: number } | null>(null)
  const scannerRef = useRef<unknown>(null)
  const resultTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: eventsData } = useQuery({
    queryKey: ['organiser-events-scanner'],
    queryFn: () => api.get<PaginatedResponse<Event>>('/organiser/events', { params: { status: 'published', limit: 50 } }).then(r => r.data),
  })

  const events = eventsData?.data ?? []

  const fetchStats = async (eventId: string) => {
    if (!eventId) return
    try {
      const { data } = await api.get(`/scanner/event/${eventId}/stats`)
      setStats(data.data)
    } catch { /* noop */ }
  }

  useEffect(() => {
    if (selectedEventId) fetchStats(selectedEventId)
  }, [selectedEventId])

  const doCheckIn = async (token: string) => {
    if (!selectedEventId || !token.trim()) return
    setScanning(true)
    try {
      const { data } = await api.post('/scanner/check-in', { qr_token: token.trim(), event_id: selectedEventId })
      setResult(data.data)
      // Haptic feedback
      if (data.data?.result === 'valid' && navigator.vibrate) navigator.vibrate([100, 50, 100])
      else if (data.data?.result && data.data.result !== 'valid' && navigator.vibrate) navigator.vibrate(300)
      if (resultTimer.current) clearTimeout(resultTimer.current)
      resultTimer.current = setTimeout(() => setResult(null), 4000)
      fetchStats(selectedEventId)
    } catch {
      setResult({ result: 'invalid' })
      if (navigator.vibrate) navigator.vibrate(500)
    } finally {
      setScanning(false)
      setManualToken('')
    }
  }

  const startCamera = async () => {
    if (!selectedEventId) return
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => doCheckIn(decodedText),
        () => {}
      )
      setCameraActive(true)
    } catch {
      alert('Camera not available. Use manual entry below.')
    }
  }

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        const s = scannerRef.current as { stop: () => Promise<void> }
        await s.stop()
      } catch { /* noop */ }
      scannerRef.current = null
      setCameraActive(false)
    }
  }

  useEffect(() => () => { stopCamera() }, [])

  const resultConfig: Record<string, { icon: React.ElementType; color: string; text: string; bg: string }> = {
    valid: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/40', text: '✓ Checked In' },
    already_used: { icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/40', text: 'Already used' },
    wrong_event: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/40', text: 'Wrong event' },
    cancelled: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/40', text: 'Ticket cancelled' },
    invalid: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/40', text: 'Invalid QR code' },
  }

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-white mb-6">QR Scanner</h1>

      {/* Event selector */}
      <div className="mb-6">
        <label className="block text-xs text-gray-400 mb-1.5 font-medium">Select Event</label>
        <select
          value={selectedEventId}
          onChange={e => setSelectedEventId(e.target.value)}
          className="w-full bg-surface-800 border border-surface-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-500"
        >
          <option value="">Choose an event...</option>
          {events.map(e => (
            <option key={e.id} value={e.id}>{e.title}</option>
          ))}
        </select>
      </div>

      {/* Live stats */}
      {stats && selectedEventId && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-surface-800 border border-surface-600 rounded-2xl p-3 text-center">
            <p className="text-xl font-black text-white">{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="bg-surface-800 border border-brand-500/30 rounded-2xl p-3 text-center">
            <p className="text-xl font-black text-brand-500">{stats.checked_in}</p>
            <p className="text-xs text-gray-500">In</p>
          </div>
          <div className="bg-surface-800 border border-surface-600 rounded-2xl p-3 text-center">
            <p className="text-xl font-black text-gray-300">{stats.remaining}</p>
            <p className="text-xs text-gray-500">Remaining</p>
          </div>
        </div>
      )}

      {/* QR Reader area */}
      {selectedEventId && (
        <div className="mb-6">
          <div id="qr-reader" className="w-full rounded-2xl overflow-hidden bg-surface-800 border border-surface-600 min-h-[200px]" />
          <div className="flex gap-3 mt-3">
            {!cameraActive ? (
              <button
                onClick={startCamera}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-500 text-white rounded-xl py-3 text-sm font-semibold"
              >
                <Camera className="w-4 h-4" /> Start Camera
              </button>
            ) : (
              <>
                <div className="flex-1 flex items-center justify-center gap-2 bg-green-500/20 border border-green-500/40 rounded-xl py-3 text-sm font-semibold text-green-400">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Camera Active
                </div>
                <button
                  onClick={stopCamera}
                  className="px-4 bg-surface-800 border border-surface-600 rounded-xl text-gray-400 text-sm"
                >
                  Stop
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Manual entry */}
      {selectedEventId && (
        <div className="mb-6">
          <label className="block text-xs text-gray-400 mb-1.5 font-medium">Manual token entry</label>
          <div className="flex gap-2">
            <input
              value={manualToken}
              onChange={e => setManualToken(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doCheckIn(manualToken)}
              placeholder="Paste QR token..."
              className="flex-1 bg-surface-800 border border-surface-600 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-brand-500"
            />
            <button
              onClick={() => doCheckIn(manualToken)}
              disabled={!manualToken || scanning}
              className="px-4 bg-brand-500 text-white rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center gap-2"
            >
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Result overlay */}
      <AnimatePresence>
        {result && result.result && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-4 right-4 border rounded-2xl p-4 z-50 ${resultConfig[result.result]?.bg ?? 'bg-surface-800 border-surface-600'}`}
          >
            {(() => {
              const cfg = resultConfig[result.result!]
              if (!cfg) return null
              const Icon = cfg.icon
              return (
                <div className="flex items-center gap-3">
                  <Icon className={`w-7 h-7 ${cfg.color} flex-shrink-0`} />
                  <div>
                    <p className={`font-bold ${cfg.color}`}>{cfg.text}</p>
                    {result.holder_name && <p className="text-white text-sm">{result.holder_name}</p>}
                    {result.tier_name && <p className="text-gray-400 text-xs">{result.tier_name}</p>}
                  </div>
                </div>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </Shell>
  )
}

export default function ScannerPage() {
  return <Suspense><ScannerContent /></Suspense>
}

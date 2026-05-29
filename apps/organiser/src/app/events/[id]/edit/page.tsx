'use client'

import { use, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Shell } from '@/components/layout/Shell'
import type { Event, ApiResponse } from '@ribera/types'
import {
  ChevronLeft, Save, Loader2, ImagePlus, X, Trash2,
  Calendar, MapPin, Globe, Hash, Clock, Link2, Camera,
  CheckCircle, AlertCircle, Info
} from 'lucide-react'

interface EditFormData {
  title: string
  description: string
  category: string
  event_type: string
  venue_name: string
  address: string
  venue_code: string
  timetable_url: string
  online_url: string
  starts_at: string
  ends_at: string
  min_age: number
  allow_transfer: boolean
  refund_policy: string
}

const inputClass = 'w-full bg-surface-700 border border-surface-500 rounded-xl px-3.5 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-500 transition-colors text-sm'
const labelClass = 'block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider'

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const qc = useQueryClient()
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<EditFormData | null>(null)
  const [coverUrl, setCoverUrl] = useState('')
  const [galleryUrls, setGalleryUrls] = useState<string[]>([])
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Load event
  const { data: eventData, isLoading } = useQuery({
    queryKey: ['organiser-event', id],
    queryFn: () => api.get<ApiResponse<Event>>(`/organiser/events/${id}`).then(r => r.data.data),
  })

  // Populate form once loaded
  useEffect(() => {
    if (!eventData) return
    const e = eventData
    setForm({
      title: e.title ?? '',
      description: e.description ?? '',
      category: e.category ?? 'music',
      event_type: e.event_type ?? 'paid',
      venue_name: e.venue_name ?? '',
      address: e.address ?? '',
      venue_code: (e as unknown as Record<string, string>).venue_code ?? '',
      timetable_url: (e as unknown as Record<string, string>).timetable_url ?? '',
      online_url: e.online_url ?? '',
      starts_at: e.starts_at ? new Date(e.starts_at).toISOString().slice(0, 16) : '',
      ends_at: e.ends_at ? new Date(e.ends_at).toISOString().slice(0, 16) : '',
      min_age: e.min_age ?? 0,
      allow_transfer: e.allow_transfer ?? true,
      refund_policy: e.refund_policy ?? '24h',
    })
    setCoverUrl(e.cover_image_url ?? '')
    setGalleryUrls(e.gallery_urls ?? [])
  }, [eventData])

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form) return
      const payload: Record<string, unknown> = {
        title: form.title,
        description: form.description || undefined,
        category: form.category,
        event_type: form.event_type,
        venue_name: form.venue_name || undefined,
        address: form.address || undefined,
        venue_code: form.venue_code || null,
        timetable_url: form.timetable_url || null,
        online_url: form.online_url || null,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : undefined,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : undefined,
        min_age: form.min_age,
        allow_transfer: form.allow_transfer,
        refund_policy: form.refund_policy,
        cover_image_url: coverUrl || null,
        gallery_urls: galleryUrls,
      }
      await api.put(`/events/${id}`, payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['organiser-event', id] })
      qc.invalidateQueries({ queryKey: ['organiser-events'] })
      setSaved(true)
      setSaveError('')
      setTimeout(() => setSaved(false), 3000)
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } } }
      setSaveError(e?.response?.data?.error ?? 'Failed to save changes')
    },
  })

  // Cover image upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post<{ data: { url: string } }>('/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setCoverUrl(data.data.url)
    } catch (err) {
      console.error('Cover upload failed', err)
    } finally {
      setUploadingCover(false)
    }
  }

  // Gallery image upload
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploadingGallery(true)
    try {
      const uploaded: string[] = []
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        const { data } = await api.post<{ data: { url: string } }>('/uploads/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        uploaded.push(data.data.url)
      }
      setGalleryUrls(prev => [...prev, ...uploaded])
    } catch (err) {
      console.error('Gallery upload failed', err)
    } finally {
      setUploadingGallery(false)
    }
  }

  const set = (field: keyof EditFormData, value: string | number | boolean) => {
    setForm(prev => prev ? { ...prev, [field]: value } : prev)
  }

  if (isLoading || !form) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      </Shell>
    )
  }

  const event = eventData!

  return (
    <Shell>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-surface-700 flex items-center justify-center flex-shrink-0"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white truncate">Edit Event</h1>
          <p className="text-gray-500 text-xs truncate">{event.title}</p>
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60 active:scale-[0.97] transition-transform"
        >
          {saveMutation.isPending
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : saved
              ? <CheckCircle className="w-4 h-4" />
              : <Save className="w-4 h-4" />
          }
          {saved ? 'Saved!' : 'Save'}
        </button>
      </div>

      {/* Save feedback */}
      {saveError && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{saveError}</p>
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl p-3 mb-4">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <p className="text-green-400 text-sm">Changes saved successfully</p>
        </div>
      )}

      <div className="space-y-6">

        {/* ── Section: Cover Image ── */}
        <section className="bg-surface-800 border border-surface-600 rounded-2xl p-4">
          <h2 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <Camera className="w-4 h-4 text-brand-500" />
            Cover Image
          </h2>
          <div className="relative h-44 bg-surface-700 rounded-xl overflow-hidden">
            {coverUrl ? (
              <>
                <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                <button
                  onClick={() => setCoverUrl('')}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <ImagePlus className="w-8 h-8 text-gray-600" />
                <p className="text-gray-600 text-xs">No cover image</p>
              </div>
            )}
          </div>
          <label className="mt-3 flex items-center justify-center gap-2 bg-surface-700 border border-surface-500 rounded-xl py-2.5 cursor-pointer hover:border-brand-500/50 transition-colors">
            {uploadingCover
              ? <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
              : <ImagePlus className="w-4 h-4 text-gray-400" />
            }
            <span className="text-sm text-gray-300 font-medium">{uploadingCover ? 'Uploading…' : 'Upload new cover'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover} />
          </label>
        </section>

        {/* ── Section: Gallery ── */}
        <section className="bg-surface-800 border border-surface-600 rounded-2xl p-4">
          <h2 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <Camera className="w-4 h-4 text-purple-400" />
            Photo Gallery
          </h2>
          {galleryUrls.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {galleryUrls.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-surface-700">
                  <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => setGalleryUrls(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-xs text-center py-4">No gallery photos yet</p>
          )}
          <label className="flex items-center justify-center gap-2 bg-surface-700 border border-surface-500 rounded-xl py-2.5 cursor-pointer hover:border-brand-500/50 transition-colors">
            {uploadingGallery
              ? <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
              : <ImagePlus className="w-4 h-4 text-gray-400" />
            }
            <span className="text-sm text-gray-300 font-medium">{uploadingGallery ? 'Uploading…' : 'Add gallery photos'}</span>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleGalleryUpload}
              disabled={uploadingGallery}
            />
          </label>
        </section>

        {/* ── Section: Basic Info ── */}
        <section className="bg-surface-800 border border-surface-600 rounded-2xl p-4 space-y-4">
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <Info className="w-4 h-4 text-brand-500" />
            Basic Info
          </h2>

          <div>
            <label className={labelClass}>Event Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Give your event a great title"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Tell attendees what this event is about..."
              rows={4}
              className={inputClass + ' resize-none'}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className={inputClass}>
                <option value="music">🎵 Music</option>
                <option value="sports">⚽ Sports</option>
                <option value="arts">🎨 Arts</option>
                <option value="food_drink">🍽️ Food & Drink</option>
                <option value="nightlife">🎉 Nightlife</option>
                <option value="comedy">😂 Comedy</option>
                <option value="business">💼 Business</option>
                <option value="other">📌 Other</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Event Type</label>
              <select value={form.event_type} onChange={e => set('event_type', e.target.value)} className={inputClass}>
                <option value="paid">🎟️ Paid</option>
                <option value="free">🆓 Free</option>
                <option value="donation">💝 Donation</option>
                <option value="online">💻 Online</option>
                <option value="hybrid">🌐 Hybrid</option>
              </select>
            </div>
          </div>
        </section>

        {/* ── Section: Location & Time ── */}
        <section className="bg-surface-800 border border-surface-600 rounded-2xl p-4 space-y-4">
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4 text-purple-400" />
            Location & Time
          </h2>

          <div>
            <label className={labelClass}>
              <MapPin className="inline w-3 h-3 mr-1" />
              Venue Name
            </label>
            <input
              type="text"
              value={form.venue_name}
              onChange={e => set('venue_name', e.target.value)}
              placeholder="e.g. Diamond Jubilee Hall, Dar es Salaam"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Full Address</label>
            <input
              type="text"
              value={form.address}
              onChange={e => set('address', e.target.value)}
              placeholder="Street, City"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              <Hash className="inline w-3 h-3 mr-1" />
              Venue Code / Door Code
              <span className="ml-1 text-gray-600 normal-case font-normal">(shown to ticket holders)</span>
            </label>
            <input
              type="text"
              value={form.venue_code}
              onChange={e => set('venue_code', e.target.value)}
              placeholder="e.g. GATE-B or #4521"
              className={inputClass + ' font-mono'}
            />
          </div>

          <div>
            <label className={labelClass}>
              <Globe className="inline w-3 h-3 mr-1" />
              Online / Stream URL
            </label>
            <input
              type="url"
              value={form.online_url}
              onChange={e => set('online_url', e.target.value)}
              placeholder="https://zoom.us/j/..."
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>
                <Calendar className="inline w-3 h-3 mr-1" />
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={e => set('starts_at', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                <Clock className="inline w-3 h-3 mr-1" />
                End Date & Time
              </label>
              <input
                type="datetime-local"
                value={form.ends_at}
                onChange={e => set('ends_at', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* ── Section: Schedule & Links ── */}
        <section className="bg-surface-800 border border-surface-600 rounded-2xl p-4 space-y-4">
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <Link2 className="w-4 h-4 text-cyan-400" />
            Schedule & Links
          </h2>

          <div>
            <label className={labelClass}>Timetable / Schedule Link</label>
            <input
              type="url"
              value={form.timetable_url}
              onChange={e => set('timetable_url', e.target.value)}
              placeholder="https://... (Google Sheet, PDF, or webpage)"
              className={inputClass}
            />
            <p className="text-gray-600 text-xs mt-1">Share a link to your event programme or set times</p>
          </div>
        </section>

        {/* ── Section: Settings ── */}
        <section className="bg-surface-800 border border-surface-600 rounded-2xl p-4 space-y-4">
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-400" />
            Event Settings
          </h2>

          <div>
            <label className={labelClass}>Minimum Age</label>
            <input
              type="number"
              min={0}
              max={21}
              value={form.min_age}
              onChange={e => set('min_age', parseInt(e.target.value) || 0)}
              className={inputClass + ' w-28'}
            />
            <p className="text-gray-600 text-xs mt-1">Set to 0 for all ages</p>
          </div>

          <div>
            <label className={labelClass}>Refund Policy</label>
            <select value={form.refund_policy} onChange={e => set('refund_policy', e.target.value)} className={inputClass + ' w-48'}>
              <option value="none">No refunds</option>
              <option value="24h">Up to 24 hours before</option>
              <option value="48h">Up to 48 hours before</option>
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set('allow_transfer', !form.allow_transfer)}
              className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.allow_transfer ? 'bg-brand-500' : 'bg-surface-600'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${form.allow_transfer ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Allow ticket transfers</p>
              <p className="text-gray-500 text-xs">Attendees can transfer their tickets to others</p>
            </div>
          </label>
        </section>

        {/* Save button (bottom) */}
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !form.title}
          className="w-full bg-brand-500 text-white rounded-2xl py-4 font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          {saveMutation.isPending
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving…</>
            : saved
              ? <><CheckCircle className="w-5 h-5" /> Saved!</>
              : <><Save className="w-5 h-5" /> Save Changes</>
          }
        </button>

        {/* Danger zone */}
        {event.status !== 'cancelled' && (
          <section className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
            <h2 className="text-red-400 font-bold text-sm mb-3">Danger Zone</h2>
            <p className="text-gray-500 text-xs mb-3">
              Cancelling an event will notify all ticket holders. This action cannot be undone.
            </p>
            <button
              onClick={async () => {
                if (!confirm('Cancel this event? All attendees will be notified. This cannot be undone.')) return
                try {
                  await api.delete(`/events/${id}`)
                  qc.invalidateQueries({ queryKey: ['organiser-events'] })
                  router.replace('/events')
                } catch {
                  alert('Failed to cancel event')
                }
              }}
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Cancel Event
            </button>
          </section>
        )}

        <div className="h-6" />
      </div>
    </Shell>
  )
}

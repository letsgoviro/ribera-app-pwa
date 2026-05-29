'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { Shell } from '@/components/layout/Shell'
import { EVENT_CATEGORIES } from '@ribera/config'
import { ChevronLeft, ChevronRight, Plus, Trash2, Loader2, Check, ImagePlus, X, Info } from 'lucide-react'

type EventType = 'paid' | 'free' | 'donation' | 'online' | 'hybrid'
type TierType = 'general' | 'vip' | 'table' | 'seat' | 'standing' | 'online'

interface TierInput {
  name: string
  description: string
  price: number
  currency: string
  quantity: number
  tier_type: TierType
  max_per_order: number
  seats_per_unit: number
}

interface FormData {
  title: string
  description: string
  category: string
  event_type: EventType
  venue_name: string
  address: string
  online_url: string
  starts_at: string
  ends_at: string
  timezone: string
  min_age: number
  allow_transfer: boolean
  refund_policy: string
  tiers: TierInput[]
}

const EVENT_TYPES: { id: EventType; label: string; emoji: string; hint: string }[] = [
  { id: 'paid',     label: 'Paid',     emoji: '🎟️', hint: 'Tickets have a price'       },
  { id: 'free',     label: 'Free',     emoji: '🆓', hint: 'No charge for attendees'    },
  { id: 'donation', label: 'Donation', emoji: '💝', hint: 'Pay what you can'            },
  { id: 'online',   label: 'Online',   emoji: '💻', hint: 'Virtual / streaming event'   },
  { id: 'hybrid',   label: 'Hybrid',   emoji: '🌐', hint: 'In-person & online'          },
]

const TIER_TYPES: { id: TierType; label: string; emoji: string; hint: string; hasSeats: boolean }[] = [
  { id: 'general',  label: 'General',       emoji: '🎫', hint: 'Standard entry',          hasSeats: false },
  { id: 'vip',      label: 'VIP',           emoji: '⭐', hint: 'Premium / VIP access',    hasSeats: false },
  { id: 'table',    label: 'Table',         emoji: '🪑', hint: 'Reserve a whole table',   hasSeats: true  },
  { id: 'seat',     label: 'Seat',          emoji: '💺', hint: 'Reserved numbered seat',  hasSeats: true  },
  { id: 'standing', label: 'Standing',      emoji: '🕺', hint: 'Standing / dance floor',  hasSeats: false },
  { id: 'online',   label: 'Virtual',       emoji: '📲', hint: 'Online / stream access',  hasSeats: false },
]

const STEPS = ['Details', 'Location & Time', 'Tickets', 'Review']

const DEFAULT_TIER: TierInput = {
  name: 'General Admission',
  description: '',
  price: 0,
  currency: 'TZS',
  quantity: 100,
  tier_type: 'general',
  max_per_order: 10,
  seats_per_unit: 1,
}

export default function CreateEventPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)

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
      setCoverImageUrl(data.data.url)
    } catch (err) {
      console.error('Cover upload failed', err)
    } finally {
      setUploadingCover(false)
    }
  }

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      event_type: 'paid',
      timezone: 'Africa/Dar_es_Salaam',
      min_age: 0,
      allow_transfer: true,
      refund_policy: '24h',
      tiers: [DEFAULT_TIER],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'tiers' })
  const watchedValues = watch()
  const watchedTiers = watch('tiers')

  const nextStep = () => setStep((s) => Math.min(s + 1, 3))
  const prevStep = () => setStep((s) => Math.max(s - 1, 0))

  const onSubmit = async (data: FormData) => {
    setLoading(true); setError('')
    try {
      const { data: res } = await api.post('/events', {
        ...data,
        starts_at: new Date(data.starts_at).toISOString(),
        ends_at: data.ends_at ? new Date(data.ends_at).toISOString() : undefined,
        cover_image_url: coverImageUrl || undefined,
        tiers: data.tiers.map((t) => ({
          ...t,
          price: Number(t.price),
          quantity: Number(t.quantity),
          max_per_order: Number(t.max_per_order),
          seats_per_unit: Number(t.seats_per_unit),
        })),
      })
      await api.post(`/events/${res.data.id}/publish`)
      router.push(`/events/${res.data.id}`)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e?.response?.data?.error ?? 'Failed to create event')
      setLoading(false)
    }
  }

  const inputClass = 'w-full bg-surface-800 border border-surface-600 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-brand-500 transition-colors'
  const labelClass = 'block text-sm font-medium text-gray-300 mb-1.5'

  return (
    <Shell>
      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
              i <= step ? 'bg-brand-500 text-white' : 'bg-surface-700 text-gray-500'
            }`}>
              {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-white' : 'text-gray-600'}`}>{label}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-brand-500' : 'bg-surface-600'}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">

          {/* ── Step 0: Details ─────────────────────────────────────────────── */}
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <h2 className="text-xl font-bold text-white">Event Details</h2>

              {/* Cover image */}
              <div>
                <label className={labelClass}>Cover image</label>
                <label htmlFor="cover-upload" className={`relative flex items-center justify-center w-full h-44 rounded-2xl border-2 border-dashed cursor-pointer overflow-hidden transition-all ${
                  coverImageUrl ? 'border-transparent' : 'border-surface-500 hover:border-brand-500/50 bg-surface-800'
                }`}>
                  {coverImageUrl ? (
                    <>
                      <img src={coverImageUrl} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm font-semibold">Change image</p>
                      </div>
                      <button type="button" onClick={(e) => { e.preventDefault(); setCoverImageUrl('') }}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center">
                        <X className="w-3.5 h-3.5 text-white" />
                      </button>
                    </>
                  ) : uploadingCover ? (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                      <span className="text-sm">Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <ImagePlus className="w-8 h-8" />
                      <span className="text-sm font-medium">Tap to upload cover image</span>
                      <span className="text-xs">JPG, PNG, WebP · max 5 MB</span>
                    </div>
                  )}
                </label>
                <input id="cover-upload" type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
              </div>

              <div>
                <label className={labelClass}>Event title *</label>
                <input {...register('title', { required: true })} placeholder="Sauti za Busara 2025" className={inputClass} />
                {errors.title && <p className="text-red-400 text-xs mt-1">Title is required</p>}
              </div>

              <div>
                <label className={labelClass}>Category *</label>
                <select {...register('category', { required: true })} className={inputClass}>
                  <option value="">Select category</option>
                  {EVENT_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                  ))}
                </select>
                {errors.category && <p className="text-red-400 text-xs mt-1">Category is required</p>}
              </div>

              <div>
                <label className={labelClass}>Event type *</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {EVENT_TYPES.map((t) => (
                    <label key={t.id} className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      watchedValues.event_type === t.id
                        ? 'border-brand-500 bg-brand-500/10'
                        : 'border-surface-600 bg-surface-800 hover:border-surface-500'
                    }`}>
                      <input type="radio" value={t.id} {...register('event_type')} className="sr-only" />
                      <span className="text-xl leading-none">{t.emoji}</span>
                      <div>
                        <p className={`text-sm font-semibold ${watchedValues.event_type === t.id ? 'text-brand-400' : 'text-white'}`}>{t.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{t.hint}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea {...register('description')} rows={4} placeholder="Tell attendees what to expect..." className={`${inputClass} resize-none`} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Min age</label>
                  <input type="number" {...register('min_age', { valueAsNumber: true })} min={0} max={99} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Refund policy</label>
                  <select {...register('refund_policy')} className={inputClass}>
                    <option value="none">No refunds</option>
                    <option value="24h">24 h before event</option>
                    <option value="48h">48 h before event</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-surface-800 border border-surface-600 rounded-xl p-4">
                <input type="checkbox" {...register('allow_transfer')} id="allow_transfer" className="w-4 h-4 accent-brand-500" />
                <div>
                  <label htmlFor="allow_transfer" className="text-white text-sm font-medium cursor-pointer">Allow ticket transfers</label>
                  <p className="text-gray-500 text-xs">Attendees can transfer tickets to others</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 1: Location & Time ──────────────────────────────────────── */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="text-xl font-bold text-white">Location & Time</h2>

              <div>
                <label className={labelClass}>Venue name</label>
                <input {...register('venue_name')} placeholder="Mlimani City Conference Hall" className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Address</label>
                <input {...register('address')} placeholder="Sam Nujoma Rd, Dar es Salaam" className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Stream / meeting URL <span className="text-gray-500 text-xs">(online & hybrid events)</span></label>
                <input {...register('online_url')} type="url" placeholder="https://zoom.us/j/..." className={inputClass} />
                <p className="text-gray-500 text-xs mt-1">Only visible to confirmed ticket holders.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Start *</label>
                  <input {...register('starts_at', { required: true })} type="datetime-local" className={inputClass} />
                  {errors.starts_at && <p className="text-red-400 text-xs mt-1">Required</p>}
                </div>
                <div>
                  <label className={labelClass}>End</label>
                  <input {...register('ends_at')} type="datetime-local" className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Timezone</label>
                <select {...register('timezone')} className={inputClass}>
                  <option value="Africa/Dar_es_Salaam">East Africa Time (EAT) — Tanzania</option>
                  <option value="Africa/Nairobi">East Africa Time (EAT) — Kenya</option>
                  <option value="Africa/Kampala">East Africa Time (EAT) — Uganda</option>
                  <option value="Africa/Kigali">Central Africa Time — Rwanda</option>
                  <option value="Africa/Johannesburg">South Africa Standard Time (SAST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Ticket Tiers ─────────────────────────────────────────── */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Ticket Tiers</h2>
                <button
                  type="button"
                  onClick={() => append({ ...DEFAULT_TIER, name: '', tier_type: 'general' })}
                  disabled={fields.length >= 10}
                  className="flex items-center gap-1.5 text-brand-500 text-sm font-semibold disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" /> Add Tier
                </button>
              </div>

              <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                <p className="text-brand-200 text-xs">Mix any tier types: General, VIP, Table reservation, Reserved seat, Standing area, or Virtual — up to 10 tiers.</p>
              </div>

              {fields.map((field, i) => {
                const tierType = watchedTiers?.[i]?.tier_type ?? 'general'
                const tierConfig = TIER_TYPES.find(t => t.id === tierType) ?? TIER_TYPES[0]

                return (
                  <div key={field.id} className="bg-surface-800 border border-surface-600 rounded-2xl p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{tierConfig.emoji}</span>
                        <p className="text-white font-semibold text-sm">Tier {i + 1}</p>
                        <span className="text-xs text-gray-500">{tierConfig.label}</span>
                      </div>
                      {fields.length > 1 && (
                        <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-300 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Tier type picker */}
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Tier type</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {TIER_TYPES.map((tt) => (
                          <button
                            key={tt.id}
                            type="button"
                            onClick={() => {
                              setValue(`tiers.${i}.tier_type`, tt.id)
                              if (tt.id === 'table') {
                                setValue(`tiers.${i}.seats_per_unit`, 8)
                                setValue(`tiers.${i}.max_per_order`, 1)
                              } else if (tt.id === 'seat') {
                                setValue(`tiers.${i}.seats_per_unit`, 1)
                                setValue(`tiers.${i}.max_per_order`, 4)
                              } else {
                                setValue(`tiers.${i}.seats_per_unit`, 1)
                                setValue(`tiers.${i}.max_per_order`, 10)
                              }
                            }}
                            className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border text-xs font-medium transition-all ${
                              tierType === tt.id
                                ? 'border-brand-500 bg-brand-500/15 text-brand-400'
                                : 'border-surface-600 bg-surface-700 text-gray-400 hover:border-surface-500'
                            }`}
                          >
                            <span className="text-base">{tt.emoji}</span>
                            <span className="text-center leading-tight">{tt.label.split(' ')[0]}</span>
                          </button>
                        ))}
                      </div>
                      {/* hidden field so RHF tracks value */}
                      <input type="hidden" {...register(`tiers.${i}.tier_type` as const)} />
                    </div>

                    {/* Name & description */}
                    <input
                      {...register(`tiers.${i}.name` as const, { required: true })}
                      placeholder={`e.g. ${tierConfig.label}`}
                      className={inputClass}
                    />
                    <input
                      {...register(`tiers.${i}.description` as const)}
                      placeholder="Short description (optional)"
                      className={inputClass}
                    />

                    {/* Price, quantity */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Currency</label>
                        <select {...register(`tiers.${i}.currency` as const)} className={inputClass}>
                          <option value="TZS">TZS</option>
                          <option value="KES">KES</option>
                          <option value="UGX">UGX</option>
                          <option value="USD">USD</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Price</label>
                        <input type="number" {...register(`tiers.${i}.price` as const, { valueAsNumber: true })} min={0} placeholder="0" className={inputClass} />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">
                          {tierType === 'table' ? 'Tables' : tierType === 'seat' ? 'Seats' : 'Qty'}
                        </label>
                        <input type="number" {...register(`tiers.${i}.quantity` as const, { valueAsNumber: true })} min={1} placeholder="100" className={inputClass} />
                      </div>
                    </div>

                    {/* Reservation-specific: seats per unit + max per order */}
                    {(tierType === 'table' || tierType === 'seat') && (
                      <div className="grid grid-cols-2 gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                        <div>
                          <label className="text-xs text-amber-400 mb-1 block">
                            {tierType === 'table' ? 'Seats per table' : 'Seats per block'}
                          </label>
                          <input
                            type="number"
                            {...register(`tiers.${i}.seats_per_unit` as const, { valueAsNumber: true })}
                            min={1} max={50}
                            placeholder={tierType === 'table' ? '8' : '1'}
                            className={inputClass}
                          />
                          <p className="text-xs text-gray-600 mt-1">
                            {tierType === 'table' ? 'People the table seats' : 'Chairs in this block'}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs text-amber-400 mb-1 block">Max per order</label>
                          <input
                            type="number"
                            {...register(`tiers.${i}.max_per_order` as const, { valueAsNumber: true })}
                            min={1} max={20}
                            placeholder={tierType === 'table' ? '1' : '4'}
                            className={inputClass}
                          />
                          <p className="text-xs text-gray-600 mt-1">
                            {tierType === 'table' ? '1 = one table per booking' : 'Max seats per booking'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Max per order for non-reservation tiers */}
                    {tierType !== 'table' && tierType !== 'seat' && (
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Max tickets per order</label>
                        <input
                          type="number"
                          {...register(`tiers.${i}.max_per_order` as const, { valueAsNumber: true })}
                          min={1} max={20}
                          className={inputClass}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </motion.div>
          )}

          {/* ── Step 3: Review ───────────────────────────────────────────────── */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="text-xl font-bold text-white">Review & Publish</h2>

              <div className="bg-surface-800 border border-surface-600 rounded-2xl p-5 space-y-4">
                {coverImageUrl && (
                  <img src={coverImageUrl} alt="" className="w-full h-36 object-cover rounded-xl" />
                )}
                <div>
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Event</p>
                  <p className="text-white font-bold text-lg">{watchedValues.title || '—'}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-gray-400 text-sm capitalize">{watchedValues.category}</span>
                    {watchedValues.event_type && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-400 font-semibold capitalize">
                        {watchedValues.event_type}
                      </span>
                    )}
                  </div>
                </div>

                <div className="h-px bg-surface-600" />
                <div>
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Date & Time</p>
                  <p className="text-white text-sm">{watchedValues.starts_at ? new Date(watchedValues.starts_at).toLocaleString() : '—'}</p>
                  {watchedValues.ends_at && <p className="text-gray-400 text-xs mt-0.5">Until {new Date(watchedValues.ends_at).toLocaleString()}</p>}
                </div>

                {(watchedValues.venue_name || watchedValues.address) && (
                  <>
                    <div className="h-px bg-surface-600" />
                    <div>
                      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Venue</p>
                      {watchedValues.venue_name && <p className="text-white text-sm">{watchedValues.venue_name}</p>}
                      {watchedValues.address && <p className="text-gray-400 text-xs">{watchedValues.address}</p>}
                    </div>
                  </>
                )}

                {watchedValues.online_url && (
                  <>
                    <div className="h-px bg-surface-600" />
                    <div>
                      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Stream URL</p>
                      <p className="text-white text-xs font-mono truncate">{watchedValues.online_url}</p>
                    </div>
                  </>
                )}

                <div className="h-px bg-surface-600" />
                <div>
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Ticket Tiers</p>
                  {watchedValues.tiers?.map((t, i) => {
                    const tt = TIER_TYPES.find(x => x.id === t.tier_type)
                    const isFree = Number(t.price) === 0
                    return (
                      <div key={i} className="flex justify-between items-start py-2 border-b border-surface-700 last:border-0">
                        <div>
                          <p className="text-white text-sm font-medium">{tt?.emoji} {t.name || `Tier ${i + 1}`}</p>
                          <p className="text-gray-500 text-xs">{tt?.label} · {t.quantity} available</p>
                          {t.tier_type === 'table' && (
                            <p className="text-amber-400 text-xs">Table for {t.seats_per_unit} · max {t.max_per_order}/order</p>
                          )}
                          {t.tier_type === 'seat' && (
                            <p className="text-amber-400 text-xs">{t.seats_per_unit} seat(s) · max {t.max_per_order}/order</p>
                          )}
                        </div>
                        <p className={`text-sm font-bold ${isFree ? 'text-green-400' : 'text-white'}`}>
                          {isFree ? 'Free' : `${t.currency} ${Number(t.price).toLocaleString()}`}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</p>
              )}

              <p className="text-xs text-gray-500 text-center">
                Event will be published immediately and visible to all customers.
              </p>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button type="button" onClick={prevStep}
              className="flex items-center gap-2 px-5 py-3 bg-surface-800 border border-surface-600 text-white rounded-xl font-medium text-sm">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          <div className="flex-1" />
          {step < 3 ? (
            <button type="button" onClick={nextStep}
              className="flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-xl font-bold text-sm">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-brand-500 text-white rounded-xl font-bold text-sm disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {loading ? 'Publishing…' : 'Publish Event'}
            </button>
          )}
        </div>
      </form>
    </Shell>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, Check, Zap, Percent, Shield,
  Building2, Globe, FileText, Upload, Loader2, X, CheckCircle2,
} from 'lucide-react'
import { BottomNav } from '@/components/layout/BottomNav'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'

const BENEFITS = [
  { icon: Percent, title: '0% Commission', desc: 'Keep every shilling from ticket sales. No listing fees.', color: 'text-green-400', bg: 'bg-green-500/15' },
  { icon: Zap, title: 'Instant Setup', desc: 'Create and publish your first event in under 5 minutes.', color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  { icon: Shield, title: 'Verified Badge', desc: 'Get a verified organiser badge displayed on all your events.', color: 'text-brand-500', bg: 'bg-brand-500/15' },
]

type Step = 'landing' | 'form' | 'success' | 'already_applied'

export default function BecomeOrganiserPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('landing')
  const [authUser, setAuthUser] = useState<{ id: string; email?: string } | null>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)

  // Form state
  const [orgName, setOrgName] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [payoutMethod, setPayoutMethod] = useState<'bank' | 'mobile_money'>('mobile_money')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState('')
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState('M-Pesa')
  const [idDocFile, setIdDocFile] = useState<File | null>(null)
  const [idDocPreview, setIdDocPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAuthUser(data.user ? { id: data.user.id, email: data.user.email } : null)
      setLoadingAuth(false)
    })
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIdDocFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setIdDocPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleApply = async () => {
    if (!orgName.trim()) { setError('Organisation name is required'); return }
    if (!fullName.trim()) { setError('Your full legal name is required'); return }
    setError(null)
    setSubmitting(true)

    try {
      let idDocUrl: string | undefined
      if (idDocFile) {
        setUploading(true)
        const form = new FormData()
        form.append('file', idDocFile)
        const up = await api.post<{ data: { url: string } }>('/uploads/image', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        idDocUrl = up.data.data.url
        setUploading(false)
      }

      const payoutDetails = payoutMethod === 'bank'
        ? { method: 'bank', bank_name: bankName, account_number: accountNumber, account_name: accountName }
        : { method: 'mobile_money', mobile_money_number: mobileMoneyNumber, mobile_money_provider: mobileMoneyProvider }

      await api.post('/organiser/apply', {
        org_name: orgName.trim(),
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        bio: bio.trim() || undefined,
        website: website.trim() || undefined,
        id_doc_url: idDocUrl,
        payout_details: payoutDetails,
      })

      setStep('success')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string }
      const msg = e.response?.data?.error ?? e.message ?? 'Something went wrong'
      if (msg.toLowerCase().includes('already')) {
        setStep('already_applied')
      } else {
        setError(msg)
      }
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  if (loadingAuth) {
    return (
      <div className="min-h-dvh bg-surface-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    )
  }

  // ── Success ──────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="min-h-dvh bg-surface-900 flex flex-col items-center justify-center px-6 text-center pb-24">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
          <div className="w-24 h-24 bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-400" />
          </div>
        </motion.div>
        <h2 className="text-2xl font-black text-white mb-2">Application Submitted!</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-xs">
          We'll review your application within <strong className="text-white">24–48 hours</strong> and notify you by email.
        </p>
        <button
          onClick={() => router.push('/')}
          className="w-full max-w-xs bg-brand-500 text-white rounded-2xl py-4 font-bold"
        >
          Back to Home
        </button>
      </div>
    )
  }

  // ── Already applied ──────────────────────────────────────────────────
  if (step === 'already_applied') {
    return (
      <div className="min-h-dvh bg-surface-900 flex flex-col items-center justify-center px-6 text-center pb-24">
        <div className="w-24 h-24 bg-brand-500/15 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="w-12 h-12 text-brand-500" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Already Applied</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-xs">
          You've already submitted an organiser application. We'll reach out once the review is complete.
        </p>
        <button onClick={() => router.push('/')} className="w-full max-w-xs bg-brand-500 text-white rounded-2xl py-4 font-bold">
          Back to Home
        </button>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────────────────────
  if (step === 'form') {
    return (
      <div className="min-h-dvh bg-surface-900 pb-32 safe-top">
        <div className="px-4 pt-6 pb-4 flex items-center gap-3">
          <button onClick={() => setStep('landing')} className="w-9 h-9 rounded-full bg-surface-800 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-black text-white">Apply to Organise</h1>
        </div>

        <div className="px-4 space-y-4">
          {/* Section: Identity */}
          <p className="text-xs text-brand-500 font-bold uppercase tracking-widest pt-2">Your Identity</p>

          {/* Full legal name */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1.5 block">
              Full Legal Name *
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. John Paul Mwangi"
              className="w-full bg-surface-800 border border-surface-600 rounded-2xl px-4 py-3.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-brand-500"
            />
            <p className="text-xs text-gray-700 mt-1">Your real name as it appears on your ID</p>
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1.5 block">
              Contact Phone *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+255 712 345 678"
              className="w-full bg-surface-800 border border-surface-600 rounded-2xl px-4 py-3.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Section: Brand */}
          <p className="text-xs text-brand-500 font-bold uppercase tracking-widest pt-2">Your Brand</p>

          {/* Org name */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1.5 block">
              Organisation / Stage Name *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Bongo Sound Events"
                className="w-full bg-surface-800 border border-surface-600 rounded-2xl pl-10 pr-4 py-3.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1.5 block">
              About your events
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us what kind of events you run, your experience, expected audience size…"
              rows={3}
              className="w-full bg-surface-800 border border-surface-600 rounded-2xl px-4 py-3.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          {/* Website */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1.5 block">
              Website / Social media (optional)
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://instagram.com/yourbrand"
                className="w-full bg-surface-800 border border-surface-600 rounded-2xl pl-10 pr-4 py-3.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Section: Payout */}
          <p className="text-xs text-brand-500 font-bold uppercase tracking-widest pt-2">Payout Account</p>
          <p className="text-xs text-gray-500 -mt-2">Where we'll send your ticket revenue</p>

          {/* Payout method toggle */}
          <div className="flex gap-2">
            {(['mobile_money', 'bank'] as const).map(m => (
              <button
                key={m}
                onClick={() => setPayoutMethod(m)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  payoutMethod === m ? 'bg-brand-500 text-white' : 'bg-surface-800 border border-surface-600 text-gray-400'
                }`}
              >
                {m === 'mobile_money' ? '📱 Mobile Money' : '🏦 Bank Transfer'}
              </button>
            ))}
          </div>

          {payoutMethod === 'mobile_money' ? (
            <>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1.5 block">Provider</label>
                <select value={mobileMoneyProvider} onChange={e => setMobileMoneyProvider(e.target.value)}
                  className="w-full bg-surface-800 border border-surface-600 rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-brand-500">
                  <option>M-Pesa</option>
                  <option>Tigo Pesa</option>
                  <option>Airtel Money</option>
                  <option>Halopesa</option>
                  <option>Azam Pesa</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1.5 block">Mobile Money Number</label>
                <input type="tel" value={mobileMoneyNumber} onChange={e => setMobileMoneyNumber(e.target.value)}
                  placeholder="+255 712 345 678"
                  className="w-full bg-surface-800 border border-surface-600 rounded-2xl px-4 py-3.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-brand-500" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1.5 block">Bank Name</label>
                <input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. CRDB Bank"
                  className="w-full bg-surface-800 border border-surface-600 rounded-2xl px-4 py-3.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1.5 block">Account Number</label>
                <input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="01234567890"
                  className="w-full bg-surface-800 border border-surface-600 rounded-2xl px-4 py-3.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-brand-500 font-mono" />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1.5 block">Account Holder Name</label>
                <input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Name on the account"
                  className="w-full bg-surface-800 border border-surface-600 rounded-2xl px-4 py-3.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-brand-500" />
              </div>
            </>
          )}

          {/* ID Doc */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1.5 block">
              ID Document (optional — speeds up verification)
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            {idDocPreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-brand-500/30">
                <img src={idDocPreview} alt="ID preview" className="w-full h-40 object-cover" />
                <button
                  onClick={() => { setIdDocFile(null); setIdDocPreview(null) }}
                  className="absolute top-2 right-2 w-7 h-7 bg-surface-900/80 rounded-full flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full h-28 bg-surface-800 border-2 border-dashed border-surface-600 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <div className="w-10 h-10 bg-surface-700 rounded-full flex items-center justify-center">
                  <Upload className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-gray-500 text-xs">Tap to upload ID photo</p>
                <p className="text-gray-700 text-xs">JPEG / PNG / WebP · max 8MB</p>
              </button>
            )}
          </div>

          {/* Notes */}
          <div className="bg-surface-800/60 border border-surface-600 rounded-2xl p-4">
            <div className="flex items-start gap-2.5">
              <FileText className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
              <p className="text-gray-400 text-xs leading-relaxed">
                By applying you agree that Ribera may use your details to verify your identity. Applications are reviewed within <strong className="text-white">24–48 hours</strong>.
              </p>
            </div>
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm text-center">
              {error}
            </motion.p>
          )}

          <button
            onClick={handleApply}
            disabled={submitting || !orgName.trim() || !fullName.trim()}
            className="w-full bg-brand-500 disabled:opacity-50 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {uploading ? 'Uploading document…' : 'Submitting…'}
              </>
            ) : (
              'Submit Application'
            )}
          </button>
        </div>

        <BottomNav />
      </div>
    )
  }

  // ── Landing ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-surface-900 pb-24 safe-top">
      <div className="px-4 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-surface-800 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-xl font-black text-white">Become an Organiser</h1>
      </div>

      <div className="px-4 space-y-5">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-brand-500/20 via-brand-500/10 to-purple-500/10 border border-brand-500/25 rounded-3xl p-6"
        >
          <p className="text-3xl mb-3">🎤</p>
          <h2 className="text-2xl font-black text-white leading-tight mb-2">
            Sell tickets on Ribera.<br />
            <span className="text-brand-500">Completely free.</span>
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Join hundreds of East African event organisers who trust Ribera to sell tickets, manage attendees, and grow their audience.
          </p>
        </motion.div>

        {/* Benefits */}
        <div className="space-y-3">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="bg-surface-800 border border-surface-600 rounded-2xl p-4 flex items-start gap-3"
            >
              <div className={`w-10 h-10 ${b.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <b.icon className={`w-5 h-5 ${b.color}`} />
              </div>
              <div>
                <p className="text-white font-bold text-sm">{b.title}</p>
                <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* How it works */}
        <div className="bg-surface-800 border border-surface-600 rounded-2xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">How it works</p>
          <div className="space-y-2">
            {['Apply online', 'Team reviews (24–48h)', 'Get verified & go live'].map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{i + 1}</span>
                </div>
                <span className="text-gray-300 text-sm">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        {authUser ? (
          <button
            onClick={() => setStep('form')}
            className="flex items-center justify-center gap-2 w-full bg-brand-500 text-white rounded-2xl py-4 font-bold text-base active:scale-[0.98] transition-transform"
          >
            Apply Now <Check className="w-4 h-4" />
          </button>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => router.push('/auth?next=/become-organiser')}
              className="flex items-center justify-center gap-2 w-full bg-brand-500 text-white rounded-2xl py-4 font-bold text-base active:scale-[0.98] transition-transform"
            >
              Sign in to Apply
            </button>
            <p className="text-center text-xs text-gray-600">Sign in required to submit an application</p>
          </div>
        )}

        <p className="text-center text-xs text-gray-600">
          Applications reviewed within 24–48 hours
        </p>
      </div>

      <BottomNav />
    </div>
  )
}

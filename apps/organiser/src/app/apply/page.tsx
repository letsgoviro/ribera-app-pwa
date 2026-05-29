'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Loader2, CheckCircle, Building2, ChevronLeft } from 'lucide-react'

export default function ApplyPage() {
  const router = useRouter()
  const [form, setForm] = useState({ org_name: '', bio: '', website: '', id_doc_url: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await api.post('/organiser/apply', form)
      setDone(true)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e?.response?.data?.error ?? 'Application failed')
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div className="min-h-dvh bg-surface-900 flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
        <CheckCircle className="w-10 h-10 text-green-400" />
      </div>
      <h1 className="text-2xl font-black text-white mb-2">Application Submitted!</h1>
      <p className="text-gray-400 text-sm">Our team will review your application within 24-48 hours. We'll notify you by email.</p>
    </div>
  )

  const inputClass = 'w-full bg-surface-800 border border-surface-600 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-500 text-sm transition-colors'
  const labelClass = 'block text-xs text-gray-400 mb-1.5 font-medium'

  return (
    <div className="min-h-dvh bg-surface-900 pb-8">
      <div className="px-6 pt-12 pb-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-400 text-sm mb-6">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="w-12 h-12 bg-brand-500/20 rounded-2xl flex items-center justify-center mb-4">
          <Building2 className="w-6 h-6 text-brand-500" />
        </div>
        <h1 className="text-2xl font-black text-white">Become an Organiser</h1>
        <p className="text-gray-400 text-sm mt-1">Create and sell tickets for your events. 0% commission.</p>
      </div>

      <form onSubmit={handleSubmit} className="px-6 space-y-4">
        <div>
          <label className={labelClass}>Organisation / Brand name *</label>
          <input value={form.org_name} onChange={e => setForm(f => ({ ...f, org_name: e.target.value }))} placeholder="e.g. Bongo Events" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Bio / About</label>
          <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} placeholder="Tell us about your events..." className={inputClass + ' resize-none'} />
        </div>
        <div>
          <label className={labelClass}>Website (optional)</label>
          <input type="url" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://yoursite.com" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>ID document URL *</label>
          <input value={form.id_doc_url} onChange={e => setForm(f => ({ ...f, id_doc_url: e.target.value }))} placeholder="https://..." required className={inputClass} />
          <p className="text-xs text-gray-600 mt-1">Upload your ID to Supabase Storage and paste the public URL here</p>
        </div>

        {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

        <button type="submit" disabled={loading || !form.org_name || !form.id_doc_url}
          className="w-full bg-brand-500 text-white rounded-2xl py-4 font-bold disabled:opacity-40 flex items-center justify-center gap-2">
          {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : 'Submit Application'}
        </button>
      </form>
    </div>
  )
}

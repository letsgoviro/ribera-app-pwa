'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/api'
import { Shell } from '@/components/layout/Shell'
import type { Organiser } from '@ribera/types'
import { Save, Loader2, CheckCircle, Building2, Globe, FileText, Image, Upload, Instagram, Twitter, Youtube } from 'lucide-react'

interface OrgSettingsForm {
  org_name: string
  bio: string
  website: string
}

export default function SettingsPage() {
  const qc = useQueryClient()
  const [saved, setSaved] = useState(false)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [social, setSocial] = useState({ instagram: '', tiktok: '', twitter: '', facebook: '', youtube: '' })
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useQuery<{ data: Organiser }>({
    queryKey: ['organiser-profile'],
    queryFn: () => api.get('/organiser/me').then((r) => r.data),
  })

  const org = data?.data

  const { register, reset, handleSubmit, formState: { isDirty } } = useForm<OrgSettingsForm>({
    defaultValues: { org_name: '', bio: '', website: '' },
  })

  useEffect(() => {
    if (org) {
      reset({ org_name: org.org_name, bio: org.bio ?? '', website: org.website ?? '' })
      setBannerUrl((org as any).banner_url ?? null)
      const sl = (org as any).social_links as Record<string, string> | undefined
      if (sl) {
        setSocial({
          instagram: sl.instagram ?? '',
          tiktok: sl.tiktok ?? '',
          twitter: sl.twitter ?? '',
          facebook: sl.facebook ?? '',
          youtube: sl.youtube ?? '',
        })
      }
    }
  }, [org, reset])

  const mutation = useMutation({
    mutationFn: (body: OrgSettingsForm) =>
      api.patch('/organiser/me', {
        ...body,
        banner_url: bannerUrl,
        social_links: social,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['organiser-profile'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setBannerUrl(res.data.url)
    } catch {
      // silently fail — user can retry
    } finally {
      setBannerUploading(false)
    }
  }

  const inputClass = 'w-full bg-surface-800 border border-surface-600 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-brand-500 transition-colors'
  const labelClass = 'block text-sm font-medium text-gray-300 mb-1.5'

  return (
    <Shell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 text-sm mt-0.5">Manage your organiser profile</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-surface-800 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
          <div className="bg-surface-800 border border-surface-600 rounded-2xl p-5 space-y-4">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" /> Organisation
            </p>

            <div>
              <label className={labelClass}>Organisation name *</label>
              <input
                {...register('org_name', { required: true, minLength: 2 })}
                placeholder="My Events Co."
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Bio</label>
              <textarea
                {...register('bio')}
                rows={3}
                placeholder="Tell attendees about your organisation..."
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          {/* Banner image */}
          <div className="bg-surface-800 border border-surface-600 rounded-2xl p-5 space-y-4">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-2">
              <Image className="w-3.5 h-3.5" /> Banner Image
            </p>
            <p className="text-xs text-gray-500">Displayed on your events and profile</p>

            {bannerUrl && (
              <div className="relative rounded-xl overflow-hidden h-32">
                <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setBannerUrl(null)}
                  className="absolute top-2 right-2 bg-black/60 text-white text-xs rounded-lg px-2 py-1 hover:bg-black/80"
                >
                  Remove
                </button>
              </div>
            )}

            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerUpload}
            />
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              disabled={bannerUploading}
              className="flex items-center gap-2 px-4 py-2.5 border border-surface-600 rounded-xl text-sm text-gray-300 hover:text-white hover:border-brand-500 transition-colors disabled:opacity-50"
            >
              {bannerUploading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                : <><Upload className="w-4 h-4" /> {bannerUrl ? 'Replace Banner' : 'Upload Banner'}</>
              }
            </button>
          </div>

          {/* Online presence + social links */}
          <div className="bg-surface-800 border border-surface-600 rounded-2xl p-5 space-y-4">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" /> Online Presence
            </p>

            <div>
              <label className={labelClass}>Website</label>
              <input
                {...register('website')}
                type="url"
                placeholder="https://yourwebsite.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Instagram</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
                <input
                  value={social.instagram}
                  onChange={e => setSocial(s => ({ ...s, instagram: e.target.value }))}
                  placeholder="yourhandle"
                  className={`${inputClass} pl-7`}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>TikTok</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
                <input
                  value={social.tiktok}
                  onChange={e => setSocial(s => ({ ...s, tiktok: e.target.value }))}
                  placeholder="yourhandle"
                  className={`${inputClass} pl-7`}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Twitter / X</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
                <input
                  value={social.twitter}
                  onChange={e => setSocial(s => ({ ...s, twitter: e.target.value }))}
                  placeholder="yourhandle"
                  className={`${inputClass} pl-7`}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Facebook</label>
              <input
                value={social.facebook}
                onChange={e => setSocial(s => ({ ...s, facebook: e.target.value }))}
                placeholder="https://facebook.com/yourpage"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>YouTube</label>
              <input
                value={social.youtube}
                onChange={e => setSocial(s => ({ ...s, youtube: e.target.value }))}
                placeholder="https://youtube.com/@yourchannel"
                className={inputClass}
              />
            </div>
          </div>

          <div className="bg-surface-800 border border-surface-600 rounded-2xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-2 mb-3">
              <FileText className="w-3.5 h-3.5" /> Verification Status
            </p>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${org?.verified ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                <CheckCircle className={`w-4 h-4 ${org?.verified ? 'text-green-400' : 'text-yellow-400'}`} />
              </div>
              <div>
                <p className={`font-semibold text-sm ${org?.verified ? 'text-green-400' : 'text-yellow-400'}`}>
                  {org?.verified ? 'Verified' : 'Pending verification'}
                </p>
                <p className="text-gray-500 text-xs">
                  {org?.verified
                    ? `Verified on ${new Date(org.verified_at!).toLocaleDateString()}`
                    : 'Your application is under review by the Ribera team'
                  }
                </p>
              </div>
            </div>
          </div>

          {mutation.isError && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              Failed to save changes — please try again
            </p>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full py-3.5 bg-brand-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity"
          >
            {mutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : saved
                ? <><CheckCircle className="w-4 h-4" /> Saved!</>
                : <><Save className="w-4 h-4" /> Save Changes</>
            }
          </button>
        </form>
      )}
    </Shell>
  )
}

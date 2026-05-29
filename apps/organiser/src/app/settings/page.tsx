'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/api'
import { Shell } from '@/components/layout/Shell'
import type { Organiser } from '@ribera/types'
import { Save, Loader2, CheckCircle, Building2, Globe, FileText } from 'lucide-react'

interface OrgSettingsForm {
  org_name: string
  bio: string
  website: string
}

export default function SettingsPage() {
  const qc = useQueryClient()
  const [saved, setSaved] = useState(false)

  const { data, isLoading } = useQuery<{ data: Organiser }>({
    queryKey: ['organiser-profile'],
    queryFn: () => api.get('/organiser/me').then((r) => r.data),
  })

  const org = data?.data

  const { register, reset, handleSubmit, formState: { isDirty } } = useForm<OrgSettingsForm>({
    defaultValues: { org_name: '', bio: '', website: '' },
  })

  useEffect(() => {
    if (org) reset({ org_name: org.org_name, bio: org.bio ?? '', website: org.website ?? '' })
  }, [org, reset])

  const mutation = useMutation({
    mutationFn: (body: OrgSettingsForm) => api.patch('/organiser/me', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['organiser-profile'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

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
            disabled={mutation.isPending || !isDirty}
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

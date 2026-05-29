'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import type { Profile, ApiResponse } from '@ribera/types'
import { ChevronLeft, Save, Loader2, CheckCircle, Camera, User } from 'lucide-react'
import { useRequireAuth } from '@/hooks/useRequireAuth'

interface EditForm {
  display_name: string
  bio: string
  city: string
  avatar_url: string
}

export default function ProfileEditPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const { checking } = useRequireAuth()
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<ApiResponse<Profile>>('/auth/me').then((r) => r.data.data),
  })

  const { register, reset, handleSubmit, watch, setValue, formState: { isDirty } } = useForm<EditForm>({
    defaultValues: { display_name: '', bio: '', city: '', avatar_url: '' },
  })

  useEffect(() => {
    if (profileData) {
      reset({
        display_name: profileData.display_name ?? '',
        bio: (profileData as any).bio ?? '',
        city: (profileData as any).city ?? '',
        avatar_url: profileData.avatar_url ?? '',
      })
    }
  }, [profileData, reset])

  const mutation = useMutation({
    mutationFn: (body: EditForm) => api.patch('/auth/me', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      setSaved(true)
      setTimeout(() => { setSaved(false); router.back() }, 1500)
    },
  })

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session?.user.id ?? 'anon'
      const path = `avatars/${userId}-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('public').upload(path, file, { upsert: true })
      if (!error) {
        const { data: urlData } = supabase.storage.from('public').getPublicUrl(path)
        setValue('avatar_url', urlData.publicUrl, { shouldDirty: true })
      }
    } finally {
      setUploading(false)
    }
  }

  const avatarUrl = watch('avatar_url')

  const inputClass = 'w-full bg-surface-800 border border-surface-600 rounded-2xl px-4 py-3.5 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-brand-500 transition-colors'
  const labelClass = 'block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider'

  if (checking) {
    return (
      <div className="min-h-dvh bg-surface-900 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-surface-900 pb-8 safe-top">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center gap-3 border-b border-surface-700">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-surface-800 flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-xl font-black text-white flex-1">Edit Profile</h1>
        {saved && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 text-green-400 text-sm font-semibold"
          >
            <CheckCircle className="w-4 h-4" /> Saved
          </motion.span>
        )}
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="px-4 pt-6 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 pb-2">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-brand-500/20 border-2 border-brand-500/30 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-brand-500" />
              )}
            </div>
            <label
              htmlFor="avatar-upload"
              className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg"
            >
              {uploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
            </label>
            <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <p className="text-gray-500 text-xs">Tap camera to change photo</p>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div className="bg-surface-800 border border-surface-600 rounded-2xl p-4 space-y-4">
            <div>
              <label className={labelClass}>Display Name</label>
              <input {...register('display_name')} placeholder="Your name" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>City</label>
              <input {...register('city')} placeholder="e.g. Dar es Salaam" className={inputClass} />
            </div>
          </div>

          <div className="bg-surface-800 border border-surface-600 rounded-2xl p-4">
            <label className={labelClass}>Bio</label>
            <textarea
              {...register('bio')}
              rows={3}
              placeholder="Tell others a bit about yourself..."
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        {mutation.isError && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            Failed to save — please try again
          </p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending || !isDirty}
          className="w-full bg-brand-500 text-white rounded-2xl py-4 font-bold disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          {mutation.isPending
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving…</>
            : <><Save className="w-5 h-5" /> Save Changes</>
          }
        </button>
      </form>
    </div>
  )
}

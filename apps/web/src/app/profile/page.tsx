'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import type { Profile, ApiResponse } from '@ribera/types'
import { useQuery } from '@tanstack/react-query'
import { BottomNav } from '@/components/layout/BottomNav'
import {
  User, Settings, LogOut, ChevronRight, Ticket, Bell,
  Shield, HelpCircle, Star, Phone, Mail, Loader2
} from 'lucide-react'
import { useRequireAuth } from '@/hooks/useRequireAuth'

export default function ProfilePage() {
  const router = useRouter()
  const { checking } = useRequireAuth()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userPhone, setUserPhone] = useState<string | null>(null)

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<ApiResponse<Profile>>('/auth/me').then((r) => r.data.data),
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
      setUserPhone(data.user?.phone ?? null)
    })
  }, [])

  if (checking) {
    return (
      <div className="min-h-dvh bg-surface-900 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
      </div>
    )
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/auth')
  }

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: Ticket, label: 'My Tickets', href: '/wallet', count: null },
        { icon: Bell, label: 'Notifications', href: '/notifications', count: null },
        { icon: Shield, label: 'Privacy & Security', href: '/privacy', count: null },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', href: '/help', count: null },
        { icon: Star, label: 'Rate Ribera', href: '/rate', count: null },
      ],
    },
  ]

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : (userEmail?.[0] ?? userPhone?.[1] ?? 'U').toUpperCase()

  return (
    <div className="min-h-dvh bg-surface-900 pb-24 safe-top">
      {/* Header */}
      <header className="px-4 pt-6 pb-2">
        <h1 className="text-2xl font-black text-white mb-6">Profile</h1>

        {/* Avatar & info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 bg-surface-800 border border-surface-600 rounded-3xl p-4 mb-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center overflow-hidden flex-shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-brand-500 text-xl font-black">{initials}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-lg">
              {profile?.display_name ?? 'Your Name'}
            </p>
            {userEmail && (
              <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                <Mail className="w-3 h-3" />
                <span className="truncate">{userEmail}</span>
              </div>
            )}
            {userPhone && (
              <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                <Phone className="w-3 h-3" />
                <span>{userPhone}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => router.push('/profile/edit')}
            className="w-9 h-9 bg-surface-700 rounded-xl flex items-center justify-center flex-shrink-0"
          >
            <Settings className="w-4 h-4 text-gray-400" />
          </button>
        </motion.div>

        {/* Organiser dashboard shortcut */}
        {profile?.role === 'organiser' && (
          <motion.a
            href="http://localhost:3002"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="w-full bg-gradient-to-r from-brand-500/20 to-purple-500/20 border border-brand-500/30 rounded-2xl p-4 flex items-center justify-between mb-6 block"
          >
            <div className="text-left">
              <p className="font-bold text-white text-sm">Organiser Dashboard</p>
              <p className="text-gray-400 text-xs mt-0.5">Manage your events, sales & payouts</p>
            </div>
            <ChevronRight className="w-4 h-4 text-brand-500" />
          </motion.a>
        )}

        {/* Become an organiser CTA */}
        {profile?.role === 'customer' && (
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            onClick={() => router.push('/become-organiser')}
            className="w-full bg-gradient-to-r from-brand-500/20 to-purple-500/20 border border-brand-500/30 rounded-2xl p-4 flex items-center justify-between mb-6"
          >
            <div className="text-left">
              <p className="font-bold text-white text-sm">Become an Organiser</p>
              <p className="text-gray-400 text-xs mt-0.5">Create and sell tickets for your events</p>
            </div>
            <ChevronRight className="w-4 h-4 text-brand-500" />
          </motion.button>
        )}
      </header>

      <div className="px-4 space-y-6">
        {menuSections.map((section, si) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * (si + 1) }}
          >
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-2 px-1">
              {section.title}
            </p>
            <div className="bg-surface-800 border border-surface-600 rounded-2xl overflow-hidden">
              {section.items.map((item, i) => (
                <button
                  key={item.label}
                  onClick={() => router.push(item.href)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 active:bg-surface-700 transition-colors ${
                    i < section.items.length - 1 ? 'border-b border-surface-700' : ''
                  }`}
                >
                  <div className="w-8 h-8 bg-surface-700 rounded-xl flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-gray-400" />
                  </div>
                  <span className="flex-1 text-left text-white text-sm font-medium">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Sign out */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-4 active:bg-red-500/20 transition-colors"
          >
            <div className="w-8 h-8 bg-red-500/20 rounded-xl flex items-center justify-center">
              <LogOut className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-red-400 font-semibold text-sm">Sign Out</span>
          </button>
        </motion.div>

        <p className="text-center text-xs text-gray-700 pb-2">
          Ribera v2.0 · Tanzania 🇹🇿
        </p>
      </div>

      <BottomNav />
    </div>
  )
}

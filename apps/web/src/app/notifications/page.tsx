'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Bell, Zap } from 'lucide-react'
import { BottomNav } from '@/components/layout/BottomNav'

export default function NotificationsPage() {
  const router = useRouter()

  return (
    <div className="min-h-dvh bg-surface-900 pb-24 safe-top">
      <div className="px-4 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-surface-800 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-xl font-black text-white">Notifications</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center px-8 pt-20 text-center"
      >
        <div className="w-20 h-20 bg-brand-500/15 rounded-3xl flex items-center justify-center mb-5">
          <Bell className="w-10 h-10 text-brand-500" />
        </div>
        <h2 className="text-xl font-black text-white mb-2">You're all caught up</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          Notifications about your tickets, event updates, and special offers will appear here.
        </p>
        <div className="w-full bg-surface-800 border border-brand-500/20 rounded-2xl px-5 py-4 flex items-start gap-3 text-left">
          <div className="w-8 h-8 bg-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <Zap className="w-4 h-4 text-brand-500" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Push notifications coming soon</p>
            <p className="text-gray-500 text-xs mt-0.5">Get real-time alerts for event reminders and ticket confirmations.</p>
          </div>
        </div>
      </motion.div>

      <BottomNav />
    </div>
  )
}

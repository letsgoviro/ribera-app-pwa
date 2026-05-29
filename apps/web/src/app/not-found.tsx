'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-surface-900 flex flex-col items-center justify-center px-8 text-center safe-top">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="mb-8"
      >
        <p className="text-[96px] font-black text-brand-500 leading-none tracking-tighter">404</p>
        <div className="h-1 w-16 bg-brand-500 rounded-full mx-auto mt-2" />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h1 className="text-2xl font-black text-white mb-2">Page not found</h1>
        <p className="text-gray-400 text-sm mb-8 max-w-xs">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-brand-500 text-white px-6 py-3.5 rounded-2xl font-bold text-sm active:scale-[0.97] transition-transform"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </motion.div>
    </div>
  )
}

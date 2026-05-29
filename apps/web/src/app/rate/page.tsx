'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronLeft, Star, ExternalLink } from 'lucide-react'
import { BottomNav } from '@/components/layout/BottomNav'

export default function RatePage() {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (rating === 0) return
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-dvh bg-surface-900 flex flex-col items-center justify-center px-8 text-center safe-top">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mb-5"
        >
          <Star className="w-10 h-10 text-yellow-400 fill-yellow-400" />
        </motion.div>
        <h2 className="text-2xl font-black text-white mb-2">Thank you! 🎉</h2>
        <p className="text-gray-400 text-sm mb-6">Your feedback helps us make Ribera better for everyone.</p>
        <button onClick={() => router.back()} className="bg-brand-500 text-white px-8 py-3 rounded-2xl font-bold">Back to Profile</button>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-surface-900 pb-24 safe-top">
      <div className="px-4 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-surface-800 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-xl font-black text-white">Rate Ribera</h1>
      </div>

      <div className="px-4 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-800 border border-surface-600 rounded-3xl p-6 text-center"
        >
          <p className="text-white font-bold text-lg mb-1">Enjoying Ribera?</p>
          <p className="text-gray-400 text-sm mb-6">Let us know how we're doing</p>

          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                whileTap={{ scale: 0.85 }}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
              >
                <Star
                  className={`w-10 h-10 transition-colors ${
                    star <= (hover || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'
                  }`}
                />
              </motion.button>
            ))}
          </div>

          {rating > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <p className="text-gray-300 text-sm font-medium">
                {rating === 5 ? 'Amazing! 🎉' : rating >= 3 ? 'Thanks for sharing!' : 'Sorry to hear that. Tell us more?'}
              </p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Optional: share your thoughts..."
                className="w-full bg-surface-900 border border-surface-600 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-brand-500 resize-none"
              />
              <button
                onClick={handleSubmit}
                className="w-full bg-brand-500 text-white rounded-2xl py-3.5 font-bold active:scale-[0.98] transition-transform"
              >
                Submit Rating
              </button>
              {rating === 5 && (
                <a
                  href="https://play.google.com/store"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-brand-500 text-sm font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Also rate us on Google Play
                </a>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>

      <BottomNav />
    </div>
  )
}

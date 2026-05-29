'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { CheckCircle2, XCircle, Loader2, Zap } from 'lucide-react'

type State = 'verifying' | 'success' | 'failed'

function BoostSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [state, setState] = useState<State>('verifying')

  // DPO redirects with TransactionToken + CompanyRef (boost_ID)
  const transactionToken = searchParams.get('TransactionToken')
  const companyRef = searchParams.get('CompanyRef') // boost_BOOSTID
  const boostId = searchParams.get('boost_id') ?? companyRef?.replace('boost_', '')

  useEffect(() => {
    if (!transactionToken || !boostId) {
      setState('failed')
      return
    }

    api
      .post('/boost/verify', { boost_id: boostId, transaction_token: transactionToken })
      .then(() => setState('success'))
      .catch(() => setState('failed'))
  }, [transactionToken, boostId])

  return (
    <div className="min-h-dvh bg-surface-900 flex flex-col items-center justify-center px-6 text-center">
      {state === 'verifying' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <Loader2 className="w-12 h-12 text-brand-500 animate-spin mx-auto" />
          <p className="text-white font-bold text-lg">Activating your boost…</p>
          <p className="text-gray-400 text-sm">Confirming payment with DPO Pay</p>
        </motion.div>
      )}

      {state === 'success' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 max-w-xs">
          <div className="w-24 h-24 bg-brand-500/15 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-12 h-12 text-brand-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white mb-2">Boost Activated! 🚀</h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your event is now featured. We've also sent reminder emails to all existing attendees.
            </p>
          </div>
          <div className="bg-surface-800 border border-brand-500/20 rounded-2xl p-4 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-brand-500" />
              <p className="text-brand-500 font-bold text-sm">What happens next</p>
            </div>
            <ul className="text-gray-400 text-sm space-y-1.5">
              <li>• Your event appears in the boosted placement</li>
              <li>• Attendees received a reminder email</li>
              <li>• Boost runs until the end of your selected duration</li>
            </ul>
          </div>
          <button
            onClick={() => router.replace('/events')}
            className="w-full bg-brand-500 text-white rounded-2xl py-4 font-bold"
          >
            View My Events
          </button>
        </motion.div>
      )}

      {state === 'failed' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 max-w-xs">
          <div className="w-24 h-24 bg-red-500/15 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-12 h-12 text-red-400" />
          </div>
          <h1 className="text-2xl font-black text-white">Boost Not Confirmed</h1>
          <p className="text-gray-400 text-sm">The payment could not be verified. You have not been charged. Please try again.</p>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => router.replace('/boost')}
              className="flex-1 bg-brand-500 text-white rounded-2xl py-4 font-bold"
            >
              Try Again
            </button>
            <button
              onClick={() => router.replace('/events')}
              className="flex-1 bg-surface-800 border border-surface-600 text-gray-300 rounded-2xl py-4 font-bold"
            >
              Go Back
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default function BoostSuccessPage() {
  return (
    <Suspense>
      <BoostSuccessContent />
    </Suspense>
  )
}

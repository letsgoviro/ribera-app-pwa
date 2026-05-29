'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronDown, MessageCircle, Mail } from 'lucide-react'
import { BottomNav } from '@/components/layout/BottomNav'

const FAQS = [
  {
    q: 'How do I receive my tickets?',
    a: 'Your tickets are delivered instantly to your email after payment. You can also find all your tickets in the "Tickets" tab of the app — just tap any ticket to show the QR code at the event entrance.',
  },
  {
    q: 'Can I get a refund?',
    a: 'Refund availability depends on the event organiser\'s policy, shown on the event page. If refunds are enabled, you can request one through the Help Center. Ribera\'s service fee is non-refundable.',
  },
  {
    q: 'How do I transfer my ticket to someone else?',
    a: 'If the organiser allows ticket transfers, you\'ll see a "Transfer" button on your ticket in the Wallet. Enter the recipient\'s phone number or email, and the ticket will be reassigned instantly.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept M-Pesa, Airtel Money, Tigo Pesa, and major credit/debit cards through our secure DPO Pay payment gateway. All transactions are protected with industry-standard encryption.',
  },
  {
    q: 'My payment went through but I have no ticket',
    a: 'Please wait a few minutes and refresh your Tickets tab. If the issue persists, contact us at support@ribera.app with your order reference and we\'ll resolve it promptly.',
  },
  {
    q: 'How do I become an event organiser?',
    a: 'Tap "Become an Organiser" on your Profile page and submit your application. Our team reviews applications within 24-48 hours. Organising on Ribera is completely free — zero commission.',
  },
]

function FAQ({ item }: { item: (typeof FAQS)[0] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-surface-800 border border-surface-600 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-4 text-left"
      >
        <span className="text-white font-semibold text-sm pr-3">{item.q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-gray-400 text-sm leading-relaxed px-4 pb-4">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function HelpPage() {
  const router = useRouter()

  return (
    <div className="min-h-dvh bg-surface-900 pb-24 safe-top">
      <div className="px-4 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-surface-800 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-xl font-black text-white">Help Center</h1>
      </div>

      <div className="px-4 space-y-3 pb-6">
        <p className="text-gray-500 text-sm mb-4">Frequently asked questions</p>
        {FAQS.map((faq) => <FAQ key={faq.q} item={faq} />)}
      </div>

      <div className="px-4 pb-4 space-y-3">
        <p className="text-xs text-gray-500 uppercase font-semibold tracking-widest">Still need help?</p>
        <a
          href="mailto:support@ribera.app"
          className="flex items-center gap-3 bg-surface-800 border border-surface-600 rounded-2xl px-4 py-3.5"
        >
          <div className="w-9 h-9 bg-brand-500/15 rounded-xl flex items-center justify-center">
            <Mail className="w-4 h-4 text-brand-500" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Email Support</p>
            <p className="text-gray-500 text-xs">support@ribera.app</p>
          </div>
        </a>
      </div>

      <BottomNav />
    </div>
  )
}

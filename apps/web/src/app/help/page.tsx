'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronDown, Mail } from 'lucide-react'
import { BottomNav } from '@/components/layout/BottomNav'

const FAQS = [
  {
    q: 'How do I buy tickets?',
    a: 'Browse events on the Discover tab, tap any event to open it, then choose your ticket tier and tap "Buy Now". You\'ll be taken through a secure checkout where you can pay via M-Pesa, Airtel Money, Tigo Pesa, or card. Your ticket appears in your Wallet instantly after payment.',
  },
  {
    q: 'Can I get a refund?',
    a: 'Refund availability depends on the event organiser\'s policy, displayed on the event page. If refunds are enabled, tap the ticket in your Wallet and use the "Request Refund" button. Ribera\'s processing fee is non-refundable. Refunds are returned to your original payment method within 3–5 business days.',
  },
  {
    q: 'My QR code isn\'t scanning — what do I do?',
    a: 'First, make sure your screen brightness is turned up to maximum. If the scanner still can\'t read it, ask the attendant to try again from a different angle. If the problem persists, show them your ticket reference number (visible below the QR code) and contact us at support@riberaapp.me with your order details.',
  },
  {
    q: 'How do I transfer my ticket to someone else?',
    a: 'Open your ticket in the Wallet tab and tap the "Transfer" button. Enter the recipient\'s email address — they must have a Ribera account. The ticket will be moved to their Wallet immediately and removed from yours. Transfers cannot be reversed.',
  },
  {
    q: 'How do I become an organiser?',
    a: 'Tap "Become an Organiser" on your Profile page and fill in the application form. Include your full name, organisation details, and payout account information. Our team reviews applications within 24–48 hours. Organising on Ribera is free — we charge zero commission on ticket sales.',
  },
  {
    q: 'How do I contact support?',
    a: 'Email us at support@riberaapp.me and we\'ll get back to you within one business day. When writing in, please include your name, the event name, and your order reference number so we can help you faster.',
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
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-surface-800 flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-xl font-black text-white">Help Center</h1>
      </div>

      <div className="px-4 space-y-3 pb-6">
        <p className="text-gray-500 text-sm mb-4">Frequently asked questions</p>
        {FAQS.map((faq) => (
          <FAQ key={faq.q} item={faq} />
        ))}
      </div>

      <div className="px-4 pb-4 space-y-3">
        <p className="text-xs text-gray-500 uppercase font-semibold tracking-widest">Still need help?</p>
        <a
          href="mailto:support@riberaapp.me"
          className="flex items-center gap-3 bg-surface-800 border border-surface-600 rounded-2xl px-4 py-3.5 active:scale-[0.98] transition-transform"
        >
          <div className="w-9 h-9 bg-brand-500/15 rounded-xl flex items-center justify-center">
            <Mail className="w-4 h-4 text-brand-500" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Contact Support</p>
            <p className="text-gray-500 text-xs">support@riberaapp.me</p>
          </div>
        </a>
      </div>

      <BottomNav />
    </div>
  )
}

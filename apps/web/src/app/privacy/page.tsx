'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { BottomNav } from '@/components/layout/BottomNav'

const SECTIONS = [
  {
    title: 'Information We Collect',
    body: 'We collect information you provide directly to us, such as your name, phone number, email address, and payment information when you purchase tickets. We also collect information automatically when you use the app, including device information and usage data.',
  },
  {
    title: 'How We Use Your Information',
    body: 'We use the information we collect to process transactions, send you ticket confirmations, provide customer support, send promotional communications (with your consent), and improve our services.',
  },
  {
    title: 'Data Sharing',
    body: 'We share your information with event organisers only to the extent necessary to fulfil your ticket purchase. We do not sell your personal information to third parties.',
  },
  {
    title: 'Data Security',
    body: 'We implement appropriate technical and organisational security measures to protect your personal information against unauthorised access, alteration, disclosure, or destruction.',
  },
  {
    title: 'Your Rights',
    body: 'You have the right to access, correct, or delete your personal information. You may also opt out of promotional communications at any time by updating your preferences in the Profile section.',
  },
  {
    title: 'Contact Us',
    body: 'If you have questions about this Privacy Policy, please contact us at privacy@ribera.app.',
  },
]

export default function PrivacyPage() {
  const router = useRouter()

  return (
    <div className="min-h-dvh bg-surface-900 pb-24 safe-top">
      <div className="px-4 pt-6 pb-4 flex items-center gap-3 border-b border-surface-700">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-surface-800 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-xl font-black text-white">Privacy & Security</h1>
          <p className="text-gray-500 text-xs">Last updated January 2025</p>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-5 pb-8">
        {SECTIONS.map((s) => (
          <div key={s.title} className="bg-surface-800 border border-surface-600 rounded-2xl p-4">
            <h2 className="font-bold text-white mb-2 text-sm">{s.title}</h2>
            <p className="text-gray-400 text-sm leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  )
}

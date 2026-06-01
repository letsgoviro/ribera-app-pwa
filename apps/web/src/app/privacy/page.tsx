'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { BottomNav } from '@/components/layout/BottomNav'

const SECTIONS = [
  {
    title: 'What We Collect',
    body: 'We collect information you give us directly: your name, phone number, email address, and payment details when you buy tickets. We also collect information automatically — your device type, IP address, and how you use the app — to keep things working smoothly and securely.',
  },
  {
    title: 'How We Use It',
    body: 'Your information is used to process ticket purchases, send confirmation emails and QR codes, provide customer support, and improve the Ribera platform. With your consent, we may also send you news about events you might enjoy. We will never use your data for purposes you have not agreed to.',
  },
  {
    title: 'Who We Share With',
    body: 'We share your name and contact details with event organisers only to the extent needed to honour your ticket purchase (for example, for guestlist check-in). We work with DPO Pay to process payments securely — they handle your card or mobile money details under their own privacy policy. We do not sell your personal data to any third party.',
  },
  {
    title: 'Your Rights (PDPA)',
    body: 'Under Tanzania\'s Personal Data Protection Act (PDPA) 2022, you have the right to access, correct, or delete your personal information at any time. You may also withdraw consent for marketing communications. To exercise any of these rights, email privacy@riberaapp.me and we will respond within 14 days.',
  },
  {
    title: 'Data Security',
    body: 'All data is transmitted over HTTPS and stored on servers with industry-standard encryption. Payment processing is handled by PCI-DSS compliant providers. We retain your data only as long as necessary to fulfil the purposes above, or as required by Tanzanian law.',
  },
  {
    title: 'Contact Us',
    body: 'For any privacy-related questions or requests, contact our Data Protection Officer at privacy@riberaapp.me. Ribera is operated by Ribera Technologies Ltd, registered in Tanzania.',
  },
]

export default function PrivacyPage() {
  const router = useRouter()

  return (
    <div className="min-h-dvh bg-surface-900 pb-24 safe-top">
      <div className="px-4 pt-6 pb-4 flex items-center gap-3 border-b border-surface-700">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-surface-800 flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-xl font-black text-white">Privacy Policy</h1>
          <p className="text-gray-500 text-xs">Last updated June 2025 · PDPA compliant</p>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-4 pb-8">
        <p className="text-gray-500 text-sm leading-relaxed">
          Ribera is committed to protecting your privacy. This policy explains what personal data we collect, why
          we collect it, and how you can control it.
        </p>

        {SECTIONS.map((s) => (
          <div key={s.title} className="bg-surface-800 border border-surface-600 rounded-2xl p-4">
            <h2 className="font-bold text-white mb-2 text-sm">{s.title}</h2>
            <p className="text-gray-400 text-sm leading-relaxed">{s.body}</p>
          </div>
        ))}

        <a
          href="mailto:privacy@riberaapp.me"
          className="block w-full text-center bg-brand-500/10 border border-brand-500/30 text-brand-400 rounded-2xl py-3.5 text-sm font-semibold active:scale-[0.98] transition-transform"
        >
          privacy@riberaapp.me
        </a>
      </div>

      <BottomNav />
    </div>
  )
}

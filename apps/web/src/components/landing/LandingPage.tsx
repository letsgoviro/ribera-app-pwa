'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu, X, Ticket, CreditCard, BarChart3, Globe, Smartphone, Shield,
  Check, ChevronRight, ArrowRight, Users, Zap, Crown,
  Plus, Share2, QrCode, Instagram, Twitter, Heart, Download
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────

type Lang = 'en' | 'sw'

interface LandingPageProps {
  language: Lang
  onLanguageChange: (lang: Lang) => void
  onEnterApp: () => void
}

// ─── Content map ────────────────────────────────────────────────────────────

const t = {
  en: {
    nav: { home: 'Home', features: 'Features', howItWorks: 'How It Works', pricing: 'Pricing', download: 'Download' },
    getStarted: 'Get Started Free',
    hero: {
      headline: ['Plan.', 'Connect.', 'Celebrate.'],
      subtext: "Africa's leading event & e-ticketing platform — free for organizers, seamless for attendees, powerful for everyone.",
      browseCta: 'Browse Events',
      downloadCta: 'Download App',
      organizerCta: 'Start for Free',
      taglines: [
        "Africa's #1 Event Ticketing Platform",
        'Zero Commission. Keep Every Penny.',
        'Built for Organizers, Loved by Attendees',
        'Sell Tickets. Get Paid Instantly.',
        'From Nairobi to Lagos — We Run Events.',
        'Simple to Use. Powerful to Scale.',
        'Your Event, Your Money, Your Way.',
      ],
      verifiedLabel: 'Ticket Verified',
      verifiedSub: 'QR Code Scanned',
      paymentsLabel: 'Payments Accepted',
      paymentsSub: 'Cards · M-Pesa · Airtel · MTN',
    },
    stats: ['10,000+ Attendees', '500+ Events Hosted', '4.8★ Organizer Rating', '0% Commission Always'],
    features: {
      title: 'Built for African Events',
      subtitle: "Everything your event needs — from a small meetup to a 50,000-seat festival. And it's free for organizers.",
      items: [
        { icon: Ticket, title: 'Smart Digital Ticketing', desc: 'QR code tickets with real-time scanning, fraud protection, and instant check-in at the door.' },
        { icon: CreditCard, title: 'Accept Any Payment', desc: 'Visa, Mastercard, M-Pesa, Airtel Money, MTN MoMo, Orange Money, and more — all in one checkout.' },
        { icon: BarChart3, title: 'Organizer Dashboard', desc: 'Live sales, attendee analytics, revenue tracking, and a built-in QR scanner — all in your pocket.' },
        { icon: Globe, title: 'Pan-African Reach', desc: 'Available across Africa with multi-currency support. Your audience, wherever they are.' },
        { icon: Smartphone, title: 'Install as App', desc: 'Works as a PWA — install on any phone like a native app, no app store required. Tickets work offline.' },
        { icon: Shield, title: 'Bank-Grade Security', desc: 'End-to-end encrypted payments, fraud detection, and enterprise security on every transaction.' },
      ],
    },
    howItWorks: {
      title: 'Up and Running in Minutes',
      subtitle: 'No contracts, no setup fees, no commission. Just create and sell.',
      steps: [
        { icon: Plus, num: '01', title: 'Create Your Event Free', desc: 'Sign up free, build your event page in minutes — set ticket tiers, upload a poster, go live instantly.' },
        { icon: Share2, num: '02', title: 'Sell to Anyone', desc: 'Share your link anywhere. Attendees buy with cards or mobile money and get instant QR tickets.' },
        { icon: QrCode, num: '03', title: 'Check In & Collect', desc: 'Scan tickets at the gate with your phone. Revenue lands in your account — zero cuts from us.' },
      ],
    },
    pricing: {
      title: 'Genuinely Free for Organizers',
      subtitle: 'We charge buyers a small service fee. You keep 100% of your ticket revenue.',
      badge: 'How we make money',
      plans: [
        {
          icon: Crown,
          name: 'Organizer',
          period: 'Always free',
          price: 'FREE',
          sub: '0% commission forever',
          desc: 'Create unlimited events, sell unlimited tickets — no monthly fees, no commission, ever.',
          features: [
            'Unlimited events & tickets',
            'All ticket types (VIP, Table, Standing, Online)',
            'Card & mobile money payments',
            'Real-time dashboard & analytics',
            'QR scanner app included',
            'Attendee email & SMS notifications',
            'Boost & promote your events',
          ],
          popular: true,
          cta: 'Start Organizing Free',
          href: '/become-organiser',
        },
        {
          icon: Zap,
          name: 'Attendee',
          period: 'Per ticket purchased',
          price: '5%',
          sub: 'service fee on ticket price',
          desc: 'Buyers pay a small platform fee on top of the ticket price. Organizers pay nothing.',
          features: [
            'Instant QR ticket delivery',
            'Pay by card or mobile money',
            'Download & share tickets',
            'Transfer tickets to friends',
            'Refund protection',
            'Wallet with all your tickets',
          ],
          popular: false,
          cta: 'Browse Events',
          href: '/app',
        },
        {
          icon: Users,
          name: 'Enterprise',
          period: 'Custom partnership',
          price: 'Talk to us',
          sub: 'White-label & volume deals',
          desc: 'For festivals, venues, stadiums, and large institutions with custom requirements.',
          features: [
            'White-label ticketing platform',
            'Dedicated account manager',
            'Custom payment integrations',
            'API access for your systems',
            'Volume pricing available',
            'SLA & priority support',
          ],
          popular: false,
          cta: 'Contact Us',
          href: 'mailto:support@riberaapp.me',
        },
      ],
    },
    download: {
      title: 'Get Ribera on Any Device',
      subtitle: 'Web app, mobile app, or install as a PWA — Ribera works everywhere.',
      playStore: 'Google Play',
      appStore: 'App Store',
      browser: 'Open Web App',
      organizers: 'Organizer Portal',
      comingSoon: 'Coming Soon',
    },
    footer: {
      tagline: "Africa's modern event & ticketing platform — powered by CIFIC Enterprises.",
      product: 'Product',
      organizers: 'For Organizers',
      support: 'Support',
      connect: 'Connect',
      productLinks: [
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Download', href: '#download' },
        { label: 'Browse Events', href: '/app' },
      ],
      organizerLinks: [
        { label: 'Create Free Account', href: '/become-organiser' },
        { label: 'Organizer Dashboard', href: 'https://organise.ribera.app' },
        { label: 'Ticket Scanner', href: 'https://organise.ribera.app/scanner' },
        { label: 'Boost Your Event', href: '/become-organiser' },
      ],
      supportLinks: [
        { label: 'Help Center', href: '/help' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Contact Us', href: 'mailto:support@riberaapp.me' },
        { label: 'Terms of Use', href: '/privacy' },
      ],
      copyright: '© 2025 Ribera | CIFIC Enterprises | Africa 🌍',
      love: 'Built with ❤️ for African events',
    },
  },
  sw: {
    nav: { home: 'Nyumbani', features: 'Vipengele', howItWorks: 'Jinsi Inavyofanya Kazi', pricing: 'Bei', download: 'Pakua' },
    getStarted: 'Anza Bure Sasa',
    hero: {
      headline: ['Panga.', 'Unganika.', 'Sherehekea.'],
      subtext: 'Jukwaa kuu la matukio na tiketi Afrika — bure kwa waandaaji, rahisi kwa washiriki, lenye nguvu kwa wote.',
      browseCta: 'Angalia Matukio',
      downloadCta: 'Pakua Programu',
      organizerCta: 'Anza Bila Malipo',
      taglines: [
        'Jukwaa Nambari 1 la Tiketi Afrika',
        'Kamisheni Sifuri. Pata Kila Senti.',
        'Imeundwa kwa Waandaaji, Inapendwa na Washiriki',
        'Uza Tiketi. Pokea Malipo Papo Hapo.',
        'Kutoka Nairobi Hadi Lagos — Tunaendesha Matukio.',
        'Rahisi Kutumia. Nguvu ya Kukua.',
        'Tukio Lako, Pesa Yako, Njia Yako.',
      ],
      verifiedLabel: 'Tiketi Imethibitishwa',
      verifiedSub: 'Msimbo wa QR Umesomwa',
      paymentsLabel: 'Malipo Yanakubaliwa',
      paymentsSub: 'Kadi · M-Pesa · Airtel · MTN',
    },
    stats: ['Washiriki 10,000+', 'Matukio 500+ Yaliyoandaliwa', 'Ukadiriaji 4.8★', 'Kamisheni 0% Daima'],
    features: {
      title: 'Imetengenezwa kwa Matukio ya Afrika',
      subtitle: 'Kila kitu tukio lako linahitaji — kutoka mkutano mdogo hadi tamasha la watu 50,000. Na ni bure kwa waandaaji.',
      items: [
        { icon: Ticket, title: 'Tiketi za Kidigitali', desc: 'Tiketi za msimbo wa QR zenye uthibitisho wa wakati halisi na ulinzi dhidi ya udanganyifu.' },
        { icon: CreditCard, title: 'Kukubali Malipo Yoyote', desc: 'Visa, Mastercard, M-Pesa, Airtel Money, MTN MoMo, Orange Money na zaidi — yote katika checkout moja.' },
        { icon: BarChart3, title: 'Dashibodi ya Mwandaaji', desc: 'Mauzo ya moja kwa moja, takwimu za washiriki, ufuatiliaji wa mapato, na skana ya QR — yote mfukoni mwako.' },
        { icon: Globe, title: 'Ufikio wa Afrika Nzima', desc: 'Inapatikana kote Afrika na msaada wa sarafu nyingi. Watazamaji wako, popote walipo.' },
        { icon: Smartphone, title: 'Sakinisha kama Programu', desc: 'Inafanya kazi kama PWA — sakinisha kwenye simu yoyote kama programu asili, bila duka la programu.' },
        { icon: Shield, title: 'Usalama wa Kiwango cha Benki', desc: 'Malipo yaliyosimbwa kutoka mwisho hadi mwisho, ugunduzi wa udanganyifu, na usalama wa biashara.' },
      ],
    },
    howItWorks: {
      title: 'Uko Tayari kwa Dakika Chache',
      subtitle: 'Hakuna mikataba, hakuna ada za usanidi, hakuna kamisheni. Tengeneza tu na uze.',
      steps: [
        { icon: Plus, num: '01', title: 'Tengeneza Tukio Lako Bure', desc: 'Jiandikishe bure, jenga ukurasa wako wa tukio kwa dakika chache — weka bei za tiketi, pakia bango, nenda moja kwa moja.' },
        { icon: Share2, num: '02', title: 'Uza kwa Mtu Yeyote', desc: 'Sambaza kiungo chako popote. Washiriki wananunua kwa kadi au pesa ya simu na kupata tiketi za QR papo hapo.' },
        { icon: QrCode, num: '03', title: 'Kagua na Pokea Malipo', desc: 'Scan tiketi langoni kwa simu yako. Mapato yanafika akaunti yako — bila kupunguzwa kwetu.' },
      ],
    },
    pricing: {
      title: 'Kweli Kabisa Bure kwa Waandaaji',
      subtitle: 'Tunatozwa washiriki ada ndogo ya huduma. Wewe unaendelea na mapato yako yote 100%.',
      badge: 'Jinsi tunavyopata pesa',
      plans: [
        {
          icon: Crown,
          name: 'Mwandaaji',
          period: 'Bure daima',
          price: 'BURE',
          sub: 'Kamisheni 0% milele',
          desc: 'Tengeneza matukio yasiyo na kikomo, uze tiketi bila kikomo — bila ada za kila mwezi, bila kamisheni, kamwe.',
          features: [
            'Matukio na tiketi zisizo na kikomo',
            'Aina zote za tiketi (VIP, Meza, Kusimama, Mtandaoni)',
            'Malipo ya kadi na pesa ya simu',
            'Dashibodi na takwimu za wakati halisi',
            'Programu ya skana ya QR imejumuishwa',
            'Arifa za barua pepe na SMS kwa washiriki',
            'Kuimarisha na kutangaza matukio yako',
          ],
          popular: true,
          cta: 'Anza Kuandaa Bure',
          href: '/become-organiser',
        },
        {
          icon: Zap,
          name: 'Mshiriki',
          period: 'Kwa kila tiketi iliyonunuliwa',
          price: '5%',
          sub: 'ada ya huduma juu ya bei ya tiketi',
          desc: 'Wanunuzi wanalipa ada ndogo ya jukwaa juu ya bei ya tiketi. Waandaaji hawalipii chochote.',
          features: [
            'Utoaji wa tiketi ya QR papo hapo',
            'Lipa kwa kadi au pesa ya simu',
            'Pakua na kushiriki tiketi',
            'Hamisha tiketi kwa marafiki',
            'Ulinzi wa kurejeshwa pesa',
            'Mkoba wenye tiketi zako zote',
          ],
          popular: false,
          cta: 'Angalia Matukio',
          href: '/app',
        },
        {
          icon: Users,
          name: 'Biashara',
          period: 'Ushirikiano maalum',
          price: 'Zungumza Nasi',
          sub: 'Lebo nyeupe na mikataba ya wingi',
          desc: 'Kwa tamasha, maeneo, viwanja, na taasisi kubwa zenye mahitaji maalum.',
          features: [
            'Jukwaa la tiketi la lebo nyeupe',
            'Meneja wa akaunti aliyejitolea',
            'Muunganisho maalum wa malipo',
            'Ufikiaji wa API kwa mifumo yako',
            'Bei ya wingi inapatikana',
            'SLA na msaada wa kipaumbele',
          ],
          popular: false,
          cta: 'Wasiliana Nasi',
          href: 'mailto:support@riberaapp.me',
        },
      ],
    },
    download: {
      title: 'Pata Ribera kwenye Kifaa Chochote',
      subtitle: 'Programu ya wavuti, programu ya simu, au sakinisha kama PWA — Ribera inafanya kazi kila mahali.',
      playStore: 'Google Play',
      appStore: 'App Store',
      browser: 'Fungua Programu ya Wavuti',
      organizers: 'Lango la Waandaaji',
      comingSoon: 'Inakuja Hivi Karibuni',
    },
    footer: {
      tagline: 'Jukwaa la kisasa la matukio na tiketi Afrika — linaloendeshwa na CIFIC Enterprises.',
      product: 'Bidhaa',
      organizers: 'Kwa Waandaaji',
      support: 'Msaada',
      connect: 'Unganisha',
      productLinks: [
        { label: 'Vipengele', href: '#features' },
        { label: 'Bei', href: '#pricing' },
        { label: 'Pakua', href: '#download' },
        { label: 'Angalia Matukio', href: '/app' },
      ],
      organizerLinks: [
        { label: 'Tengeneza Akaunti Bure', href: '/become-organiser' },
        { label: 'Dashibodi ya Mwandaaji', href: 'https://organise.ribera.app' },
        { label: 'Skana ya Tiketi', href: 'https://organise.ribera.app/scanner' },
        { label: 'Kuimarisha Tukio Lako', href: '/become-organiser' },
      ],
      supportLinks: [
        { label: 'Kituo cha Msaada', href: '/help' },
        { label: 'Sera ya Faragha', href: '/privacy' },
        { label: 'Wasiliana Nasi', href: 'mailto:support@riberaapp.me' },
        { label: 'Masharti ya Matumizi', href: '/privacy' },
      ],
      copyright: '© 2025 Ribera | CIFIC Enterprises | Afrika 🌍',
      love: 'Imetengenezwa kwa ❤️ kwa matukio ya Afrika',
    },
  },
}

// ─── Scroll-spy hook ─────────────────────────────────────────────────────────

function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const handler = () => {
      const scrollY = window.scrollY + 80
      let current = ids[0]
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.offsetTop <= scrollY) current = id
      }
      setActive(current)
    }
    window.addEventListener('scroll', handler, { passive: true })
    handler()
    return () => window.removeEventListener('scroll', handler)
  }, [ids])
  return active
}

// ─── Gradient blob component ─────────────────────────────────────────────────

function GradientBlob({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.65, 0.4] }}
      transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  )
}

// ─── HEADER ──────────────────────────────────────────────────────────────────

function Header({ lang, setLang, onGetStarted }: { lang: Lang; setLang: (l: Lang) => void; onGetStarted: () => void }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const content = t[lang]
  const sections = ['home', 'features', 'how-it-works', 'pricing', 'download']
  const active = useScrollSpy(sections)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const navLabels: Record<string, string> = {
    home: content.nav.home,
    features: content.nav.features,
    'how-it-works': content.nav.howItWorks,
    pricing: content.nav.pricing,
    download: content.nav.download,
  }

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm shadow-gray-200/60'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-3 group" onClick={() => setOpen(false)}>
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-brand-500/20 flex-shrink-0">
              <img src="/logo.png" alt="Ribera" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
            <span className="text-xl font-black text-brand-500 tracking-tight">Ribera</span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {sections.map((id) => (
              <a
                key={id}
                href={`#${id}`}
                className={`text-sm font-semibold transition-all duration-200 hover:text-gray-900 ${
                  active === id ? 'text-brand-500' : 'text-gray-600'
                }`}
              >
                {navLabels[id]}
              </a>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            {/* Language pill */}
            <div className="flex items-center bg-gray-100 border border-gray-200 rounded-full p-0.5">
              {(['en', 'sw'] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-3.5 py-1.5 text-xs font-black rounded-full transition-all duration-200 ${
                    lang === l
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            {/* CTA — desktop */}
            <motion.button
              onClick={onGetStarted}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="hidden md:flex items-center gap-2 bg-coral-500 hover:bg-coral-600 text-white text-sm font-black px-5 py-2.5 rounded-full shadow-lg shadow-coral-500/30 transition-colors"
            >
              {content.getStarted}
              <ChevronRight className="w-4 h-4" />
            </motion.button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden bg-white border-b border-gray-200 shadow-xl"
          >
            <div className="px-4 py-5 space-y-1">
              {sections.map((id, i) => (
                <motion.a
                  key={id}
                  href={`#${id}`}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="block py-3 text-base font-semibold text-gray-700 hover:text-gray-900 border-b border-gray-100 last:border-0 transition-colors"
                >
                  {navLabels[id]}
                </motion.a>
              ))}
              <div className="pt-3">
                <button
                  onClick={() => { onGetStarted(); setOpen(false) }}
                  className="w-full bg-coral-500 text-white font-black py-3 rounded-xl shadow-lg shadow-coral-500/30 text-sm"
                >
                  {content.getStarted}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

// ─── HERO ─────────────────────────────────────────────────────────────────────

function HeroSection({ lang, onEnterApp }: { lang: Lang; onEnterApp: () => void }) {
  const content = t[lang]
  const [taglineIdx, setTaglineIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTaglineIdx((i) => (i + 1) % content.hero.taglines.length), 4000)
    return () => clearInterval(id)
  }, [content.hero.taglines.length])

  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden pt-16 bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      {/* Animated blobs — very subtle on light background */}
      <GradientBlob className="w-[600px] h-[600px] bg-coral-500/8 -top-32 -left-40" delay={0} />
      <GradientBlob className="w-[500px] h-[500px] bg-violet-500/6 top-20 right-[-120px]" delay={2} />
      <GradientBlob className="w-[400px] h-[400px] bg-teal-500/6 bottom-10 left-1/3" delay={4} />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left — content */}
          <div className="space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 bg-brand-500/8 border border-brand-500/20 text-brand-500 text-xs font-black px-4 py-2 rounded-full">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                Africa's #1 Event Ticketing Platform
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black leading-none tracking-tight"
            >
              {content.hero.headline.map((word, i) => (
                <span key={word} className="inline-block mr-4">
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 + i * 0.12 }}
                    className={
                      i === 0 ? 'text-gray-900' :
                      i === 1 ? 'text-coral-500' :
                      'bg-gradient-to-r from-teal-400 to-brand-500 bg-clip-text text-transparent'
                    }
                  >
                    {word}
                  </motion.span>
                </span>
              ))}
            </motion.h1>

            {/* Rotating tagline */}
            <div className="h-8 flex items-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={taglineIdx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.5 }}
                  className="text-lg sm:text-xl font-bold text-coral-500"
                >
                  {content.hero.taglines[taglineIdx]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-lg"
            >
              {content.hero.subtext}
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55 }}
              className="flex flex-wrap gap-3"
            >
              <motion.button
                onClick={onEnterApp}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-black text-sm px-7 py-3.5 rounded-full shadow-xl shadow-brand-500/30 transition-colors"
              >
                {content.hero.browseCta}
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              <motion.a
                href="#download"
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 border-2 border-coral-500 text-coral-500 hover:bg-coral-500/10 font-black text-sm px-7 py-3.5 rounded-full transition-all"
              >
                <Download className="w-4 h-4" />
                {content.hero.downloadCta}
              </motion.a>

              <motion.a
                href="/auth?next=/become-organiser"
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-bold text-sm px-5 py-3.5 rounded-full border border-gray-200 hover:border-gray-300 transition-all"
              >
                {content.hero.organizerCta}
              </motion.a>
            </motion.div>
          </div>

          {/* Right — phone mockup */}
          <motion.div
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.3, ease: 'easeOut' }}
            className="relative hidden lg:flex items-center justify-center"
          >
            {/* Phone frame */}
            <motion.div
              animate={{ y: [0, -18, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="relative z-10"
            >
              {/* Phone outer shell — real app screenshot */}
              <div className="relative w-[260px] h-[540px] bg-gray-100 border-2 border-gray-300 rounded-[3rem] shadow-2xl overflow-hidden">
                {/* Notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-20" />
                {/* Real screenshot */}
                <img
                  src="/app-screenshot.png"
                  alt="Ribera App"
                  className="absolute inset-0 w-full h-full object-cover object-top"
                  loading="lazy"
                />
                {/* Screen glare */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent pointer-events-none rounded-[3rem]" />
              </div>
            </motion.div>

            {/* Floating card — Ticket Verified */}
            <motion.div
              animate={{ y: [-12, 12, -12], rotate: [-1, 1, -1] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -left-12 top-24 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl px-4 py-3 shadow-lg z-20"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-500" strokeWidth={3} />
                </div>
                <div>
                  <p className="text-gray-900 text-xs font-black">{content.hero.verifiedLabel}</p>
                  <p className="text-gray-500 text-[10px]">{content.hero.verifiedSub}</p>
                </div>
              </div>
            </motion.div>

            {/* Floating card — Payments */}
            <motion.div
              animate={{ y: [14, -14, 14], rotate: [1, -1, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -right-10 bottom-28 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl px-4 py-3 shadow-lg z-20"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-teal-500" />
                </div>
                <div>
                  <p className="text-gray-900 text-xs font-black">{content.hero.paymentsLabel}</p>
                  <p className="text-gray-500 text-[10px]">{content.hero.paymentsSub}</p>
                </div>
              </div>
            </motion.div>

            {/* Glow behind phone */}
            <div className="absolute inset-0 bg-gradient-to-r from-coral-500/8 via-violet-500/8 to-teal-500/8 blur-3xl rounded-full scale-150 pointer-events-none" />
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </section>
  )
}

// ─── STATS BAR ───────────────────────────────────────────────────────────────

function StatsBar({ lang }: { lang: Lang }) {
  const stats = t[lang].stats
  return (
    <section className="relative py-10 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-y border-gray-100 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-coral-500/3 via-violet-500/3 to-teal-500/3" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-2xl font-black text-gray-900 tracking-tight">{stat.split(' ')[0]}</p>
              <p className="text-gray-500 text-sm font-semibold mt-0.5">{stat.split(' ').slice(1).join(' ')}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FEATURES ────────────────────────────────────────────────────────────────

function FeaturesSection({ lang }: { lang: Lang }) {
  const content = t[lang].features
  const iconColors = [
    'bg-coral-500/15 text-coral-500',
    'bg-teal-500/15 text-teal-500',
    'bg-brand-500/15 text-brand-500',
    'bg-violet-500/15 text-violet-500',
    'bg-green-500/15 text-green-500',
    'bg-amber-500/15 text-amber-500',
  ]

  return (
    <section id="features" className="py-24 bg-white relative overflow-hidden">
      <GradientBlob className="w-96 h-96 bg-violet-500/5 -right-20 top-20" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <p className="text-coral-500 text-sm font-black uppercase tracking-widest">Platform Features</p>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">{content.title}</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">{content.subtitle}</p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {content.items.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group relative bg-white border border-gray-100 hover:border-brand-500/20 rounded-2xl p-7 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-coral-500/3 to-violet-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${iconColors[i]}`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-gray-900 font-black text-base mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────

function HowItWorksSection({ lang }: { lang: Lang }) {
  const content = t[lang].howItWorks
  return (
    <section id="how-it-works" className="py-24 relative bg-gray-50/50 overflow-hidden">
      <GradientBlob className="w-80 h-80 bg-coral-500/5 -left-20 bottom-20" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <p className="text-teal-500 text-sm font-black uppercase tracking-widest">Simple Process</p>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">{content.title}</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">{content.subtitle}</p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line — desktop */}
          <div className="hidden md:block absolute top-16 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-coral-500/40 via-teal-500/40 to-violet-500/40" />

          {content.steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="relative text-center"
            >
              {/* Step number circle */}
              <div className="relative z-10 mb-6 flex flex-col items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-full bg-white border-2 flex items-center justify-center font-black text-lg shadow-sm ${
                    i === 0 ? 'border-coral-500 text-coral-500' :
                    i === 1 ? 'border-teal-500 text-teal-500' :
                    'border-violet-500 text-violet-500'
                  }`}
                >
                  {step.num}
                </div>
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    i === 0 ? 'bg-coral-500/15 text-coral-500' :
                    i === 1 ? 'bg-teal-500/15 text-teal-500' :
                    'bg-violet-500/15 text-violet-500'
                  }`}
                >
                  <step.icon className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-gray-900 font-black text-lg mb-3">{step.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── PRICING ─────────────────────────────────────────────────────────────────

function PricingSection({ lang }: { lang: Lang }) {
  const content = t[lang].pricing

  return (
    <section id="pricing" className="py-24 bg-white relative overflow-hidden">
      <GradientBlob className="w-96 h-96 bg-teal-500/5 right-0 top-10" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <p className="text-violet-500 text-sm font-black uppercase tracking-widest">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">{content.title}</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">{content.subtitle}</p>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {content.plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className={`relative flex flex-col rounded-3xl border-2 overflow-hidden transition-shadow duration-300 ${
                plan.popular
                  ? 'bg-gradient-to-br from-brand-500 to-violet-500 border-transparent shadow-2xl shadow-brand-500/25'
                  : 'bg-white border-gray-100 shadow-md hover:shadow-xl hover:border-gray-200'
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute top-0 inset-x-0 flex justify-center">
                  <div className="bg-white/20 backdrop-blur-sm text-white text-xs font-black px-5 py-1.5 rounded-b-xl flex items-center gap-1.5">
                    <Crown className="w-3 h-3" />
                    {lang === 'en' ? 'Most Popular' : 'Maarufu Zaidi'}
                  </div>
                </div>
              )}

              <div className={`p-8 flex flex-col flex-1 ${plan.popular ? 'pt-12' : ''}`}>
                {/* Icon + name */}
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    plan.popular ? 'bg-white/20 text-white' : 'bg-gray-50 text-gray-500'
                  }`}>
                    <plan.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`font-black text-sm ${plan.popular ? 'text-white' : 'text-gray-900'}`}>{plan.name}</p>
                    <p className={`text-xs ${plan.popular ? 'text-white/70' : 'text-gray-500'}`}>{plan.period}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <span className={`text-5xl font-black ${plan.popular ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
                  <p className={`text-sm mt-1 ${plan.popular ? 'text-white/70' : 'text-gray-500'}`}>{plan.sub}</p>
                </div>

                <p className={`text-sm mb-6 ${plan.popular ? 'text-white/80' : 'text-gray-600'}`}>{plan.desc}</p>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-white' : 'text-green-500'}`} strokeWidth={2.5} />
                      <span className={`text-sm ${plan.popular ? 'text-white/90' : 'text-gray-700'}`}>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href={plan.href}
                  className={`block text-center font-black text-sm py-3.5 rounded-xl transition-all duration-200 ${
                    plan.popular
                      ? 'bg-white text-brand-600 hover:bg-gray-50 shadow-sm'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-200'
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── DOWNLOAD ────────────────────────────────────────────────────────────────

function DownloadSection({ lang }: { lang: Lang }) {
  const content = t[lang].download

  return (
    <section id="download" className="py-24 relative overflow-hidden bg-gradient-to-br from-brand-500/5 via-white to-violet-500/5">
      <GradientBlob className="w-[500px] h-[500px] bg-brand-500/5 -left-20 top-0" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14 space-y-4"
        >
          <p className="text-brand-500 text-sm font-black uppercase tracking-widest">Download</p>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">{content.title}</h2>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">{content.subtitle}</p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-4 mb-10">
          {/* Google Play */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.04, y: -3 }}
            className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl px-6 py-4 cursor-pointer hover:border-gray-200 transition-all shadow-sm hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center text-lg">▶</div>
            <div className="text-left">
              <p className="text-gray-500 text-xs">{content.comingSoon}</p>
              <p className="text-gray-900 font-black text-sm">{content.playStore}</p>
            </div>
          </motion.div>

          {/* App Store */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.04, y: -3 }}
            className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl px-6 py-4 cursor-pointer hover:border-gray-200 transition-all shadow-sm hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-lg">🍎</div>
            <div className="text-left">
              <p className="text-gray-500 text-xs">{content.comingSoon}</p>
              <p className="text-gray-900 font-black text-sm">{content.appStore}</p>
            </div>
          </motion.div>

          {/* Open in Browser */}
          <motion.a
            href="/app"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.04, y: -3 }}
            className="flex items-center gap-4 bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl px-6 py-4 cursor-pointer shadow-xl shadow-brand-500/25 transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-white/70 text-xs">Available now</p>
              <p className="text-white font-black text-sm">{content.browser}</p>
            </div>
          </motion.a>
        </div>

        {/* Organizer CTA strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-white border border-gray-100 rounded-2xl p-6 max-w-2xl mx-auto shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-coral-500/15 flex items-center justify-center">
              <Users className="w-5 h-5 text-coral-500" />
            </div>
            <p className="text-gray-700 text-sm font-semibold">
              {lang === 'en' ? 'Are you an event organizer?' : 'Je, wewe ni mpangaji wa matukio?'}
            </p>
          </div>
          <a
            href="https://organiser.riberaapp.me"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-coral-500 to-violet-500 text-white font-black text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-coral-500/20 hover:opacity-90 transition-opacity"
          >
            {content.organizers}
            <ChevronRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────

function Footer({ lang }: { lang: Lang }) {
  const content = t[lang].footer

  const columns = [
    { title: content.product, links: content.productLinks },
    { title: content.organizers, links: content.organizerLinks },
    { title: content.support, links: content.supportLinks },
  ]

  return (
    <footer className="bg-gray-900 border-t border-gray-800 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand column */}
          <div className="space-y-5">
            <a href="#home" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden">
                <img src="/logo.png" alt="Ribera" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </div>
              <span className="text-xl font-black text-brand-500">Ribera</span>
            </a>
            <p className="text-gray-400 text-sm leading-relaxed">{content.tagline}</p>

            {/* Contact details */}
            <div className="space-y-2 text-xs text-gray-400">
              <a href="mailto:support@riberaapp.me" className="flex items-center gap-2 hover:text-gray-200 transition-colors">
                <span className="text-brand-500">✉</span> support@riberaapp.me
              </a>
              <a href="tel:+255760727437" className="flex items-center gap-2 hover:text-gray-200 transition-colors">
                <span className="text-brand-500">📞</span> +255 760 727 437
              </a>
              <div className="flex items-start gap-2">
                <span className="text-brand-500 mt-0.5">📍</span>
                <span>Block 2958 Upanga<br />Dar es Salaam, Tanzania</span>
              </div>
            </div>

            {/* Social links */}
            <div className="flex gap-2.5 flex-wrap">
              {[
                { label: 'Instagram', href: 'https://instagram.com/ribera.app', Icon: Instagram },
                { label: 'Twitter/X', href: 'https://twitter.com/ribera_app', Icon: Twitter },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:border-brand-500/40 transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
              {/* TikTok */}
              <a href="https://tiktok.com/@ribera.app" target="_blank" rel="noopener noreferrer" aria-label="TikTok"
                className="w-9 h-9 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:border-brand-500/40 transition-all font-black text-[10px]">
                TT
              </a>
              {/* Facebook */}
              <a href="https://facebook.com/riberaapp" target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                className="w-9 h-9 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:border-brand-500/40 transition-all font-black text-[10px]">
                fb
              </a>
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title} className="space-y-5">
              <h3 className="text-gray-100 font-black text-sm uppercase tracking-widest">{col.title}</h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-gray-200 text-sm transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-500 text-xs">{content.copyright}</p>
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <motion.span
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Heart className="w-3.5 h-3.5 text-coral-500 fill-coral-500" />
            </motion.span>
            <span>{content.love}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── LANDING PAGE (root export) ───────────────────────────────────────────────

export function LandingPage({ language, onLanguageChange, onEnterApp }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header lang={language} setLang={onLanguageChange} onGetStarted={onEnterApp} />

      <main>
        <HeroSection lang={language} onEnterApp={onEnterApp} />
        <StatsBar lang={language} />
        <FeaturesSection lang={language} />
        <HowItWorksSection lang={language} />
        <PricingSection lang={language} />
        <DownloadSection lang={language} />
      </main>

      <Footer lang={language} />
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CalendarPlus, List, ScanLine, Wallet, Settings, LogOut, Zap } from 'lucide-react'
import { supabase } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const NAV = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/events', icon: List, label: 'My Events' },
  { href: '/events/create', icon: CalendarPlus, label: 'Create Event' },
  { href: '/scanner', icon: ScanLine, label: 'Scanner' },
  { href: '/payouts', icon: Wallet, label: 'Payouts' },
  { href: '/boost', icon: Zap, label: 'Boost' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const signOut = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <aside className="w-64 bg-surface-800 border-r border-surface-600 flex flex-col min-h-dvh fixed left-0 top-0 bottom-0 z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-surface-600 flex items-center gap-3">
        <img src="/logo.png" alt="Ribera" className="w-9 h-9 rounded-xl flex-shrink-0" />
        <div>
          <span className="text-xl font-black text-brand-500 tracking-tight">Ribera</span>
          <span className="text-xs text-gray-500 block -mt-0.5">Organiser Portal</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-brand-500/15 text-brand-500 border border-brand-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-surface-700'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-surface-600 space-y-1">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs text-gray-500">Theme</span>
          <ThemeToggle />
        </div>
        <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-surface-700 transition-all">
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}

export function MobileNav() {
  const pathname = usePathname()
  const MOBILE_NAV = NAV.slice(0, 5)

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-surface-900/95 backdrop-blur-md border-t border-surface-600 safe-bottom z-50 lg:hidden">
      <div className="flex">
        {MOBILE_NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} className="flex-1 flex flex-col items-center gap-1 py-3">
              <Icon className={`w-5 h-5 ${active ? 'text-brand-500' : 'text-gray-500'}`} strokeWidth={active ? 2.5 : 2} />
              <span className={`text-[9px] font-semibold ${active ? 'text-brand-500' : 'text-gray-500'}`}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

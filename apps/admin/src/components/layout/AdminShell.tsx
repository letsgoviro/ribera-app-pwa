'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Wallet, LogOut,
  ShieldCheck, Calendar, Zap,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { supabase } from '@/lib/api'

const NAV = [
  { href: '/', icon: LayoutDashboard, label: 'Overview' },
  { href: '/organisers', icon: ShieldCheck, label: 'Organisers' },
  { href: '/events', icon: Calendar, label: 'Events' },
  { href: '/boosts', icon: Zap, label: 'Boosts' },
  { href: '/payouts', icon: Wallet, label: 'Payouts' },
  { href: '/users', icon: Users, label: 'Users' },
]

function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const signOut = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <aside className="w-60 bg-surface-800 border-r border-surface-600 flex flex-col min-h-dvh fixed left-0 top-0 bottom-0 z-40">
      <div className="px-5 py-5 border-b border-surface-600 flex items-center gap-3">
        <img src="/logo.png" alt="Ribera" className="w-9 h-9 rounded-xl flex-shrink-0" />
        <div>
          <span className="text-lg font-black text-brand-500 tracking-tight">Ribera</span>
          <span className="text-xs text-red-400 font-bold block -mt-0.5 uppercase tracking-widest">Admin</span>
        </div>
      </div>

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

      <div className="px-3 py-4 border-t border-surface-600 space-y-1">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs text-gray-500">Theme</span>
          <ThemeToggle />
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface-900">
      <Sidebar />
      <main className="pl-60">
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  )
}

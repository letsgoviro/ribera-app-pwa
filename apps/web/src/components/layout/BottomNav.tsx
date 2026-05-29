'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Ticket, User } from 'lucide-react'
import { motion } from 'framer-motion'

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/discover', icon: Search, label: 'Discover' },
  { href: '/wallet', icon: Ticket, label: 'Tickets' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-surface-900/95 backdrop-blur-md border-t border-surface-600 safe-bottom z-50">
      <div className="flex">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-1 py-3 relative"
            >
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute top-0 inset-x-4 h-0.5 bg-brand-500 rounded-full"
                />
              )}
              <Icon
                className={`w-5 h-5 transition-colors ${active ? 'text-brand-500' : 'text-gray-500'}`}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className={`text-[10px] font-semibold transition-colors ${active ? 'text-brand-500' : 'text-gray-500'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

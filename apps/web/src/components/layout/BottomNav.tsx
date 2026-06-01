'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Ticket, User, Receipt } from 'lucide-react'
import { motion } from 'framer-motion'

const NAV_ITEMS = [
  { href: '/app',     icon: Home,    label: 'Home' },
  { href: '/discover', icon: Search,  label: 'Discover' },
  { href: '/wallet',  icon: Ticket,  label: 'Tickets' },
  { href: '/orders',  icon: Receipt, label: 'Orders' },
  { href: '/profile', icon: User,    label: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-surface-900/85 backdrop-blur-xl border-t border-white/5 safe-bottom z-50">
      <div className="flex">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href === '/app' && pathname === '/')
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 relative group"
            >
              {/* Active dot indicator above icon */}
              <AnimatedDot active={active} />

              {/* Icon */}
              <Icon
                className={`transition-all duration-200 ${
                  active
                    ? 'w-6 h-6 text-brand-500'
                    : 'w-5 h-5 text-gray-500 group-hover:text-gray-400'
                }`}
                strokeWidth={active ? 2.5 : 1.75}
              />

              {/* Label */}
              <span
                className={`text-[10px] font-bold leading-none transition-all duration-200 ${
                  active ? 'text-brand-500' : 'text-gray-500 group-hover:text-gray-400'
                }`}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function AnimatedDot({ active }: { active: boolean }) {
  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center" style={{ height: '3px', width: '24px' }}>
      {active && (
        <motion.div
          layoutId="nav-active-dot"
          className="h-1 w-6 bg-brand-500 rounded-full shadow-sm shadow-brand-500/60"
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        />
      )}
    </div>
  )
}

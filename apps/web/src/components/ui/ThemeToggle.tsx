'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { getTheme, setTheme, type Theme } from '@/lib/theme'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setCurrentTheme] = useState<Theme>('dark')

  useEffect(() => {
    setCurrentTheme(getTheme())
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setCurrentTheme(next)
  }

  return (
    <button
      onClick={toggle}
      className={`w-10 h-10 rounded-full bg-surface-800 border border-surface-600 flex items-center justify-center transition-all hover:border-brand-500/50 active:scale-95 ${className}`}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <Sun className="w-4.5 h-4.5 text-yellow-400" />
      ) : (
        <Moon className="w-4.5 h-4.5 text-brand-500" />
      )}
    </button>
  )
}

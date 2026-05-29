import Link from 'next/link'
import { LayoutDashboard } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-surface-900 flex flex-col items-center justify-center px-8 text-center">
      <p className="text-[96px] font-black text-brand-500 leading-none tracking-tighter mb-2">404</p>
      <div className="h-1 w-16 bg-brand-500 rounded-full mx-auto mb-8" />
      <h1 className="text-2xl font-black text-white mb-2">Page not found</h1>
      <p className="text-gray-400 text-sm mb-8">This page doesn't exist in the Admin Panel.</p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-brand-500 text-white px-6 py-3.5 rounded-2xl font-bold text-sm"
      >
        <LayoutDashboard className="w-4 h-4" />
        Back to Overview
      </Link>
    </div>
  )
}

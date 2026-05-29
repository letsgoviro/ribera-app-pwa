import { Sidebar, MobileNav } from './Sidebar'

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface-900">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main content — offset by sidebar on desktop */}
      <main className="lg:pl-64 pb-20 lg:pb-0">
        <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  )
}

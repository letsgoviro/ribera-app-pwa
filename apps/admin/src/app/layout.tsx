import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/layout/Providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: { default: 'Ribera Admin', template: '%s — Ribera Admin' },
  description: 'Ribera internal admin panel',
  robots: 'noindex, nofollow',
}

export const viewport: Viewport = {
  themeColor: [{ media: '(prefers-color-scheme: dark)', color: '#0A0A0F' }, { media: '(prefers-color-scheme: light)', color: '#F5F5FA' }],
  colorScheme: 'dark light',
  width: 'device-width',
  initialScale: 1,
}

const themeScript = `(function(){var t=localStorage.getItem('ribera-theme');if(!t)t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';document.documentElement.classList.add(t);})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className={`${inter.variable} font-sans bg-surface-900 text-white antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

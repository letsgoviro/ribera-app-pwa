import type { NextConfig } from 'next'
import withPWAInit from '@ducanh2912/next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
})

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  // TypeScript errors are reported by the separate typecheck job — don't block builds
  typescript: { ignoreBuildErrors: true },
  // ESLint errors reported separately — don't block builds
  eslint: { ignoreDuringBuilds: true },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
  webpack: (config, { dev }) => {
    if (dev) config.cache = false
    return config
  },
}

export default withPWA(nextConfig)

import { PrismaClient } from '@prisma/client'

// Base Prisma client — connection_limit=1 + pool_timeout set in DATABASE_URL
const prismaBase = new PrismaClient({
  log: process.env['NODE_ENV'] === 'development' ? ['error', 'warn'] : ['error'],
})

/**
 * Extended client: auto-reconnects on P1001/P1002 (DB unreachable).
 * Supabase free tier pauses the compute after ~5 min idle. The first
 * query after resume fails; this retries once after a 3-second delay.
 */
export const db = prismaBase.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        try {
          return await query(args)
        } catch (err: unknown) {
          const e = err as { code?: string }
          if (e?.code === 'P1001' || e?.code === 'P1002') {
            // Wait for Supabase compute to resume, then retry once
            await new Promise((r) => setTimeout(r, 3000))
            return await query(args)
          }
          throw err
        }
      },
    },
  },
})

// Also extend raw queries
export const dbRaw = prismaBase

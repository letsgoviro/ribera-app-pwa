import type { FastifyInstance } from 'fastify'
import { db } from '../lib/db'
import { requireAuth } from '../middleware/auth'

export async function authRoutes(app: FastifyInstance) {
  // POST /api/v1/auth/sync-profile — called after Supabase sign up to create profile in our DB
  app.post('/sync-profile', { preHandler: requireAuth }, async (req, reply) => {
    const { display_name, phone, city, avatar_url } = (req.body as {
      display_name?: string | null
      phone?: string | null
      city?: string | null
      avatar_url?: string | null
    } | null) ?? {}
    const { id } = req.user!

    const existing = await db.profile.findUnique({ where: { id } })

    if (existing) {
      const updated = await db.profile.update({
        where: { id },
        data: {
          // Only overwrite with a new value; never blank out an existing one
          display_name: display_name ?? existing.display_name,
          phone: phone ?? existing.phone,
          city: city ?? existing.city,
          avatar_url: avatar_url ?? existing.avatar_url,
        },
      })
      return reply.send({ data: updated })
    }

    const profile = await db.profile.create({
      data: { id, display_name, phone, city, avatar_url, role: 'customer' },
    })
    return reply.code(201).send({ data: profile })
  })

  // GET /api/v1/auth/me
  app.get('/me', { preHandler: requireAuth }, async (req, reply) => {
    const profile = await db.profile.findUnique({
      where: { id: req.user!.id },
      include: { organiser: { select: { id: true, org_name: true, verified: true, logo_url: true } } },
    })
    if (!profile) return reply.code(404).send({ error: 'Profile not found' })
    return reply.send({ data: { ...profile, ...req.user } })
  })
}

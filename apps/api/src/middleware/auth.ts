import type { FastifyRequest, FastifyReply } from 'fastify'
import { supabase } from '../lib/supabase'
import { db } from '../lib/db'
import type { UserRole } from '@ribera/types'

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string
      role: UserRole
      email?: string
      phone?: string
      organiser_id?: string
    }
  }
}

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Missing authorization header' })
  }

  const token = authHeader.slice(7)
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    return reply.code(401).send({ error: 'Invalid or expired token' })
  }

  // Prefer role from Supabase user_metadata (updated on approval); fall back to Prisma profile
  let role: UserRole = (data.user.user_metadata?.['role'] as UserRole) ?? 'customer'
  if (!data.user.user_metadata?.['role']) {
    const profile = await db.profile.findUnique({ where: { id: data.user.id }, select: { role: true } })
    if (profile) role = profile.role as UserRole
  }

  req.user = {
    id: data.user.id,
    role,
    email: data.user.email,
    phone: data.user.phone,
    organiser_id: data.user.user_metadata?.['organiser_id'],
  }
}

export function requireRole(...roles: UserRole[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    await authenticate(req, reply)
    if (reply.sent) return

    if (!req.user || !roles.includes(req.user.role)) {
      return reply.code(403).send({ error: 'Insufficient permissions' })
    }
  }
}

export const requireAuth = authenticate
export const requireOrganiser = requireRole('organiser', 'admin')
export const requireAdmin = requireRole('admin')

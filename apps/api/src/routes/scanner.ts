import type { FastifyInstance } from 'fastify'
import { db } from '../lib/db'
import { requireOrganiser } from '../middleware/auth'

export async function scannerRoutes(app: FastifyInstance) {
  // GET /api/v1/scanner/event/:id/attendees — download full attendee list for offline
  app.get('/event/:id/attendees', { preHandler: requireOrganiser }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const organiser = await db.organiser.findUnique({ where: { user_id: req.user!.id } })
    if (!organiser) return reply.code(403).send({ error: 'Not an organiser' })

    const event = await db.event.findFirst({ where: { id, organiser_id: organiser.id } })
    if (!event) return reply.code(404).send({ error: 'Event not found' })

    const tickets = await db.ticket.findMany({
      where: { event_id: id, status: { in: ['valid', 'used'] } },
      select: {
        id: true,
        qr_token: true,
        status: true,
        checked_in_at: true,
        holder: { select: { id: true, display_name: true, phone: true } },
        tier: { select: { id: true, name: true } },
        order: { select: { attendee_name: true, attendee_email: true } },
      },
    })

    return reply.send({ data: tickets, synced_at: new Date().toISOString() })
  })

  // POST /api/v1/scanner/check-in — scan a QR token
  app.post('/check-in', { preHandler: requireOrganiser }, async (req, reply) => {
    const { qr_token, event_id } = req.body as { qr_token: string; event_id: string }

    const organiser = await db.organiser.findUnique({ where: { user_id: req.user!.id } })
    if (!organiser) return reply.code(403).send({ error: 'Not an organiser' })

    // Verify organiser owns this event
    const event = await db.event.findFirst({ where: { id: event_id, organiser_id: organiser.id } })
    if (!event) return reply.code(403).send({ error: 'Not your event' })

    const ticket = await db.ticket.findUnique({
      where: { qr_token },
      include: {
        holder: { select: { display_name: true } },
        tier: { select: { name: true } },
      },
    })

    if (!ticket) return reply.send({ data: { result: 'invalid' } })
    if (ticket.event_id !== event_id) return reply.send({ data: { result: 'wrong_event' } })
    if (ticket.status === 'cancelled') return reply.send({ data: { result: 'cancelled' } })
    if (ticket.status === 'used') {
      return reply.send({
        data: { result: 'already_used', checked_in_at: ticket.checked_in_at, holder_name: ticket.holder.display_name, tier_name: ticket.tier.name },
      })
    }

    // Mark as used — use the organiser.id we already fetched (user_metadata.organiser_id may be absent)
    const updated = await db.ticket.update({
      where: { id: ticket.id },
      data: { status: 'used', checked_in_at: new Date(), checked_in_by: organiser.id },
    })

    return reply.send({
      data: {
        result: 'valid',
        ticket_id: ticket.id,
        holder_name: ticket.holder.display_name ?? 'Guest',
        tier_name: ticket.tier.name,
        checked_in_at: updated.checked_in_at,
      },
    })
  })

  // GET /api/v1/scanner/event/:id/stats — live check-in stats
  app.get('/event/:id/stats', { preHandler: requireOrganiser }, async (req, reply) => {
    const { id } = req.params as { id: string }

    const [total, checkedIn] = await Promise.all([
      db.ticket.count({ where: { event_id: id, status: { in: ['valid', 'used'] } } }),
      db.ticket.count({ where: { event_id: id, status: 'used' } }),
    ])

    return reply.send({ data: { total, checked_in: checkedIn, remaining: total - checkedIn } })
  })
}

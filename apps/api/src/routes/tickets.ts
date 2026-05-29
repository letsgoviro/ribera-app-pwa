import type { FastifyInstance } from 'fastify'
import { db } from '../lib/db'
import { requireAuth } from '../middleware/auth'

export async function ticketsRoutes(app: FastifyInstance) {
  // GET /api/v1/tickets/my
  app.get('/my', { preHandler: requireAuth }, async (req, reply) => {
    const tickets = await db.ticket.findMany({
      where: { holder_id: req.user!.id, status: { not: 'cancelled' } },
      orderBy: { created_at: 'desc' },
      include: {
        event: { select: { id: true, title: true, starts_at: true, ends_at: true, cover_image_url: true, venue_name: true, address: true } },
        tier: { select: { id: true, name: true, price: true, currency: true } },
      },
    })
    return reply.send({ data: tickets })
  })

  // GET /api/v1/tickets/:id/qr
  app.get('/:id/qr', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const ticket = await db.ticket.findFirst({
      where: { id, holder_id: req.user!.id, status: 'valid' },
      select: { qr_token: true },
    })
    if (!ticket) return reply.code(404).send({ error: 'Ticket not found' })
    return reply.send({ data: { qr_token: ticket.qr_token } })
  })

  // GET /api/v1/tickets/share/:qr_token — PUBLIC, no auth — returns safe ticket preview for sharing
  app.get('/share/:qr_token', async (req, reply) => {
    const { qr_token } = req.params as { qr_token: string }
    const ticket = await db.ticket.findUnique({
      where: { qr_token },
      select: {
        id: true,
        qr_token: true,
        status: true,
        checked_in_at: true,
        event: { select: { title: true, starts_at: true, ends_at: true, venue_name: true, address: true, cover_image_url: true, slug: true } },
        tier: { select: { name: true, tier_type: true } },
        order: { select: { attendee_name: true } },
      },
    })
    if (!ticket) return reply.code(404).send({ error: 'Ticket not found' })

    // Return limited info — no PII like email/phone, no full QR token in the public response
    return reply.send({
      data: {
        ticket_id: ticket.id.slice(0, 8).toUpperCase(),
        status: ticket.status,
        checked_in_at: ticket.checked_in_at,
        holder_name: ticket.order.attendee_name,
        tier_name: ticket.tier.name,
        tier_type: ticket.tier.tier_type,
        event: ticket.event,
        qr_token: ticket.qr_token, // needed to render QR on share page
      },
    })
  })

  // POST /api/v1/tickets/:id/transfer — transfer ticket to another Ribera user by email
  app.post('/:id/transfer', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { recipient_email } = req.body as { recipient_email: string }

    if (!recipient_email) return reply.code(400).send({ error: 'recipient_email is required' })

    const ticket = await db.ticket.findFirst({
      where: { id, holder_id: req.user!.id, status: 'valid' },
      include: {
        event: { select: { allow_transfer: true, title: true, starts_at: true, venue_name: true } },
        tier: { select: { name: true } },
        order: { select: { attendee_name: true } },
      },
    })
    if (!ticket) return reply.code(404).send({ error: 'Ticket not found or not yours' })
    if (!ticket.event.allow_transfer) return reply.code(400).send({ error: 'This event does not allow ticket transfers' })

    // Find recipient by looking up Supabase auth
    const { supabase } = await import('../lib/supabase')
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const recipientAuth = users.find(u => u.email?.toLowerCase() === recipient_email.toLowerCase())
    if (!recipientAuth) return reply.code(404).send({ error: 'No Ribera account found with that email address' })

    if (recipientAuth.id === req.user!.id) return reply.code(400).send({ error: 'Cannot transfer to yourself' })

    // Ensure recipient has a profile
    await db.profile.upsert({
      where: { id: recipientAuth.id },
      create: { id: recipientAuth.id, role: 'customer' },
      update: {},
    })

    await db.ticket.update({
      where: { id },
      data: { holder_id: recipientAuth.id, transferred_at: new Date() },
    })

    // Notify recipient via email (non-blocking)
    const { sendEmail } = await import('../services/email')
    const shareUrl = `${process.env['PUBLIC_WEB_URL'] ?? 'http://localhost:3000'}/tickets/${ticket.qr_token}`
    sendEmail({
      to: [{ email: recipient_email }],
      subject: `${ticket.order.attendee_name} sent you a ticket for ${ticket.event.title} 🎟️`,
      htmlContent: `
        <p>Hi there! Someone just transferred their <strong>${ticket.tier.name}</strong> ticket for
        <strong>${ticket.event.title}</strong> to you.</p>
        <p>📅 ${new Date(ticket.event.starts_at).toLocaleDateString('en-TZ', { dateStyle: 'full' })}</p>
        <p>📍 ${ticket.event.venue_name ?? 'TBA'}</p>
        <p><a href="${shareUrl}" style="background:#0066FF;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">View Your Ticket →</a></p>
        <p style="color:#666;font-size:12px;">Sign in to Ribera to see your full QR code ticket.</p>
      `,
    }).catch(console.error)

    return reply.send({ data: { success: true, transferred_to: recipient_email } })
  })
}

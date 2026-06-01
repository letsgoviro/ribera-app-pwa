import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../lib/db'
import { requireOrganiser, requireAuth } from '../middleware/auth'
import { sendOrganiserWelcome } from '../services/email'

const applySchema = z.object({
  org_name: z.string().min(2),
  full_name: z.string().min(2).optional(),
  bio: z.string().optional(),
  website: z.union([z.string().url(), z.literal(''), z.null()]).optional().transform(v => v === '' ? undefined : v ?? undefined),
  id_doc_url: z.string().url().optional(),
  phone: z.string().optional(),
  payout_details: z.object({
    method: z.enum(['bank', 'mobile_money']).optional(),
    bank_name: z.string().optional(),
    account_number: z.string().optional(),
    account_name: z.string().optional(),
    mobile_money_number: z.string().optional(),
    mobile_money_provider: z.string().optional(),
  }).optional(),
})

export async function organiserRoutes(app: FastifyInstance) {
  // POST /api/v1/organiser/apply — AUTO-APPROVES immediately (no admin wait)
  app.post('/apply', { preHandler: requireAuth }, async (req, reply) => {
    const body = applySchema.parse(req.body)
    const existing = await db.organiser.findUnique({ where: { user_id: req.user!.id } })
    if (existing) {
      // Already applied — if already verified return their record
      if (existing.verified) return reply.send({ data: existing })
      return reply.code(409).send({ error: 'Application already submitted' })
    }

    // ── Ensure profile exists (FK requirement) + set role to 'organiser' ────
    // Some users (e.g., just signed up) may not have a profile row yet
    await db.profile.upsert({
      where: { id: req.user!.id },
      create: {
        id: req.user!.id,
        display_name: body.full_name ?? null,
        phone: body.phone ?? null,
        role: 'organiser',
      },
      update: {
        role: 'organiser',
        ...(body.full_name ? { display_name: body.full_name } : {}),
        ...(body.phone ? { phone: body.phone } : {}),
      },
    })

    // ── Auto-approve: create organiser as verified immediately ──────────────
    const organiser = await db.organiser.create({
      data: {
        user_id: req.user!.id,
        org_name: body.org_name,
        full_name: body.full_name,
        bio: body.bio,
        website: body.website,
        id_doc_url: body.id_doc_url,
        phone: body.phone,
        payout_details: body.payout_details ?? {},
        verified: true,           // auto-approved — no admin wait
        verified_at: new Date(),
      },
    })

    const { supabase } = await import('../lib/supabase')
    await supabase.auth.admin.updateUserById(req.user!.id, {
      user_metadata: { role: 'organiser' },
    }).catch(e => req.log.warn('Failed to update Supabase role:', e.message))

    // ── Send welcome email (non-blocking) ───────────────────────────────────
    const { data: authUser } = await supabase.auth.admin.getUserById(req.user!.id)
    const email = authUser.user?.email
    if (email) {
      sendOrganiserWelcome({
        email,
        name: body.full_name ?? body.org_name,
        orgName: body.org_name,
      }).catch(e => req.log.warn('Welcome email failed:', e.message))
    }

    return reply.code(201).send({ data: { ...organiser, auto_approved: true } })
  })

  // GET /api/v1/organiser/me
  app.get('/me', { preHandler: requireOrganiser }, async (req, reply) => {
    const organiser = await db.organiser.findUnique({ where: { user_id: req.user!.id } })
    if (!organiser) return reply.code(404).send({ error: 'Not found' })
    return reply.send({ data: organiser })
  })

  // PATCH /api/v1/organiser/me
  app.patch('/me', { preHandler: requireOrganiser }, async (req, reply) => {
    const body = z.object({
      org_name: z.string().min(2).optional(),
      bio: z.string().optional(),
      website: z.string().url().optional().or(z.literal('')),
      banner_url: z.string().url().nullable().optional(),
      social_links: z.record(z.string()).optional(),
    }).parse(req.body)
    const organiser = await db.organiser.findUnique({ where: { user_id: req.user!.id } })
    if (!organiser) return reply.code(404).send({ error: 'Not found' })
    const updated = await db.organiser.update({
      where: { id: organiser.id },
      data: {
        ...(body.org_name && { org_name: body.org_name }),
        bio: body.bio ?? organiser.bio,
        website: body.website || organiser.website,
        ...(body.banner_url !== undefined && { banner_url: body.banner_url }),
        ...(body.social_links !== undefined && { social_links: body.social_links }),
      },
    })
    return reply.send({ data: updated })
  })

  // GET /api/v1/organiser/dashboard
  app.get('/dashboard', { preHandler: requireOrganiser }, async (req, reply) => {
    const organiser = await db.organiser.findUnique({ where: { user_id: req.user!.id } })
    if (!organiser) return reply.code(404).send({ error: 'Not found' })

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    const [
      totalEvents, liveEvents, ticketsSoldMonth, revenueMonth, revenueLastMonth,
      totalTickets, totalRevenue, activeBoosts, upcomingEvents,
    ] = await Promise.all([
      db.event.count({ where: { organiser_id: organiser.id } }),
      db.event.count({ where: { organiser_id: organiser.id, status: 'published', starts_at: { gte: now } } }),
      db.ticket.count({ where: { event: { organiser_id: organiser.id }, created_at: { gte: startOfMonth } } }),
      db.order.aggregate({ where: { event: { organiser_id: organiser.id }, status: 'paid', paid_at: { gte: startOfMonth } }, _sum: { subtotal: true } }),
      db.order.aggregate({ where: { event: { organiser_id: organiser.id }, status: 'paid', paid_at: { gte: startOfLastMonth, lte: endOfLastMonth } }, _sum: { subtotal: true } }),
      db.ticket.count({ where: { event: { organiser_id: organiser.id }, status: { not: 'cancelled' } } }),
      db.order.aggregate({ where: { event: { organiser_id: organiser.id }, status: 'paid' }, _sum: { subtotal: true } }),
      db.boost.count({ where: { organiser_id: organiser.id, status: 'active', ends_at: { gte: now } } }),
      db.event.findMany({
        where: { organiser_id: organiser.id, status: 'published', starts_at: { gte: now } },
        orderBy: { starts_at: 'asc' },
        take: 5,
        include: { tiers: { select: { quantity: true, sold: true } } },
      }),
    ])

    const revMTD = Number(revenueMonth._sum.subtotal ?? 0)
    const revLastMTD = Number(revenueLastMonth._sum.subtotal ?? 0)
    const revTrend = revLastMTD > 0 ? Math.round(((revMTD - revLastMTD) / revLastMTD) * 100) : null

    return reply.send({
      data: {
        total_events: totalEvents,
        live_events: liveEvents,
        tickets_sold_month: ticketsSoldMonth,
        revenue_month: revMTD,
        revenue_last_month: revLastMTD,
        revenue_trend_pct: revTrend,
        total_tickets_ever: totalTickets,
        total_revenue_ever: Number(totalRevenue._sum.subtotal ?? 0),
        currency: 'TZS',
        balance: Number(organiser.balance),
        active_boosts: activeBoosts,
        upcoming_events: upcomingEvents,
      },
    })
  })

  // GET /api/v1/organiser/events
  app.get('/events', { preHandler: requireOrganiser }, async (req, reply) => {
    const { status } = req.query as { status?: string }
    const organiser = await db.organiser.findUnique({ where: { user_id: req.user!.id } })
    if (!organiser) return reply.code(404).send({ error: 'Not found' })

    const events = await db.event.findMany({
      where: { organiser_id: organiser.id, ...(status ? { status: status as 'published' | 'draft' | 'cancelled' | 'completed' } : {}) },
      orderBy: { created_at: 'desc' },
      include: { tiers: { select: { id: true, name: true, price: true, quantity: true, sold: true } } },
    })
    return reply.send({ data: events })
  })

  // GET /api/v1/organiser/events/:id — own event, any status
  app.get('/events/:id', { preHandler: requireOrganiser }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const organiser = await db.organiser.findUnique({ where: { user_id: req.user!.id } })
    if (!organiser) return reply.code(403).send({ error: 'Not an organiser' })

    const event = await db.event.findFirst({
      where: { id, organiser_id: organiser.id },
      include: {
        tiers: { orderBy: { sort_order: 'asc' } },
      },
    })
    if (!event) return reply.code(404).send({ error: 'Event not found' })
    return reply.send({ data: event })
  })

  // GET /api/v1/organiser/events/:id/attendees
  // Privacy: full details unlocked only when organiser has an active boost on this event
  app.get('/events/:id/attendees', { preHandler: requireOrganiser }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const organiser = await db.organiser.findUnique({ where: { user_id: req.user!.id } })
    if (!organiser) return reply.code(403).send({ error: 'Not an organiser' })

    const event = await db.event.findFirst({ where: { id, organiser_id: organiser.id } })
    if (!event) return reply.code(404).send({ error: 'Not found' })

    // Check if organiser has an active boost on this event
    const activeBoost = await db.boost.findFirst({
      where: { event_id: id, organiser_id: organiser.id, status: 'active', ends_at: { gte: new Date() } },
    })
    const hasBoost = !!activeBoost

    const tickets = await db.ticket.findMany({
      where: { event_id: id },
      include: {
        order: { select: { attendee_name: true, attendee_email: true, attendee_phone: true } },
        tier: { select: { name: true } },
        holder: { select: { display_name: true } },
      },
    })

    // Mask PII unless boosted
    const maskedTickets = tickets.map((t) => ({
      ...t,
      order: {
        attendee_name: hasBoost
          ? t.order.attendee_name
          : t.order.attendee_name.split(' ')[0] + (t.order.attendee_name.split(' ').length > 1 ? ' •••' : ''),
        attendee_email: hasBoost ? t.order.attendee_email : '••••@••••',
        attendee_phone: hasBoost ? t.order.attendee_phone : '••••••••••',
      },
    }))

    return reply.send({ data: maskedTickets, has_boost: hasBoost })
  })

  // GET /api/v1/organiser/payouts
  app.get('/payouts', { preHandler: requireOrganiser }, async (req, reply) => {
    const organiser = await db.organiser.findUnique({ where: { user_id: req.user!.id } })
    if (!organiser) return reply.code(404).send({ error: 'Not found' })

    const payouts = await db.payout.findMany({ where: { organiser_id: organiser.id }, orderBy: { requested_at: 'desc' } })
    return reply.send({ data: payouts, balance: Number(organiser.balance) })
  })

  // POST /api/v1/organiser/withdraw
  app.post('/withdraw', { preHandler: requireOrganiser }, async (req, reply) => {
    const { amount, method, account_details } = req.body as { amount: number; method: string; account_details: Record<string, string> }
    const organiser = await db.organiser.findUnique({ where: { user_id: req.user!.id } })
    if (!organiser) return reply.code(404).send({ error: 'Not found' })
    if (Number(organiser.balance) < amount) return reply.code(400).send({ error: 'Insufficient balance' })
    if (amount < 10000) return reply.code(400).send({ error: 'Minimum withdrawal is TZS 10,000' })

    const payout = await db.payout.create({
      data: { organiser_id: organiser.id, amount: BigInt(amount), currency: 'TZS', method, account_details, status: 'pending' },
    })
    return reply.code(201).send({ data: payout })
  })

  // GET /api/v1/organiser/analytics/revenue — last 30 days daily revenue
  app.get('/analytics/revenue', { preHandler: requireOrganiser }, async (req, reply) => {
    const organiser = await db.organiser.findUnique({ where: { user_id: req.user!.id } })
    if (!organiser) return reply.code(403).send({ error: 'Not an organiser' })

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const orders = await db.order.findMany({
      where: {
        event: { organiser_id: organiser.id },
        status: 'paid',
        paid_at: { gte: since },
      },
      select: { paid_at: true, total: true, service_fee: true },
    })

    // Group by day
    const daily: Record<string, number> = {}
    for (const order of orders) {
      const day = order.paid_at!.toISOString().slice(0, 10)
      daily[day] = (daily[day] ?? 0) + Number(order.total) - Number(order.service_fee)
    }

    // Fill in last 30 days including zero days
    const result = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().slice(0, 10)
      const label = d.toLocaleDateString('en-TZ', { month: 'short', day: 'numeric' })
      result.push({ date: label, revenue: daily[key] ?? 0 })
    }

    return reply.send({ data: result })
  })
}

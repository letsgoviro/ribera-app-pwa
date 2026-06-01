import type { FastifyInstance } from 'fastify'
import { db } from '../lib/db'
import { requireAdmin } from '../middleware/auth'
import { sendOrganiserWelcome, sendOrganiserRejected, sendPayoutConfirmation } from '../services/email'

export async function adminRoutes(app: FastifyInstance) {
  app.get('/overview', { preHandler: requireAdmin }, async (_req, reply) => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [totalEvents, totalTickets, gmv, revenue, mau, newOrganisers, pendingVerifications] = await Promise.all([
      db.event.count(),
      db.ticket.count({ where: { status: { in: ['valid', 'used'] } } }),
      db.order.aggregate({ where: { status: 'paid' }, _sum: { total: true } }),
      db.order.aggregate({ where: { status: 'paid' }, _sum: { service_fee: true } }),
      db.profile.count({ where: { created_at: { gte: new Date(now.getFullYear(), now.getMonth() - 1, 1) } } }),
      db.organiser.count({ where: { created_at: { gte: startOfMonth } } }),
      db.organiser.count({ where: { verified: false } }),
    ])

    return reply.send({
      data: {
        total_events: totalEvents,
        total_tickets_sold: totalTickets,
        total_gmv: Number(gmv._sum.total ?? 0),
        ribera_revenue: Number(revenue._sum.service_fee ?? 0),
        mau,
        new_organisers_month: newOrganisers,
        pending_verifications: pendingVerifications,
      },
    })
  })

  app.get('/organisers', { preHandler: requireAdmin }, async (req, reply) => {
    const { verified } = req.query as { verified?: string }
    const where = verified !== undefined ? { verified: verified === 'true' } : {}
    const organisers = await db.organiser.findMany({ where, orderBy: { created_at: 'desc' }, include: { profile: { select: { display_name: true, phone: true } } } })
    return reply.send({ data: organisers })
  })

  app.put('/organisers/:id/verify', { preHandler: requireAdmin }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { approved, reason } = req.body as { approved: boolean; reason?: string }

    const organiser = await db.organiser.findUnique({ where: { id }, include: { profile: { select: { display_name: true } } } })
    if (!organiser) return reply.code(404).send({ error: 'Not found' })

    if (approved) {
      await db.$transaction([
        db.organiser.update({ where: { id }, data: { verified: true, verified_at: new Date() } }),
        db.profile.update({ where: { id: organiser.user_id }, data: { role: 'organiser' } }),
      ])

      // Update Supabase user_metadata so JWT role reflects 'organiser' on next API call
      const { supabase } = await import('../lib/supabase')
      await supabase.auth.admin.updateUserById(organiser.user_id, {
        user_metadata: { role: 'organiser' },
      }).catch(console.error)

      const userEmail = await getUserEmail(organiser.user_id)
      if (userEmail) {
        await sendOrganiserWelcome({ email: userEmail, name: organiser.profile.display_name ?? organiser.org_name, orgName: organiser.org_name }).catch(console.error)
      }
    } else {
      const userEmail = await getUserEmail(organiser.user_id)
      if (userEmail) {
        await sendOrganiserRejected({ email: userEmail, name: organiser.profile.display_name ?? organiser.org_name, reason: reason ?? 'Unable to verify identity' }).catch(console.error)
      }
    }

    return reply.send({ data: { success: true, approved } })
  })

  // GET /api/v1/admin/users — list users from Supabase auth + enrich with Prisma profile
  app.get('/users', { preHandler: requireAdmin }, async (req, reply) => {
    const { search, page = '1', limit = '25' } = req.query as { search?: string; page?: string; limit?: string }
    const pageNum = Math.max(1, parseInt(page, 10))
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)))

    const { supabase } = await import('../lib/supabase')

    // Fetch all users from Supabase (paginated)
    const { data: authData, error } = await supabase.auth.admin.listUsers({
      page: pageNum,
      perPage: limitNum,
    })

    if (error) return reply.code(500).send({ error: error.message })

    const userIds = authData.users.map((u) => u.id)

    // Enrich with Prisma profiles
    const profiles = await db.profile.findMany({ where: { id: { in: userIds } } })
    const profileMap = new Map(profiles.map((p) => [p.id, p]))

    const users = authData.users
      .filter((u) => {
        if (!search) return true
        const s = search.toLowerCase()
        return (
          u.email?.toLowerCase().includes(s) ||
          u.phone?.includes(s) ||
          profileMap.get(u.id)?.display_name?.toLowerCase().includes(s)
        )
      })
      .map((u) => {
        const profile = profileMap.get(u.id)
        return {
          id: u.id,
          display_name: profile?.display_name ?? u.user_metadata?.['display_name'] ?? null,
          email: u.email ?? null,
          phone: u.phone ?? null,
          role: (profile?.role ?? u.user_metadata?.['role'] ?? 'customer') as string,
          city: profile?.city ?? null,
          created_at: u.created_at,
        }
      })

    return reply.send({ data: users, total: authData.total ?? users.length })
  })

  // POST /api/v1/admin/users — create a new user account
  app.post('/users', { preHandler: requireAdmin }, async (req, reply) => {
    const { email, password, display_name, role = 'customer', phone } = req.body as {
      email: string; password: string; display_name?: string; role?: string; phone?: string
    }

    if (!email || !password) return reply.code(400).send({ error: 'Email and password are required' })
    if (password.length < 6) return reply.code(400).send({ error: 'Password must be at least 6 characters' })

    const { supabase } = await import('../lib/supabase')

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // skip email verification for admin-created users
      user_metadata: { role, display_name },
    })

    if (authError) return reply.code(400).send({ error: authError.message })

    const userId = authData.user.id

    // Create Prisma profile
    await db.profile.upsert({
      where: { id: userId },
      create: { id: userId, display_name: display_name ?? null, phone: phone ?? null, role: role as 'customer' | 'organiser' | 'admin' },
      update: { display_name: display_name ?? undefined, phone: phone ?? undefined, role: role as 'customer' | 'organiser' | 'admin' },
    })

    return reply.code(201).send({ data: { id: userId, email, role } })
  })

  // PATCH /api/v1/admin/users/:id/role — change a user's role
  app.patch('/users/:id/role', { preHandler: requireAdmin }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { role } = req.body as { role: string }

    const validRoles = ['customer', 'organiser', 'admin']
    if (!validRoles.includes(role)) return reply.code(400).send({ error: 'Invalid role' })

    const { supabase } = await import('../lib/supabase')

    // Update Supabase user_metadata so the JWT reflects the new role
    const { error: authError } = await supabase.auth.admin.updateUserById(id, {
      user_metadata: { role },
    })
    if (authError) return reply.code(400).send({ error: authError.message })

    // Update Prisma profile
    await db.profile.upsert({
      where: { id },
      create: { id, role: role as 'customer' | 'organiser' | 'admin' },
      update: { role: role as 'customer' | 'organiser' | 'admin' },
    })

    return reply.send({ data: { success: true, id, role } })
  })

  // GET /api/v1/admin/organisers/:id — full organiser profile + events + revenue
  app.get('/organisers/:id', { preHandler: requireAdmin }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const organiser = await db.organiser.findUnique({
      where: { id },
      include: {
        profile: { select: { display_name: true, phone: true, city: true, created_at: true } },
        events: {
          orderBy: { created_at: 'desc' },
          include: {
            tiers: { select: { id: true, name: true, price: true, quantity: true, sold: true } },
            _count: { select: { tickets: true, orders: true } },
          },
        },
      },
    })
    if (!organiser) return reply.code(404).send({ error: 'Not found' })

    const revenue = await db.order.aggregate({
      where: { event: { organiser_id: id }, status: 'paid' },
      _sum: { total: true, service_fee: true },
      _count: { id: true },
    })

    const userEmail = await getUserEmail(organiser.user_id)

    return reply.send({
      data: {
        ...organiser,
        email: userEmail,
        total_revenue: Number(revenue._sum.total ?? 0),
        ribera_fees: Number(revenue._sum.service_fee ?? 0),
        total_orders: revenue._count.id,
      },
    })
  })

  // GET /api/v1/admin/events — list all events (any status) with pagination
  app.get('/events', { preHandler: requireAdmin }, async (req, reply) => {
    const { page = '1', limit = '25', search, status } = req.query as {
      page?: string; limit?: string; search?: string; status?: string
    }
    const pageNum = Math.max(1, parseInt(page, 10))
    const limitNum = Math.min(50, parseInt(limit, 10))
    const skip = (pageNum - 1) * limitNum

    const where: Record<string, unknown> = {}
    if (status) where['status'] = status
    if (search) {
      where['OR'] = [
        { title: { contains: search, mode: 'insensitive' } },
        { venue_name: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [events, total] = await Promise.all([
      db.event.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { created_at: 'desc' },
        include: {
          organiser: { select: { id: true, org_name: true, verified: true } },
          _count: { select: { tickets: true, orders: true } },
          tiers: { select: { quantity: true, sold: true } },
        },
      }),
      db.event.count({ where }),
    ])

    return reply.send({ data: events, total, page: pageNum, limit: limitNum })
  })

  // GET /api/v1/admin/events/:id — full event detail
  app.get('/events/:id', { preHandler: requireAdmin }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const event = await db.event.findUnique({
      where: { id },
      include: {
        organiser: { select: { id: true, org_name: true, verified: true, logo_url: true } },
        tiers: { orderBy: { sort_order: 'asc' } },
        promo_codes: true,
        _count: { select: { tickets: true, orders: true } },
      },
    })
    if (!event) return reply.code(404).send({ error: 'Not found' })

    const revenue = await db.order.aggregate({
      where: { event_id: id, status: 'paid' },
      _sum: { total: true, service_fee: true },
      _count: { id: true },
    })

    const checkedIn = await db.ticket.count({ where: { event_id: id, status: 'used' } })

    return reply.send({
      data: {
        ...event,
        total_revenue: Number(revenue._sum.total ?? 0),
        ribera_fees: Number(revenue._sum.service_fee ?? 0),
        total_orders: revenue._count.id,
        checked_in: checkedIn,
      },
    })
  })

  app.get('/payouts/pending', { preHandler: requireAdmin }, async (req, reply) => {
    const { status } = req.query as { status?: string }
    const where = status === 'all' ? {} : { status: 'pending' as const }
    const payouts = await db.payout.findMany({
      where,
      orderBy: { requested_at: 'desc' },
      include: { organiser: { select: { id: true, org_name: true } } },
      take: 100,
    })
    return reply.send({ data: payouts })
  })

  app.put('/payouts/:id', { preHandler: requireAdmin }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { status, reference, note } = req.body as { status: 'processing' | 'completed' | 'failed'; reference?: string; note?: string }

    // Validate UUID format before hitting DB (prevents Prisma P2023 error)
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!UUID_RE.test(id)) return reply.code(404).send({ error: 'Payout not found' })

    // Fetch payout info needed for balance deduction and email (before the atomic update)
    const existing = await db.payout.findUnique({
      where: { id },
      include: { organiser: { select: { id: true, org_name: true, user_id: true } } },
    })
    if (!existing) return reply.code(404).send({ error: 'Payout not found' })

    // Atomic update — only succeeds if status isn't already completed
    const updated = await db.payout.updateMany({
      where: { id, status: { not: 'completed' } },
      data: {
        status,
        ...(reference ? { reference } : {}),
        ...(note ? { admin_note: note } : {}),
        ...(status === 'completed' ? { processed_at: new Date() } : {}),
      },
    })

    if (updated.count === 0) {
      return reply.code(409).send({ error: 'Payout already processed' })
    }

    // Deduct balance only on completion (atomic check above ensures it runs exactly once)
    if (status === 'completed') {
      await db.organiser.update({
        where: { id: existing.organiser_id },
        data: { balance: { decrement: existing.amount } },
      })

      // Send email to organiser
      const userEmail = await getUserEmail(existing.organiser.user_id)
      if (userEmail) {
        await sendPayoutConfirmation({
          email: userEmail,
          name: existing.organiser.org_name,
          orgName: existing.organiser.org_name,
          amount: Number(existing.amount),
          currency: existing.currency,
          reference: reference ?? existing.id,
        }).catch(console.error)
      }
    }

    // Fetch updated record to return
    const payout = await db.payout.findUnique({ where: { id } })
    return reply.send({ data: payout })
  })

  // ── Boost campaign management ─────────────────────────────────────────────

  // GET /api/v1/admin/boosts — list all boosts with organiser + event info
  app.get('/boosts', { preHandler: requireAdmin }, async (req, reply) => {
    const { status, sms_status } = req.query as { status?: string; sms_status?: string }

    const where: Record<string, unknown> = {}
    if (status && status !== 'all') where['status'] = status
    if (sms_status && sms_status !== 'all') where['sms_status'] = sms_status

    const [boosts, revenue] = await Promise.all([
      db.boost.findMany({
        where,
        orderBy: { created_at: 'desc' },
        include: {
          event: { select: { id: true, title: true, starts_at: true } },
          organiser: { select: { id: true, org_name: true } },
        },
        take: 200,
      }),
      // Revenue aggregates
      db.boost.groupBy({
        by: ['package'],
        where: { status: 'active' },
        _sum: { price_paid: true },
        _count: { id: true },
      }),
    ])

    const revenueByPackage = revenue.map(r => ({
      package: r.package,
      count: r._count.id,
      total_tzs: Number(r._sum.price_paid ?? 0),
    }))

    const totalRevenue = revenueByPackage.reduce((s, r) => s + r.total_tzs, 0)
    const pendingSmsCount = boosts.filter(b => b.sms_status === 'pending_credits').length

    return reply.send({
      data: boosts,
      analytics: { total_revenue: totalRevenue, by_package: revenueByPackage, pending_sms: pendingSmsCount },
    })
  })

  // POST /api/v1/admin/boosts/:id/send-sms — admin triggers queued SMS blast
  app.post('/boosts/:id/send-sms', { preHandler: requireAdmin }, async (req, reply) => {
    const { id } = req.params as { id: string }

    const boost = await db.boost.findUnique({
      where: { id },
      include: { event: { select: { id: true, title: true } } },
    })
    if (!boost) return reply.code(404).send({ error: 'Boost not found' })
    if (boost.sms_status === 'sent') return reply.send({ data: { success: true, already_sent: true } })
    if (boost.sms_status !== 'pending_credits') return reply.code(400).send({ error: 'No SMS queued for this boost' })

    // Gather attendee phones
    const tickets = await db.ticket.findMany({
      where: { event_id: boost.event.id, status: { in: ['valid', 'used'] } },
      include: { order: { select: { attendee_phone: true, attendee_name: true } } },
    })
    const uniqueByPhone = [...new Map(
      tickets.filter(t => t.order.attendee_phone).map(t => [t.order.attendee_phone, t])
    ).values()]

    if (uniqueByPhone.length === 0) {
      await db.boost.update({ where: { id }, data: { sms_status: 'sent', sms_sent_at: new Date() } })
      return reply.send({ data: { success: true, sent_count: 0, note: 'No phones on file' } })
    }

    const { sendSmsBlast } = await import('../services/sms')

    try {
      await sendSmsBlast({
        eventTitle: boost.event.title,
        attendees: uniqueByPhone.map(t => ({ phone: t.order.attendee_phone, name: t.order.attendee_name })),
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'SMS send failed'
      console.error('SMS blast failed:', msg)
      return reply.code(402).send({ error: `SMS send failed — ${msg}. Top up Brevo SMS credits and try again.` })
    }

    await db.boost.update({ where: { id }, data: { sms_status: 'sent', sms_sent_at: new Date() } })

    return reply.send({ data: { success: true, sent_count: uniqueByPhone.length } })
  })
}

async function getUserEmail(userId: string): Promise<string | null> {
  const { supabase } = await import('../lib/supabase')
  const { data } = await supabase.auth.admin.getUserById(userId)
  return data.user?.email ?? null
}

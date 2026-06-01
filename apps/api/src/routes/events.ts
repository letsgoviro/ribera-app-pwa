import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../lib/db'
import { requireAuth, requireOrganiser } from '../middleware/auth'
import { sendEventCancellation } from '../services/email'

const createEventSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().optional(),
  category: z.enum(['music', 'sports', 'arts', 'food_drink', 'nightlife', 'comedy', 'business', 'other']),
  event_type: z.enum(['paid', 'free', 'donation', 'online', 'hybrid']).default('paid'),
  venue_name: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  online_url: z.union([z.string().url(), z.literal(''), z.null()]).optional().transform(v => v === '' ? null : v),
  cover_image_url: z.union([z.string().url(), z.literal(''), z.null()]).optional().transform(v => v === '' ? null : v),
  gallery_urls: z.array(z.string().url()).optional(),
  venue_code: z.string().max(50).optional().nullable(),
  timetable_url: z.union([z.string().url(), z.literal(''), z.null()]).optional().transform(v => v === '' ? null : v),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime().optional(),
  timezone: z.string().default('Africa/Dar_es_Salaam'),
  min_age: z.number().int().min(0).default(0),
  allow_transfer: z.boolean().default(true),
  refund_policy: z.enum(['none', '24h', '48h']).default('24h'),
  tiers: z
    .array(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.number().int().min(0),
        currency: z.string().length(3).default('TZS'),
        quantity: z.number().int().min(1),
        tier_type: z.enum(['general', 'vip', 'table', 'seat', 'standing', 'online']).default('general'),
        max_per_order: z.number().int().min(1).max(20).default(10),
        seats_per_unit: z.number().int().min(1).max(50).default(1),
        sale_starts: z.string().datetime().optional(),
        sale_ends: z.string().datetime().optional(),
      })
    )
    .min(1)
    .max(10),
})

function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') +
    '-' +
    Date.now().toString(36)
  )
}

export async function eventsRoutes(app: FastifyInstance) {
  // GET /api/v1/events — public, paginated, filtered
  app.get('/', async (req, reply) => {
    const query = req.query as {
      page?: string
      limit?: string
      category?: string
      status?: string
      search?: string
      city?: string
      from?: string
      to?: string
    }

    const page = parseInt(query.page ?? '1', 10)
    const limit = Math.min(parseInt(query.limit ?? '20', 10), 50)
    const skip = (page - 1) * limit

    // Default to upcoming events; search overrides the date filter
    const where: Record<string, unknown> = {
      status: 'published',
      starts_at: { gte: query.from ? new Date(query.from) : new Date() },
    }
    if (query.category) where['category'] = query.category
    if (query.search) {
      where['OR'] = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { venue_name: { contains: query.search, mode: 'insensitive' } },
      ]
      delete where['starts_at']
    }

    const [events, total] = await Promise.all([
      db.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { starts_at: 'asc' },
        include: {
          organiser: { select: { id: true, org_name: true, logo_url: true, verified: true } },
          tiers: { select: { id: true, name: true, price: true, currency: true, quantity: true, sold: true, tier_type: true, max_per_order: true, seats_per_unit: true } },
        },
      }),
      db.event.count({ where }),
    ])

    return reply.send({ data: events, total, page, limit, has_more: skip + limit < total })
  })

  // GET /api/v1/events/:id — public
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }

    // Detect UUID vs slug to avoid Prisma P2023 when passing a slug as a UUID field
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    const where = isUuid
      ? { OR: [{ id }, { slug: id }], status: 'published' as const }
      : { slug: id, status: 'published' as const }

    const event = await db.event.findFirst({
      where,
      include: {
        organiser: { select: { id: true, org_name: true, logo_url: true, banner_url: true, bio: true, verified: true, social_links: true } },
        tiers: { orderBy: { sort_order: 'asc' } },
      },
    })

    if (!event) return reply.code(404).send({ error: 'Event not found' })
    return reply.send({ data: event })
  })

  // POST /api/v1/events — organiser only
  app.post('/', { preHandler: requireOrganiser }, async (req, reply) => {
    const body = createEventSchema.parse(req.body)
    const organiser = await db.organiser.findUnique({ where: { user_id: req.user!.id } })
    if (!organiser?.verified) return reply.code(403).send({ error: 'Organiser not verified' })

    const slug = slugify(body.title)

    const event = await db.event.create({
      data: {
        organiser_id: organiser.id,
        title: body.title,
        slug,
        description: body.description,
        cover_image_url: body.cover_image_url ?? null,
        gallery_urls: body.gallery_urls ?? [],
        category: body.category,
        event_type: body.event_type,
        venue_name: body.venue_name,
        address: body.address,
        lat: body.lat,
        lng: body.lng,
        online_url: body.online_url,
        venue_code: body.venue_code ?? null,
        timetable_url: body.timetable_url ?? null,
        starts_at: new Date(body.starts_at),
        ends_at: body.ends_at ? new Date(body.ends_at) : null,
        timezone: body.timezone,
        min_age: body.min_age,
        allow_transfer: body.allow_transfer,
        refund_policy: body.refund_policy,
        tiers: {
          create: body.tiers.map((t, i) => ({
            name: t.name,
            description: t.description,
            price: BigInt(t.price),
            currency: t.currency,
            quantity: t.quantity,
            tier_type: t.tier_type ?? 'general',
            max_per_order: t.max_per_order ?? 10,
            seats_per_unit: t.seats_per_unit ?? 1,
            sale_starts: t.sale_starts ? new Date(t.sale_starts) : null,
            sale_ends: t.sale_ends ? new Date(t.sale_ends) : null,
            sort_order: i,
          })),
        },
      },
      include: { tiers: true },
    })

    return reply.code(201).send({ data: event })
  })

  // PUT /api/v1/events/:id — organiser only, owns event
  app.put('/:id', { preHandler: requireOrganiser }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const organiser = await db.organiser.findUnique({ where: { user_id: req.user!.id } })
    if (!organiser) return reply.code(403).send({ error: 'Not an organiser' })

    const existing = await db.event.findFirst({ where: { id, organiser_id: organiser.id } })
    if (!existing) return reply.code(404).send({ error: 'Event not found' })

    // tiers are managed separately — exclude from update
    const { tiers: _tiers, ...rest } = createEventSchema.partial().parse(req.body)
    const event = await db.event.update({
      where: { id },
      data: {
        ...rest,
        starts_at: rest.starts_at ? new Date(rest.starts_at) : undefined,
        ends_at: rest.ends_at ? new Date(rest.ends_at) : undefined,
      },
    })

    return reply.send({ data: event })
  })

  // GET /api/v1/events/:id/promo/validate?code=XXXXX — validate promo code and return discount
  app.get('/:id/promo/validate', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { code } = req.query as { code?: string }
    if (!code) return reply.code(400).send({ error: 'code required' })

    const promo = await db.promoCode.findUnique({
      where: { event_id_code: { event_id: id, code: code.toUpperCase() } },
    })

    if (!promo) return reply.code(404).send({ error: 'Invalid promo code' })
    if (promo.expires_at && promo.expires_at < new Date()) return reply.code(400).send({ error: 'Promo code has expired' })
    if (promo.max_uses && promo.used_count >= promo.max_uses) return reply.code(400).send({ error: 'Promo code has been fully redeemed' })

    return reply.send({ data: { discount_type: promo.discount_type, discount_value: Number(promo.discount_value), valid: true } })
  })

  // POST /api/v1/events/:id/waitlist
  app.post('/:id/waitlist', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { tier_id } = req.body as { tier_id: string }
    // For now, just acknowledge — in production this would save to a waitlist table
    // and notify when tickets become available via a background job
    console.log(`Waitlist: user ${req.user!.id} wants tier ${tier_id} for event ${id}`)
    return reply.send({ data: { joined: true, message: "We'll notify you if tickets become available." } })
  })

  // POST /api/v1/events/:id/publish
  app.post('/:id/publish', { preHandler: requireOrganiser }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const organiser = await db.organiser.findUnique({ where: { user_id: req.user!.id } })
    if (!organiser?.verified) return reply.code(403).send({ error: 'Organiser not verified' })

    const existing = await db.event.findFirst({ where: { id, organiser_id: organiser.id } })
    if (!existing) return reply.code(404).send({ error: 'Event not found' })

    const event = await db.event.update({
      where: { id },
      data: { status: 'published', published_at: new Date() },
    })

    return reply.send({ data: event })
  })

  // DELETE /api/v1/events/:id — cancel event
  app.delete('/:id', { preHandler: requireOrganiser }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const organiser = await db.organiser.findUnique({ where: { user_id: req.user!.id } })
    if (!organiser) return reply.code(403).send({ error: 'Not an organiser' })

    const existing = await db.event.findFirst({ where: { id, organiser_id: organiser.id } })
    if (!existing) return reply.code(404).send({ error: 'Event not found' })

    await db.event.update({
      where: { id },
      data: { status: 'cancelled', cancelled_at: new Date() },
    })

    // Notify all ticket holders non-blocking
    const affectedTickets = await db.ticket.findMany({
      where: { event_id: id, status: { in: ['valid', 'used'] } },
      include: { order: { select: { attendee_name: true, attendee_email: true, total: true, currency: true } } },
      distinct: ['order_id'],
    })
    const eventFull = await db.event.findUnique({ where: { id }, select: { title: true, starts_at: true } })

    if (eventFull && affectedTickets.length > 0) {
      Promise.allSettled(
        affectedTickets.map(t =>
          sendEventCancellation({
            email: t.order.attendee_email,
            name: t.order.attendee_name,
            eventTitle: eventFull.title,
            eventDate: eventFull.starts_at.toLocaleDateString('en-TZ', { dateStyle: 'long' }),
            refundAmount: Number(t.order.total).toLocaleString(),
            currency: t.order.currency,
          })
        )
      ).catch(console.error)
    }

    return reply.code(204).send()
  })
}

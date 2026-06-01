import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import crypto from 'crypto'
import { db } from '../lib/db'
import { requireAuth } from '../middleware/auth'
import { createPaymentToken } from '../services/dpo'
import { sendTicketConfirmation, sendOrganiserSaleNotification } from '../services/email'
import { sendTicketSmsConfirmation } from '../services/sms'
import { SERVICE_FEE_PERCENT } from '@ribera/config'

// Public base URL for DPO redirects — must be HTTPS/public (not localhost).
// DPO CloudFront WAF blocks requests with localhost in RedirectURL/BackURL.
const PUBLIC_WEB_URL = process.env['PUBLIC_WEB_URL'] ?? 'https://ribera.app'

const createOrderSchema = z.object({
  event_id: z.string().uuid(),
  items: z.array(z.object({ tier_id: z.string().uuid(), quantity: z.number().int().min(1).max(10) })).min(1),
  attendee_name: z.string().min(2),
  attendee_email: z.string().email(),
  attendee_phone: z.string().min(7),
  promo_code: z.string().optional(),
  custom_fields: z.record(z.string()).default({}),
  currency: z.string().length(3).default('TZS'),
  redirect_url: z.string().url().optional(),
  back_url: z.string().url().optional(),
  idempotency_key: z.string().uuid().optional(),
})

export async function ordersRoutes(app: FastifyInstance) {
  // POST /api/v1/orders — create order and get DPO payment link
  app.post('/', { preHandler: requireAuth, config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (req, reply) => {
    const body = createOrderSchema.parse(req.body)

    // Idempotency: if key provided, check for existing order
    if (body.idempotency_key) {
      const existing = await db.order.findFirst({
        where: {
          user_id: req.user!.id,
          custom_fields: { path: ['idempotency_key'], equals: body.idempotency_key }
        }
      })
      if (existing) {
        req.log.info({ orderId: existing.id }, 'Idempotent order return')
        if (existing.status === 'paid') {
          return reply.code(200).send({ data: { order_id: existing.id, free: true } })
        }
        // Re-fetch payment URL if still pending
        if (existing.dpo_token) {
          const paymentUrl = `${process.env['DPO_PAYMENT_URL'] ?? 'https://secure.3gdirectpay.com/payv2.php'}?ID=${existing.dpo_token}`
          return reply.code(200).send({ data: { order_id: existing.id, payment_url: paymentUrl, total: Number(existing.total), currency: existing.currency } })
        }
      }
    }

    // Validate tiers and calculate totals
    const tiers = await db.ticketTier.findMany({
      where: { id: { in: body.items.map((i) => i.tier_id) }, event_id: body.event_id },
    })

    if (tiers.length !== body.items.length) {
      return reply.code(400).send({ error: 'One or more ticket tiers not found' })
    }

    let subtotal = 0n
    const orderItems = []

    for (const item of body.items) {
      const tier = tiers.find((t) => t.id === item.tier_id)!
      const available = tier.quantity - tier.sold

      if (available < item.quantity) {
        return reply.code(409).send({ error: `Not enough tickets for ${tier.name}` })
      }

      subtotal += tier.price * BigInt(item.quantity)
      orderItems.push({ tier_id: tier.id, tier_name: tier.name, quantity: item.quantity, unit_price: Number(tier.price) })
    }

    // Apply promo code
    let discountAmount = 0n
    let promoCodeId: string | undefined

    if (body.promo_code) {
      const promo = await db.promoCode.findUnique({
        where: { event_id_code: { event_id: body.event_id, code: body.promo_code.toUpperCase() } },
      })

      if (promo && (!promo.max_uses || promo.used_count < promo.max_uses) && (!promo.expires_at || promo.expires_at > new Date())) {
        if (promo.discount_type === 'percent') {
          discountAmount = (subtotal * BigInt(Number(promo.discount_value))) / 100n
        } else {
          discountAmount = promo.discount_value
        }
        promoCodeId = promo.id
      }
    }

    const discountedSubtotal = subtotal - discountAmount
    const serviceFee = (discountedSubtotal * BigInt(SERVICE_FEE_PERCENT)) / 100n
    const total = discountedSubtotal + serviceFee

    // Create order with 10-minute reservation
    const reservedUntil = new Date(Date.now() + 10 * 60 * 1000)

    const order = await db.order.create({
      data: {
        user_id: req.user!.id,
        event_id: body.event_id,
        status: 'reserved',
        items: orderItems,
        subtotal,
        service_fee: serviceFee,
        total,
        currency: body.currency,
        promo_code_id: promoCodeId ?? null,
        discount_amount: discountAmount,
        attendee_name: body.attendee_name,
        attendee_email: body.attendee_email,
        attendee_phone: body.attendee_phone,
        custom_fields: body.idempotency_key
          ? { ...body.custom_fields, idempotency_key: body.idempotency_key }
          : body.custom_fields,
        reserved_until: reservedUntil,
      },
    })

    // Reserve tickets (increment sold count)
    for (const item of body.items) {
      await db.ticketTier.update({
        where: { id: item.tier_id },
        data: { sold: { increment: item.quantity } },
      })
    }

    // Create DPO payment token (skip if free)
    if (total === 0n) {
      await completeOrder(order.id, req.user!.id)
      return reply.code(201).send({ data: { order_id: order.id, free: true } })
    }

    let transactionToken: string
    let paymentUrl: string

    try {
      // Always use the public web URL for DPO redirects — CloudFront WAF
      // blocks any request whose RedirectURL/BackURL contains "localhost".
      const redirectUrl = `${PUBLIC_WEB_URL}/checkout/success`
      const backUrl = body.back_url && !body.back_url.includes('localhost')
        ? body.back_url
        : `${PUBLIC_WEB_URL}/events/${body.event_id}`

      const dpoResult = await createPaymentToken({
        amount: Number(total),
        currency: body.currency,
        reference: order.id,
        description: `Ribera tickets — Order ${order.id.slice(0, 8)}`,
        customerEmail: body.attendee_email,
        customerPhone: body.attendee_phone,
        redirectUrl,
        backUrl,
      })
      transactionToken = dpoResult.transactionToken
      paymentUrl = dpoResult.paymentUrl
    } catch (dpoError: unknown) {
      // Rollback: release reserved tickets and cancel order
      await db.$transaction([
        db.order.update({ where: { id: order.id }, data: { status: 'cancelled' } }),
        ...body.items.map((item) =>
          db.ticketTier.update({ where: { id: item.tier_id }, data: { sold: { decrement: item.quantity } } })
        ),
      ])
      const msg = dpoError instanceof Error ? dpoError.message : 'Payment gateway unavailable'
      return reply.code(502).send({ error: msg })
    }

    await db.order.update({ where: { id: order.id }, data: { dpo_token: transactionToken } })

    return reply.code(201).send({ data: { order_id: order.id, payment_url: paymentUrl, total: Number(total), currency: body.currency } })
  })

  // GET /api/v1/orders/:id
  app.get('/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string }

    const order = await db.order.findFirst({
      where: { id, user_id: req.user!.id },
      include: {
        event: { select: { id: true, title: true, starts_at: true, cover_image_url: true, venue_name: true } },
        tickets: { select: { id: true, qr_token: true, status: true, tier: { select: { name: true } } } },
      },
    })

    if (!order) return reply.code(404).send({ error: 'Order not found' })
    return reply.send({ data: order })
  })
}

// Called internally after DPO webhook confirms payment
export async function completeOrder(orderId: string, userId: string) {
  const order = await db.order.findUnique({ where: { id: orderId } })
  if (!order) throw new Error('Order not found')

  const items = order.items as { tier_id: string; tier_name: string; quantity: number; unit_price: number }[]

  const ticketData = items.flatMap((item) =>
    Array.from({ length: item.quantity }, () => ({
      order_id: orderId,
      event_id: order.event_id,
      tier_id: item.tier_id,
      buyer_id: userId,
      holder_id: userId,
      qr_token: generateQrToken(orderId, item.tier_id),
    }))
  )

  // Organiser earns: total - service_fee (platform keeps the fee)
  const organiserEarnings = order.total - order.service_fee

  // Get the event + organiser details
  const event = await db.event.findUnique({
    where: { id: order.event_id },
    select: {
      organiser_id: true,
      title: true,
      starts_at: true,
      venue_name: true,
      organiser: { select: { user_id: true, org_name: true, profile: { select: { display_name: true, phone: true } } } },
      _count: { select: { tickets: true } },
      tiers: { select: { quantity: true } },
    },
  })

  await db.$transaction([
    db.ticket.createMany({ data: ticketData }),
    db.order.update({ where: { id: orderId }, data: { status: 'paid', paid_at: new Date() } }),
    ...(order.promo_code_id
      ? [db.promoCode.update({ where: { id: order.promo_code_id }, data: { used_count: { increment: 1 } } })]
      : []),
    // Credit organiser balance
    ...(event
      ? [db.organiser.update({ where: { id: event.organiser_id }, data: { balance: { increment: organiserEarnings } } })]
      : []),
  ])

  // ── Post-completion notifications (non-blocking) ──────────────────────────
  if (event) {
    const firstItem = items[0]
    const totalQuantity = items.reduce((s, i) => s + i.quantity, 0)
    const totalCapacity = event.tiers.reduce((s, t) => s + t.quantity, 0)
    // After createMany, total sold = existing + new
    const totalSold = (event._count.tickets ?? 0) + totalQuantity

    // 1. Buyer email confirmation
    sendTicketConfirmation({
      email: order.attendee_email,
      name: order.attendee_name,
      eventTitle: event.title,
      eventDate: event.starts_at.toLocaleDateString('en-TZ', { dateStyle: 'full' }),
      venueName: event.venue_name ?? 'TBA',
      ticketId: orderId,
      tierName: firstItem.tier_name,
      qrToken: ticketData[0].qr_token,
      orderId,
    }).catch(e => console.error('Buyer email failed:', e))

    // 2. Buyer SMS confirmation (non-blocking, never throws)
    if (order.attendee_phone) {
      sendTicketSmsConfirmation({
        phone: order.attendee_phone,
        name: order.attendee_name,
        eventTitle: event.title,
        ticketId: orderId,
        tierName: firstItem.tier_name,
      }).catch(e => console.error('Buyer SMS failed:', e))
    }

    // 3. Organiser sale notification email
    const { supabase } = await import('../lib/supabase')
    const { data: authUser } = await supabase.auth.admin.getUserById(event.organiser.user_id)
    const orgEmail = authUser.user?.email
    if (orgEmail) {
      sendOrganiserSaleNotification({
        email: orgEmail,
        name: event.organiser.org_name ?? event.organiser.profile?.display_name ?? 'Organiser',
        eventTitle: event.title,
        attendeeName: order.attendee_name,
        tierName: firstItem.tier_name,
        quantity: totalQuantity,
        grossAmount: Number(order.total),
        netAmount: Number(organiserEarnings),
        currency: order.currency,
        orderId,
        totalSold,
        totalCapacity,
      }).catch(e => console.error('Organiser sale email failed:', e))
    }
  }
}

function generateQrToken(orderId: string, tierId: string) {
  const payload = `${orderId}:${tierId}:${Date.now()}:${crypto.randomBytes(8).toString('hex')}`
  return Buffer.from(payload).toString('base64url')
}

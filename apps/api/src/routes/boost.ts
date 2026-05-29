import type { FastifyInstance } from 'fastify'
import { db } from '../lib/db'
import { requireOrganiser } from '../middleware/auth'
import { BOOST_PACKAGES } from '@ribera/config'
import { createPaymentToken, verifyPayment } from '../services/dpo'
import { sendEventReminders, sendBoostActivated, sendEmail } from '../services/email'

// DPO CloudFront WAF blocks localhost in RedirectURL/BackURL
const PUBLIC_WEB_URL = process.env['PUBLIC_WEB_URL'] ?? 'https://ribera.app'
const ADMIN_EMAIL    = process.env['ADMIN_EMAIL'] ?? 'support@riberaapp.me'

export async function boostRoutes(app: FastifyInstance) {
  // GET /api/v1/boost/packages — public
  app.get('/packages', async (_req, reply) => {
    return reply.send({ data: BOOST_PACKAGES })
  })

  // GET /api/v1/boost/my-boosts — organiser: list own boosts
  app.get('/my-boosts', { preHandler: requireOrganiser }, async (req, reply) => {
    const organiser = await db.organiser.findUnique({ where: { user_id: req.user!.id } })
    if (!organiser) return reply.code(403).send({ error: 'Not an organiser' })

    const boosts = await db.boost.findMany({
      where: { organiser_id: organiser.id },
      orderBy: { created_at: 'desc' },
      include: { event: { select: { id: true, title: true, slug: true, cover_image_url: true } } },
    })

    return reply.send({ data: boosts })
  })

  // POST /api/v1/boost/purchase — organiser only
  app.post('/purchase', { preHandler: requireOrganiser }, async (req, reply) => {
    const { event_id, package_id, back_url } = req.body as {
      event_id: string
      package_id: 'spark' | 'flame' | 'inferno'
      redirect_url?: string
      back_url?: string
    }

    const pkg = BOOST_PACKAGES.find((p) => p.id === package_id)
    if (!pkg) return reply.code(400).send({ error: 'Invalid package' })

    const organiser = await db.organiser.findUnique({ where: { user_id: req.user!.id } })
    if (!organiser) return reply.code(403).send({ error: 'Not an organiser' })

    const event = await db.event.findFirst({ where: { id: event_id, organiser_id: organiser.id } })
    if (!event) return reply.code(404).send({ error: 'Event not found' })

    const startsAt = new Date()
    const endsAt   = new Date(startsAt.getTime() + pkg.duration_days * 86400 * 1000)

    // SMS status: Inferno queues SMS for admin to send when credits are available
    const smsStatus = package_id === 'inferno' ? 'pending_credits' : 'not_applicable'

    const boost = await db.boost.create({
      data: {
        event_id,
        organiser_id: organiser.id,
        package: package_id,
        placement: pkg.placement,
        price_paid: BigInt(pkg.price_tzs),
        currency: 'TZS',
        starts_at: startsAt,
        ends_at: endsAt,
        status: 'pending',
        sms_status: smsStatus,
      },
    })

    // Use caller-supplied redirect/back URLs (organiser app sends its own origin).
    // Fall back to PUBLIC_WEB_URL only if not provided or it's a localhost URL in live DPO mode.
    const IS_MOCK_DPO = process.env['DPO_ENVIRONMENT'] === 'mock'
    const resolveUrl = (provided: string | undefined, fallbackPath: string) => {
      if (provided && (IS_MOCK_DPO || !provided.includes('localhost'))) return provided
      return `${PUBLIC_WEB_URL}${fallbackPath}`
    }
    const { paymentUrl } = await createPaymentToken({
      amount: pkg.price_tzs,
      currency: 'TZS',
      reference: `boost_${boost.id}`,
      description: `Ribera Boost — ${pkg.name} (${pkg.duration_days} days)`,
      redirectUrl: resolveUrl(redirect_url, '/boost/success'),
      backUrl: resolveUrl(back_url, '/boost'),
    })

    return reply.code(201).send({ data: { boost_id: boost.id, payment_url: paymentUrl } })
  })

  // POST /api/v1/boost/verify — called from success page after DPO redirect
  app.post('/verify', { preHandler: requireOrganiser }, async (req, reply) => {
    const { boost_id, transaction_token } = req.body as { boost_id: string; transaction_token: string }

    const organiser = await db.organiser.findUnique({ where: { user_id: req.user!.id } })
    if (!organiser) return reply.code(403).send({ error: 'Not an organiser' })

    const boost = await db.boost.findFirst({
      where: { id: boost_id, organiser_id: organiser.id },
      include: { event: { select: { id: true, title: true } } },
    })
    if (!boost) return reply.code(404).send({ error: 'Boost not found' })
    if (boost.status === 'active') return reply.send({ data: { success: true, already_active: true } })

    const paid = await verifyPayment(transaction_token)
    if (!paid) return reply.code(402).send({ error: 'Payment not confirmed' })

    const pkg = BOOST_PACKAGES.find((p) => p.id === boost.package)

    const activatedBoost = await db.boost.update({
      where: { id: boost_id },
      data: {
        status: 'active',
        dpo_ref: transaction_token,
        // Inferno: keep sms_status as pending_credits; others: not_applicable
        sms_status: boost.package === 'inferno' ? 'pending_credits' : 'not_applicable',
      },
    })

    // ── 1. Notify organiser boost is live ──────────────────────────────────────
    const orgUser = await db.profile.findUnique({ where: { id: organiser.user_id } })
    const { supabase } = await import('../lib/supabase')
    const { data: authUser } = await supabase.auth.admin.getUserById(organiser.user_id)
    const orgEmail = authUser.user?.email

    if (orgEmail && pkg) {
      sendBoostActivated({
        email: orgEmail,
        name: organiser.org_name ?? orgUser?.display_name ?? 'Organiser',
        eventTitle: boost.event.title,
        packageName: pkg.name,
        durationDays: pkg.duration_days,
        endsAt: activatedBoost.ends_at.toLocaleDateString('en-TZ', { dateStyle: 'medium' }),
      }).catch(console.error)
    }

    // ── 2. Flame + Inferno: email blast to all attendees (automatic) ──────────
    if (pkg && (pkg.id === 'flame' || pkg.id === 'inferno')) {
      const tickets = await db.ticket.findMany({
        where: { event_id: boost.event.id, status: { in: ['valid', 'used'] } },
        include: { order: { select: { attendee_email: true, attendee_name: true, attendee_phone: true } } },
      })
      const uniqueAttendees = [...new Map(tickets.map(t => [t.order.attendee_email, t])).values()]

      // Email blast fires immediately (automatic)
      sendEventReminders({
        eventTitle: boost.event.title,
        attendees: uniqueAttendees.map(t => ({ email: t.order.attendee_email, name: t.order.attendee_name })),
      }).catch(console.error)

      // ── 3. Inferno only: alert admin that SMS credits are needed ─────────────
      if (pkg.id === 'inferno') {
        const smsCount = uniqueAttendees.filter(t => t.order.attendee_phone).length
        sendEmail({
          to: [{ email: ADMIN_EMAIL, name: 'Ribera Admin' }],
          subject: `📱 SMS Blast Pending — ${boost.event.title} (${smsCount} recipients)`,
          htmlContent: smsAdminAlertHtml({
            eventTitle: boost.event.title,
            boostId: boost_id,
            organiserName: organiser.org_name ?? orgUser?.display_name ?? 'Organiser',
            orgEmail: orgEmail ?? 'unknown',
            smsCount,
            amount: Number(activatedBoost.price_paid),
          }),
        }).catch(console.error)
      }
    }

    return reply.send({ data: { success: true, boost: activatedBoost, sms_queued: boost.package === 'inferno' } })
  })
}

// ── HTML email template for admin SMS alert ─────────────────────────────────

function smsAdminAlertHtml(p: {
  eventTitle: string; boostId: string; organiserName: string
  orgEmail: string; smsCount: number; amount: number
}) {
  return `
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
      body { font-family: Inter, sans-serif; background: #0A0A0F; color: #fff; margin: 0; padding: 0; }
      .c { max-width: 600px; margin: 0 auto; padding: 32px 24px; }
      .logo { font-size: 28px; font-weight: 900; color: #0066FF; margin-bottom: 32px; }
      .card { background: #141420; border-radius: 16px; padding: 24px; margin: 16px 0; border: 1px solid #28283A; }
      .label { color: #8A8AA0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
      .val { color: #fff; font-size: 16px; font-weight: 600; margin: 4px 0 12px; }
      .btn { display: inline-block; background: #0066FF; color: #fff !important; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; margin-top: 8px; }
      .badge { background: #f59e0b22; color: #f59e0b; padding: 4px 12px; border-radius: 99px; font-size: 13px; font-weight: 700; display: inline-block; }
      hr { border: none; border-top: 1px solid #28283A; margin: 16px 0; }
    </style></head><body>
    <div class="c">
      <div class="logo">Ribera Admin</div>
      <div class="badge">📱 SMS Blast Queued</div>
      <h1 style="font-size:22px;margin:16px 0 8px">Inferno Boost — SMS Pending</h1>
      <p style="color:#8A8AA0">An organiser purchased the Inferno package. Email blast sent automatically. SMS blast is queued pending Brevo credits.</p>
      <div class="card">
        <div class="label">Event</div><div class="val">${p.eventTitle}</div>
        <hr>
        <div class="label">Organiser</div><div class="val">${p.organiserName} (${p.orgEmail})</div>
        <hr>
        <div class="label">SMS Recipients</div><div class="val" style="color:#0066FF;font-size:24px;font-weight:900">${p.smsCount} attendees</div>
        <hr>
        <div class="label">Revenue (Inferno package)</div><div class="val" style="color:#22C55E">TZS ${p.amount.toLocaleString()}</div>
      </div>
      <p style="color:#8A8AA0;font-size:14px;margin-top:16px">When Brevo SMS credits are available, go to the Admin Dashboard → Boosts and click <strong style="color:#fff">Send SMS</strong> to trigger the blast.</p>
      <a href="https://ribera.app/admin/boosts" class="btn">Open Admin Dashboard →</a>
      <div style="color:#4b5563;font-size:12px;margin-top:40px;text-align:center">Ribera Admin · support@riberaapp.me</div>
    </div></body></html>
  `
}

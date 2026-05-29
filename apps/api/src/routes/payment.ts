import type { FastifyInstance } from 'fastify'
import { db } from '../lib/db'
import { verifyPayment, refundPayment } from '../services/dpo'
// Emails are sent inside completeOrder — no duplicate send needed here
import { completeOrder } from './orders'
import { requireAuth } from '../middleware/auth'

export async function paymentRoutes(app: FastifyInstance) {
  // GET /api/v1/payment/mock-pay — development-only mock DPO payment page
  // Activated when DPO_ENVIRONMENT=mock. Simulates the DPO hosted payment page.
  app.get('/mock-pay', async (req, reply) => {
    if (process.env['DPO_ENVIRONMENT'] !== 'mock') {
      return reply.code(404).send({ error: 'Not found' })
    }

    const { token, ref, amount, currency, redirect } = req.query as {
      token?: string; ref?: string; amount?: string; currency?: string; redirect?: string
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mock DPO Payment</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0a0a0f; color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
    .card { background: #15151e; border: 1px solid #2a2a3a; border-radius: 1.5rem; padding: 2rem; max-width: 380px; width: 100%; }
    .badge { background: #ff6600; color: #fff; font-size: 0.65rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.1em; display: inline-block; margin-bottom: 1.25rem; }
    h1 { font-size: 1.25rem; font-weight: 800; margin-bottom: 0.5rem; }
    .sub { color: #9ca3af; font-size: 0.875rem; margin-bottom: 1.5rem; }
    .amount { background: #1f1f2e; border-radius: 0.75rem; padding: 1rem 1.25rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
    .amount .label { color: #6b7280; font-size: 0.8rem; }
    .amount .value { font-size: 1.5rem; font-weight: 900; color: #0066ff; }
    .ref { color: #4b5563; font-size: 0.75rem; margin-bottom: 1.5rem; }
    button { width: 100%; padding: 1rem; border: none; border-radius: 1rem; font-size: 1rem; font-weight: 700; cursor: pointer; margin-bottom: 0.75rem; transition: opacity 0.15s; }
    button:hover { opacity: 0.9; }
    .pay-btn { background: #0066ff; color: #fff; }
    .cancel-btn { background: #1f1f2e; color: #9ca3af; border: 1px solid #2a2a3a; }
    .warn { color: #f59e0b; font-size: 0.75rem; text-align: center; margin-top: 0.75rem; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">🔧 Mock DPO — Dev Only</span>
    <h1>Complete Payment</h1>
    <p class="sub">This is a simulated DPO Pay checkout page for local development.</p>
    <div class="amount">
      <span class="label">Amount due</span>
      <span class="value">${currency ?? 'TZS'} ${Number(amount ?? 0).toLocaleString()}</span>
    </div>
    <p class="ref">Order ref: ${ref ?? 'N/A'}</p>
    <button class="pay-btn" onclick="handlePay()">✓ Pay Now (Mock)</button>
    <button class="cancel-btn" onclick="history.back()">✕ Cancel</button>
    <p class="warn">⚠ No real money is charged in mock mode</p>
  </div>
  <script>
    function handlePay() {
      const redirectUrl = decodeURIComponent('${redirect ?? ''}')
      const token = '${token ?? ''}'
      const ref = '${ref ?? ''}'
      if (redirectUrl) {
        const url = new URL(redirectUrl)
        url.searchParams.set('TransactionToken', token)
        url.searchParams.set('CompanyRef', ref)
        window.location.href = url.toString()
      }
    }
  </script>
</body>
</html>`

    return reply.type('text/html').send(html)
  })

  // POST /api/v1/payment/verify — called by frontend after redirect from DPO
  app.post('/verify', { preHandler: requireAuth }, async (req, reply) => {
    const { order_id, transaction_token } = req.body as { order_id: string; transaction_token: string }

    const order = await db.order.findFirst({ where: { id: order_id, user_id: req.user!.id } })
    if (!order) return reply.code(404).send({ error: 'Order not found' })
    if (order.status === 'paid') return reply.send({ data: { success: true, already_paid: true } })

    const paid = await verifyPayment(transaction_token)
    if (!paid) return reply.code(402).send({ error: 'Payment not confirmed' })

    await db.order.update({ where: { id: order_id }, data: { dpo_ref: transaction_token } })
    // completeOrder handles ticket creation, organiser balance credit,
    // buyer email/SMS confirmation, and organiser sale notification
    await completeOrder(order_id, req.user!.id)

    return reply.send({ data: { success: true } })
  })

  // POST /api/v1/payment/refund
  app.post('/refund', { preHandler: requireAuth }, async (req, reply) => {
    const { order_id } = req.body as { order_id: string }

    const order = await db.order.findFirst({ where: { id: order_id, user_id: req.user!.id, status: 'paid' } })
    if (!order) return reply.code(404).send({ error: 'Paid order not found' })
    if (!order.dpo_ref) return reply.code(400).send({ error: 'No payment reference' })

    // Check refund policy
    const event = await db.event.findUnique({ where: { id: order.event_id } })
    if (!event) return reply.code(404).send({ error: 'Event not found' })

    const hoursUntilEvent = (event.starts_at.getTime() - Date.now()) / 3600000
    const policyHours = event.refund_policy === '48h' ? 48 : event.refund_policy === '24h' ? 24 : Infinity

    if (hoursUntilEvent < policyHours) {
      return reply.code(400).send({ error: `Refund window has closed (policy: ${event.refund_policy})` })
    }

    const refunded = await refundPayment(order.dpo_ref, Number(order.total))
    if (!refunded) return reply.code(500).send({ error: 'Refund failed — contact support' })

    await db.$transaction([
      db.order.update({ where: { id: order_id }, data: { status: 'refunded' } }),
      db.ticket.updateMany({ where: { order_id }, data: { status: 'cancelled' } }),
    ])

    return reply.send({ data: { success: true, amount: Number(order.total), currency: order.currency } })
  })
}

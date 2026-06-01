import type { FastifyInstance } from 'fastify'
import { db } from '../lib/db'
import { verifyPayment } from '../services/dpo'
import { completeOrder } from './orders'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const WEBHOOK_SECRET = process.env['WEBHOOK_SECRET']

export async function webhookRoutes(app: FastifyInstance) {
  app.post('/dpo/callback', {
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
  }, async (req, reply) => {
    // 1. Secret header check (if configured)
    if (WEBHOOK_SECRET) {
      const provided = req.headers['x-webhook-secret']
      if (provided !== WEBHOOK_SECRET) {
        req.log.warn({ ip: req.ip }, 'Webhook secret mismatch')
        return reply.code(200).send('OK') // Return 200 so DPO doesn't retry endlessly
      }
    }

    const { TransactionToken, CompanyRef } = req.body as { TransactionToken?: string; CompanyRef?: string }
    if (!TransactionToken || !CompanyRef) return reply.code(200).send('OK')

    // 2. Verify payment with DPO (source of truth)
    const paid = await verifyPayment(TransactionToken)
    if (!paid) return reply.code(200).send('OK')

    // 3. Boost payment
    if (CompanyRef.startsWith('boost_')) {
      const boostId = CompanyRef.replace('boost_', '')
      if (!UUID_RE.test(boostId)) return reply.code(200).send('OK')
      await db.boost.update({ where: { id: boostId }, data: { dpo_ref: TransactionToken, status: 'active' } }).catch(console.error)
      return reply.code(200).send('OK')
    }

    // 4. Regular order — validate it exists in our DB
    if (!UUID_RE.test(CompanyRef)) return reply.code(200).send('OK')
    const order = await db.order.findUnique({ where: { id: CompanyRef } })
    if (!order) { req.log.warn({ CompanyRef }, 'Webhook: order not found'); return reply.code(200).send('OK') }
    if (order.status === 'paid') return reply.code(200).send('OK') // Already processed

    await db.order.update({ where: { id: CompanyRef }, data: { dpo_ref: TransactionToken } })
    await completeOrder(CompanyRef, order.user_id)

    return reply.code(200).send('OK')
  })
}

import type { FastifyInstance } from 'fastify'
import { db } from '../lib/db'
import { verifyPayment } from '../services/dpo'
import { completeOrder } from './orders'

export async function webhookRoutes(app: FastifyInstance) {
  // POST /api/v1/webhooks/dpo/callback — DPO payment webhook
  app.post('/dpo/callback', async (req, reply) => {
    const { TransactionToken, CompanyRef } = req.body as { TransactionToken?: string; CompanyRef?: string }

    if (!TransactionToken || !CompanyRef) {
      return reply.code(400).send({ error: 'Missing params' })
    }

    const paid = await verifyPayment(TransactionToken)
    if (!paid) return reply.code(200).send('OK') // DPO expects 200 even on ignore

    if (CompanyRef.startsWith('boost_')) {
      const boostId = CompanyRef.replace('boost_', '')
      await db.boost.update({ where: { id: boostId }, data: { dpo_ref: TransactionToken, status: 'active' } }).catch(console.error)
      return reply.code(200).send('OK')
    }

    // Regular order payment
    const orderId = CompanyRef
    const order = await db.order.findUnique({ where: { id: orderId } })
    if (!order || order.status === 'paid') return reply.code(200).send('OK')

    await db.order.update({ where: { id: orderId }, data: { dpo_ref: TransactionToken } })
    await completeOrder(orderId, order.user_id)

    return reply.code(200).send('OK')
  })
}

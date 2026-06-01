import type { FastifyInstance } from 'fastify'
import { db } from '../lib/db'
import { requireAuth } from '../middleware/auth'

export async function reviewsRoutes(app: FastifyInstance) {
  // POST /api/v1/reviews
  app.post('/', { preHandler: requireAuth }, async (req, reply) => {
    const { event_id, rating, comment } = req.body as { event_id: string; rating: number; comment?: string }
    if (!event_id || !rating || rating < 1 || rating > 5) {
      return reply.code(400).send({ error: 'event_id and rating (1-5) required' })
    }
    // Ensure user attended
    const ticket = await db.ticket.findFirst({
      where: { event_id, buyer_id: req.user!.id, status: 'used' },
    })
    if (!ticket) return reply.code(403).send({ error: 'You must attend the event to review it' })

    await db.$executeRawUnsafe(
      `INSERT INTO reviews (user_id, event_id, rating, comment) VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, event_id) DO UPDATE SET rating = $3, comment = $4`,
      req.user!.id,
      event_id,
      rating,
      comment ?? null,
    )

    return reply.code(201).send({ data: { success: true } })
  })

  // GET /api/v1/reviews/:event_id
  app.get('/:event_id', async (req, reply) => {
    const { event_id } = req.params as { event_id: string }
    const reviews = await db
      .$queryRawUnsafe<Array<{ rating: number; comment: string | null; created_at: Date; display_name: string | null }>>(
        `SELECT r.rating, r.comment, r.created_at, p.display_name
         FROM reviews r
         LEFT JOIN profiles p ON p.id = r.user_id
         WHERE r.event_id = $1
         ORDER BY r.created_at DESC LIMIT 20`,
        event_id,
      )
      .catch(() => [])

    const avg =
      reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null

    return reply.send({
      data: {
        reviews,
        avg_rating: avg ? Math.round(avg * 10) / 10 : null,
        count: reviews.length,
      },
    })
  })
}

import 'dotenv/config'
import Fastify from 'fastify'
import { db } from './lib/db'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import multipart from '@fastify/multipart'
import websocket from '@fastify/websocket'

import { eventsRoutes } from './routes/events'
import { ticketsRoutes } from './routes/tickets'
import { ordersRoutes } from './routes/orders'
import { paymentRoutes } from './routes/payment'
import { scannerRoutes } from './routes/scanner'
import { organiserRoutes } from './routes/organiser'
import { boostRoutes } from './routes/boost'
import { adminRoutes } from './routes/admin'
import { webhookRoutes } from './routes/webhooks'
import { authRoutes } from './routes/auth'
import { uploadsRoutes } from './routes/uploads'
import { reviewsRoutes } from './routes/reviews'

// BigInt → Number so JSON.stringify never throws "Do not know how to serialize a BigInt"
;(BigInt.prototype as unknown as Record<string, unknown>)['toJSON'] = function () {
  return Number(this)
}

const app = Fastify({ logger: true, maxParamLength: 500 })

const PORT = parseInt(process.env['PORT'] ?? '3001', 10)
const ALLOWED_ORIGINS = [
  'https://ribera.app',
  'https://organise.ribera.app',
  'https://admin.ribera.app',
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:3003',
]

async function bootstrap() {
  await app.register(helmet, { contentSecurityPolicy: false })

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true)
      cb(new Error('Not allowed by CORS'), false)
    },
    credentials: true,
  })

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })

  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } }) // 10MB
  await app.register(websocket)

  // Health check — also pings DB to keep Supabase free tier alive
  app.get('/health', async () => {
    try {
      await db.$queryRaw`SELECT 1`
      return { status: 'ok', db: 'up', ts: new Date().toISOString() }
    } catch {
      return { status: 'ok', db: 'unreachable', ts: new Date().toISOString() }
    }
  })

  // Routes
  await app.register(authRoutes, { prefix: '/api/v1/auth' })
  await app.register(eventsRoutes, { prefix: '/api/v1/events' })
  await app.register(ticketsRoutes, { prefix: '/api/v1/tickets' })
  await app.register(ordersRoutes, { prefix: '/api/v1/orders' })
  await app.register(paymentRoutes, { prefix: '/api/v1/payment' })
  await app.register(scannerRoutes, { prefix: '/api/v1/scanner' })
  await app.register(organiserRoutes, { prefix: '/api/v1/organiser' })
  await app.register(boostRoutes, { prefix: '/api/v1/boost' })
  await app.register(adminRoutes, { prefix: '/api/v1/admin' })
  await app.register(uploadsRoutes, { prefix: '/api/v1/uploads' })
  await app.register(webhookRoutes, { prefix: '/api/v1/webhooks' })
  await app.register(reviewsRoutes, { prefix: '/api/v1/reviews' })

  await app.listen({ port: PORT, host: '0.0.0.0' })
  console.log(`Ribera API running on port ${PORT}`)
}

bootstrap().catch((err) => {
  console.error(err)
  process.exit(1)
})

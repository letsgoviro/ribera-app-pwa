import type { FastifyInstance } from 'fastify'
import crypto from 'crypto'
import { requireAuth } from '../middleware/auth'
import { createClient } from '@supabase/supabase-js'

// Admin client for storage operations (bypasses RLS)
function getStorageClient() {
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['SUPABASE_ANON_KEY']!
  return createClient(process.env['SUPABASE_URL']!, key)
}

const BUCKET = process.env['SUPABASE_STORAGE_BUCKET'] ?? 'ribera-assets'
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 8 * 1024 * 1024 // 8MB

export async function uploadsRoutes(app: FastifyInstance) {
  // POST /api/v1/uploads/image
  app.post('/image', { preHandler: requireAuth }, async (req, reply) => {
    const file = await req.file()
    if (!file) return reply.code(400).send({ error: 'No file provided' })
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return reply.code(400).send({ error: 'Only JPEG, PNG or WebP allowed' })
    }

    const buffer = await file.toBuffer()
    if (buffer.byteLength > MAX_SIZE) {
      return reply.code(400).send({ error: 'File too large (max 8MB)' })
    }

    const ext = file.mimetype.split('/')[1]
    const key = `uploads/${req.user!.id}/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`

    const storage = getStorageClient()

    // Ensure bucket exists (idempotent)
    await storage.storage.createBucket(BUCKET, { public: true }).catch(() => {})

    const { error } = await storage.storage
      .from(BUCKET)
      .upload(key, buffer, { contentType: file.mimetype, upsert: false })

    if (error) {
      req.log.error(error, 'Supabase storage upload failed')
      return reply.code(500).send({ error: 'Upload failed' })
    }

    const { data: { publicUrl } } = storage.storage.from(BUCKET).getPublicUrl(key)

    return reply.send({ data: { url: publicUrl } })
  })
}

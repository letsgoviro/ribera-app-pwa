import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env['SUPABASE_URL']!
// Service role key is required for admin operations (auth.admin.*).
// Fall back to anon key only in dev so the server doesn't refuse to start.
const supabaseServiceKey =
  process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? process.env['SUPABASE_ANON_KEY']!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase env vars')
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
})

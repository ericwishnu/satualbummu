import { createClient } from '@supabase/supabase-js'

// Nilai placeholder dipakai hanya agar "npm run build" tidak error saat env belum diisi.
// Saat dijalankan, isi .env.local dengan URL & anon key asli dari Supabase.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(url, anonKey)

import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/admin/albums — daftar SEMUA album (hanya admin)
export async function GET(req) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Perlu login admin.' }, { status: 401 })
  }
  try {
    const pool = getPool()
    const [rows] = await pool.query(
      `SELECT a.id, a.name, a.film_preset, a.max_per_guest, a.event_end, a.reveal_mode,
              a.visibility, a.download_style, a.created_at,
              (SELECT COUNT(*) FROM photos p WHERE p.album_id = a.id) AS photo_count
       FROM albums a
       ORDER BY a.created_at DESC`
    )
    return NextResponse.json(rows)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

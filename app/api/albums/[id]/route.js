import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/albums/:id — ambil satu album
export async function GET(req, { params }) {
  try {
    const pool = getPool()
    const [rows] = await pool.execute(
      'SELECT id, name, reveal_at, film_preset, max_per_guest, created_at FROM albums WHERE id = ? LIMIT 1',
      [params.id]
    )
    if (!rows.length) {
      return NextResponse.json({ error: 'Album tidak ditemukan.' }, { status: 404 })
    }
    return NextResponse.json(rows[0])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PATCH /api/albums/:id — ubah pengaturan (waktu reveal, batas foto)
export async function PATCH(req, { params }) {
  try {
    const body = await req.json()
    const revealAt = body.reveal_at ? new Date(body.reveal_at) : null
    const maxNum = Number(body.max_per_guest)
    const maxPerGuest = Number.isFinite(maxNum) && maxNum > 0 ? Math.floor(maxNum) : null

    const pool = getPool()
    await pool.execute(
      'UPDATE albums SET reveal_at = ?, max_per_guest = ? WHERE id = ?',
      [revealAt, maxPerGuest, params.id]
    )
    const [rows] = await pool.execute(
      'SELECT id, name, reveal_at, film_preset, max_per_guest, created_at FROM albums WHERE id = ? LIMIT 1',
      [params.id]
    )
    return NextResponse.json(rows[0] || {})
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

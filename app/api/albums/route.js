import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getPool } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/albums — buat album baru (hanya admin)
export async function POST(req) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Perlu login admin.' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const name = (body.name || '').trim()
    if (!name) {
      return NextResponse.json({ error: 'Nama acara wajib diisi.' }, { status: 400 })
    }
    const id = randomUUID()
    const revealAt = body.reveal_at ? new Date(body.reveal_at) : null
    const filmPreset = body.film_preset || 'klasik'
    const maxNum = Number(body.max_per_guest)
    const maxPerGuest = Number.isFinite(maxNum) && maxNum > 0 ? Math.floor(maxNum) : null

    const pool = getPool()
    await pool.execute(
      'INSERT INTO albums (id, name, reveal_at, film_preset, max_per_guest) VALUES (?, ?, ?, ?, ?)',
      [id, name, revealAt, filmPreset, maxPerGuest]
    )
    return NextResponse.json({
      id,
      name,
      reveal_at: revealAt,
      film_preset: filmPreset,
      max_per_guest: maxPerGuest,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Gagal membuat album: ' + e.message }, { status: 500 })
  }
}

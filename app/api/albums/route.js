import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getPool } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { REVEAL_MODES, VISIBILITIES, DOWNLOAD_STYLES } from '@/lib/reveal'

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
    const filmPreset = body.film_preset || 'klasik'
    const maxNum = Number(body.max_per_guest)
    const maxPerGuest = Number.isFinite(maxNum) && maxNum > 0 ? Math.floor(maxNum) : null
    const revealMode = REVEAL_MODES.includes(body.reveal_mode) ? body.reveal_mode : 'during'
    const visibility = VISIBILITIES.includes(body.visibility) ? body.visibility : 'public'
    const downloadStyle = DOWNLOAD_STYLES.includes(body.download_style) ? body.download_style : 'raw'
    const eventEnd = body.event_end ? new Date(body.event_end) : null

    const pool = getPool()
    await pool.execute(
      `INSERT INTO albums (id, name, film_preset, max_per_guest, event_end, reveal_mode, visibility, download_style)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, filmPreset, maxPerGuest, eventEnd, revealMode, visibility, downloadStyle]
    )
    return NextResponse.json({
      id,
      name,
      film_preset: filmPreset,
      max_per_guest: maxPerGuest,
      event_end: eventEnd,
      reveal_mode: revealMode,
      visibility,
      download_style: downloadStyle,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Gagal membuat album: ' + e.message }, { status: 500 })
  }
}

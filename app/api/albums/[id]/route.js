import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { REVEAL_MODES, VISIBILITIES, DOWNLOAD_STYLES } from '@/lib/reveal'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COLS =
  'id, name, film_preset, max_per_guest, event_end, reveal_mode, visibility, download_style, created_at'

// GET /api/albums/:id — ambil satu album
export async function GET(req, { params }) {
  try {
    const pool = getPool()
    const [rows] = await pool.execute(
      `SELECT ${COLS} FROM albums WHERE id = ? LIMIT 1`,
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

// PATCH /api/albums/:id — ubah setelan (hanya admin)
export async function PATCH(req, { params }) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Perlu login admin.' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const maxNum = Number(body.max_per_guest)
    const maxPerGuest = Number.isFinite(maxNum) && maxNum > 0 ? Math.floor(maxNum) : null
    const revealMode = REVEAL_MODES.includes(body.reveal_mode) ? body.reveal_mode : 'during'
    const visibility = VISIBILITIES.includes(body.visibility) ? body.visibility : 'public'
    const downloadStyle = DOWNLOAD_STYLES.includes(body.download_style) ? body.download_style : 'raw'
    const eventEnd = body.event_end ? new Date(body.event_end) : null

    const pool = getPool()
    await pool.execute(
      `UPDATE albums SET event_end = ?, reveal_mode = ?, visibility = ?, download_style = ?, max_per_guest = ?
       WHERE id = ?`,
      [eventEnd, revealMode, visibility, downloadStyle, maxPerGuest, params.id]
    )
    const [rows] = await pool.execute(
      `SELECT ${COLS} FROM albums WHERE id = ? LIMIT 1`,
      [params.id]
    )
    return NextResponse.json(rows[0] || {})
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

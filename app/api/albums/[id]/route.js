import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { REVEAL_MODES, VISIBILITIES, DOWNLOAD_STYLES } from '@/lib/reveal'
import { FILM_PRESETS } from '@/lib/filmPresets'
import { validateSlug } from '@/lib/slug'
import { resolveAlbum } from '@/lib/albums'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COLS =
  'id, slug, name, film_preset, max_per_guest, event_end, reveal_mode, visibility, download_style, polaroid_title, polaroid_subtitle, bg_path, created_at'

// GET /api/albums/:idOrSlug — ambil satu album (via UUID atau slug kustom)
export async function GET(req, { params }) {
  try {
    const pool = getPool()
    const album = await resolveAlbum(pool, params.id, COLS)
    if (!album) {
      return NextResponse.json({ error: 'Album tidak ditemukan.' }, { status: 404 })
    }
    return NextResponse.json(album)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PATCH /api/albums/:idOrSlug — ubah setelan (hanya admin)
export async function PATCH(req, { params }) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Perlu login admin.' }, { status: 401 })
  }
  try {
    const pool = getPool()
    const found = await resolveAlbum(pool, params.id, 'id')
    if (!found) {
      return NextResponse.json({ error: 'Album tidak ditemukan.' }, { status: 404 })
    }
    const albumId = found.id

    const body = await req.json()
    const maxNum = Number(body.max_per_guest)
    const maxPerGuest = Number.isFinite(maxNum) && maxNum > 0 ? Math.floor(maxNum) : null
    const revealMode = REVEAL_MODES.includes(body.reveal_mode) ? body.reveal_mode : 'during'
    const visibility = VISIBILITIES.includes(body.visibility) ? body.visibility : 'public'
    const downloadStyle = DOWNLOAD_STYLES.includes(body.download_style) ? body.download_style : 'raw'
    const eventEnd = body.event_end ? new Date(body.event_end) : null
    const polaroidTitle = (body.polaroid_title || '').toString().trim().slice(0, 80) || null
    const polaroidSubtitle = (body.polaroid_subtitle || '').toString().trim().slice(0, 80) || null

    // Kolom yang selalu diperbarui.
    const sets = [
      'event_end = ?', 'reveal_mode = ?', 'visibility = ?', 'download_style = ?',
      'max_per_guest = ?', 'polaroid_title = ?', 'polaroid_subtitle = ?',
    ]
    const vals = [eventEnd, revealMode, visibility, downloadStyle, maxPerGuest, polaroidTitle, polaroidSubtitle]

    // Filter film hanya diproses kalau field-nya dikirim.
    if (Object.prototype.hasOwnProperty.call(body, 'film_preset')) {
      if (!Object.keys(FILM_PRESETS).includes(body.film_preset)) {
        return NextResponse.json({ error: 'Filter film tidak dikenal.' }, { status: 400 })
      }
      sets.push('film_preset = ?')
      vals.push(body.film_preset)
    }

    // Slug hanya diproses kalau field-nya dikirim (agar tidak menimpa tanpa sengaja).
    if (Object.prototype.hasOwnProperty.call(body, 'slug')) {
      const v = validateSlug(body.slug)
      if (!v.ok) {
        return NextResponse.json({ error: v.error }, { status: 400 })
      }
      if (v.slug) {
        const [dupes] = await pool.execute(
          'SELECT id FROM albums WHERE slug = ? AND id <> ? LIMIT 1',
          [v.slug, albumId]
        )
        if (dupes.length) {
          return NextResponse.json({ error: `Slug "${v.slug}" sudah dipakai album lain.` }, { status: 409 })
        }
      }
      sets.push('slug = ?')
      vals.push(v.slug)
    }

    vals.push(albumId)
    await pool.execute(`UPDATE albums SET ${sets.join(', ')} WHERE id = ?`, vals)

    const [rows] = await pool.execute(`SELECT ${COLS} FROM albums WHERE id = ? LIMIT 1`, [albumId])
    return NextResponse.json(rows[0] || {})
  } catch (e) {
    if (e && (e.code === 'ER_DUP_ENTRY' || e.errno === 1062)) {
      return NextResponse.json({ error: 'Slug itu sudah dipakai album lain.' }, { status: 409 })
    }
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

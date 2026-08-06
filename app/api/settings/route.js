import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { getSettings, darken, normalizeHex, DEFAULT_SETTINGS } from '@/lib/settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/settings — branding (publik, dipakai untuk merender tampilan)
export async function GET() {
  return NextResponse.json(await getSettings())
}

// PATCH /api/settings — ubah nama brand & warna aksen (admin)
export async function PATCH(req) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Perlu login admin.' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const brand = (body.brand_name || '').toString().trim().slice(0, 80) || DEFAULT_SETTINGS.brand_name
    const accent = normalizeHex(body.accent, DEFAULT_SETTINGS.accent)
    const accentDark = darken(accent)
    const logoText = (body.logo_text || '').toString().trim().slice(0, 12) || null
    const pool = getPool()
    await pool.execute(
      'UPDATE settings SET brand_name = ?, accent = ?, accent_dark = ?, logo_text = ? WHERE id = 1',
      [brand, accent, accentDark, logoText]
    )
    return NextResponse.json(await getSettings())
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

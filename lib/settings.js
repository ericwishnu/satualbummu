import { getPool } from '@/lib/db'

export const DEFAULT_SETTINGS = {
  brand_name: 'SatuAlbumMu',
  accent: '#f4f4f5',
  accent_dark: '#d4d4d7',
  logo_path: null,
  logo_text: null,
}

// Warna aksen versi lebih gelap (untuk hover / gradien).
export function darken(hex, factor = 0.86) {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex || '')
  if (!m) return DEFAULT_SETTINGS.accent_dark
  const n = parseInt(m[1], 16)
  let r = (n >> 16) & 255
  let g = (n >> 8) & 255
  let b = n & 255
  r = Math.max(0, Math.round(r * factor))
  g = Math.max(0, Math.round(g * factor))
  b = Math.max(0, Math.round(b * factor))
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

export function normalizeHex(hex, fallback) {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex || '')
  return m ? '#' + m[1].toLowerCase() : fallback
}

export async function getSettings() {
  try {
    const pool = getPool()
    const [rows] = await pool.query(
      'SELECT brand_name, accent, accent_dark, logo_path, logo_text FROM settings WHERE id = 1 LIMIT 1'
    )
    if (!rows.length) return { ...DEFAULT_SETTINGS }
    return { ...DEFAULT_SETTINGS, ...rows[0] }
  } catch (e) {
    return { ...DEFAULT_SETTINGS }
  }
}

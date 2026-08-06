// Logika "kapan galeri dibuka" berdasarkan waktu acara berakhir + mode.
// Dipakai di server (API) dan browser (galeri, admin, kelola).

export const REVEAL_OPTIONS = [
  { value: 'during',  label: 'Selama acara (foto langsung tampil)' },
  { value: 'end',     label: 'Saat acara berakhir' },
  { value: 'end_1h',  label: '1 jam setelah acara berakhir' },
  { value: 'end_6h',  label: '6 jam setelah acara berakhir' },
  { value: 'end_12h', label: '12 jam setelah acara berakhir' },
  { value: 'end_24h', label: '24 jam setelah acara berakhir' },
  { value: 'end_48h', label: '48 jam setelah acara berakhir' },
]

export const REVEAL_MODES = REVEAL_OPTIONS.map((o) => o.value)
export const VISIBILITIES = ['public', 'private']
export const DOWNLOAD_STYLES = ['raw', 'polaroid']

const OFFSET_HOURS = { end: 0, end_1h: 1, end_6h: 6, end_12h: 12, end_24h: 24, end_48h: 48 }

// Kembalikan epoch-ms kapan galeri dibuka, atau null kalau "selalu terbuka".
export function revealTimestamp(album) {
  if (!album) return null
  const mode = album.reveal_mode || 'during'
  if (mode === 'during') return null
  if (!album.event_end) return null
  const base = new Date(album.event_end).getTime()
  if (isNaN(base)) return null
  const off = (OFFSET_HOURS[mode] || 0) * 3600000
  return base + off
}

export function isRevealed(album, nowMs) {
  const t = revealTimestamp(album)
  if (t == null) return true
  return (typeof nowMs === 'number' ? nowMs : Date.now()) >= t
}

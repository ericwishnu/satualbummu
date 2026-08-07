// Validasi & normalisasi slug URL kustom untuk album.
// Contoh: "EricChelseaWedding" -> dipakai sebagai /EricChelseaWedding

// Path yang dipakai sistem — tidak boleh dipakai sebagai slug.
export const RESERVED_SLUGS = new Set([
  'a', 'admin', 'api', 'login', 'logout',
  '_next', 'static', 'public', 'uploads',
  'favicon.ico', 'robots.txt', 'sitemap.xml',
])

// Buang spasi & garis miring di depan/belakang.
export function normalizeSlug(input) {
  return (input || '').toString().trim().replace(/^\/+/, '').replace(/\/+$/, '')
}

// Ubah teks bebas (mis. nama acara) jadi calon slug yang rapi.
export function slugify(input) {
  return (input || '')
    .toString()
    .trim()
    .replace(/[^A-Za-z0-9-_ ]+/g, '') // buang karakter aneh
    .replace(/\s+/g, '-')             // spasi -> tanda hubung
    .replace(/-+/g, '-')              // rapikan tanda hubung ganda
    .replace(/^[-_]+|[-_]+$/g, '')    // buang - _ di ujung
    .slice(0, 80)
}

// Kembalikan { ok, slug, error }. slug null artinya "kosongkan" (pakai link UUID).
export function validateSlug(input) {
  const v = normalizeSlug(input)
  if (!v) return { ok: true, slug: null }
  if (v.length < 2 || v.length > 80) {
    return { ok: false, error: 'Slug harus 2–80 karakter.' }
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9-_]*$/.test(v)) {
    return { ok: false, error: 'Slug hanya boleh huruf, angka, tanda hubung (-), dan garis bawah (_), diawali huruf/angka.' }
  }
  if (RESERVED_SLUGS.has(v.toLowerCase())) {
    return { ok: false, error: `"${v}" dipakai sistem — pilih slug lain.` }
  }
  return { ok: true, slug: v }
}

// Helper resolusi album: parameter URL bisa berupa UUID id ATAU slug kustom.
// id berformat UUID (36 char), slug berformat lain, jadi cocokkan keduanya.

export async function resolveAlbum(pool, idOrSlug, cols = 'id') {
  if (!idOrSlug) return null
  const [rows] = await pool.execute(
    `SELECT ${cols} FROM albums WHERE id = ? OR slug = ? LIMIT 1`,
    [idOrSlug, idOrSlug]
  )
  return rows[0] || null
}

// Kembalikan hanya UUID id-nya (atau null) dari id/slug.
export async function resolveAlbumId(pool, idOrSlug) {
  const row = await resolveAlbum(pool, idOrSlug, 'id')
  return row ? row.id : null
}

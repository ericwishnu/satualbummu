import { NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import path from 'path'
import { getPool } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { resolveAlbum } from '@/lib/albums'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// DELETE /api/albums/:idOrSlug/photos/:photoId — hapus satu foto (hanya admin)
export async function DELETE(req, { params }) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Perlu login admin.' }, { status: 401 })
  }
  try {
    const pool = getPool()
    const album = await resolveAlbum(pool, params.id, 'id')
    if (!album) {
      return NextResponse.json({ error: 'Album tidak ditemukan.' }, { status: 404 })
    }
    const albumId = album.id

    const [rows] = await pool.execute(
      'SELECT id, storage_path FROM photos WHERE id = ? AND album_id = ? LIMIT 1',
      [params.photoId, albumId]
    )
    if (!rows.length) {
      return NextResponse.json({ error: 'Foto tidak ditemukan.' }, { status: 404 })
    }
    const photo = rows[0]

    // Hapus berkas dari disk (aman: hanya di dalam folder uploads).
    try {
      const sp = photo.storage_path || ''
      if (sp.startsWith('/api/uploads/')) {
        const uploadsDir = path.resolve(process.cwd(), 'uploads')
        const fp = path.resolve(uploadsDir, sp.replace('/api/uploads/', ''))
        if (fp.startsWith(uploadsDir + path.sep)) {
          await unlink(fp).catch(() => {})
        }
      }
    } catch (e) {}

    await pool.execute('DELETE FROM photos WHERE id = ? AND album_id = ?', [params.photoId, albumId])
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

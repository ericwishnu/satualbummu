import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { getPool } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { revealTimestamp } from '@/lib/reveal'
import { resolveAlbum } from '@/lib/albums'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COLS = 'id, storage_path, uploader_name, guest_id, created_at'

// GET /api/albums/:id/photos?guest_id=... — daftar foto (dengan aturan privasi)
// - admin: semua foto
// - privat, atau sebelum galeri dibuka: hanya foto milik guest_id
// - publik & sudah dibuka: semua foto
export async function GET(req, { params }) {
  try {
    const { searchParams } = new URL(req.url)
    const gid = searchParams.get('guest_id') || null

    const pool = getPool()
    const album = await resolveAlbum(
      pool,
      params.id,
      'id, event_end, reveal_mode, visibility'
    )
    if (!album) return NextResponse.json([])
    const albumId = album.id

    const admin = requireAdmin(req)
    const t = revealTimestamp(album)
    const revealed = t == null || Date.now() >= t

    let rows
    if (admin) {
      ;[rows] = await pool.execute(
        `SELECT ${COLS} FROM photos WHERE album_id = ? ORDER BY created_at ASC`,
        [albumId]
      )
    } else if (album.visibility === 'private' || !revealed) {
      // tamu hanya boleh melihat fotonya sendiri
      if (!gid) {
        rows = []
      } else {
        ;[rows] = await pool.execute(
          `SELECT ${COLS} FROM photos WHERE album_id = ? AND guest_id = ? ORDER BY created_at ASC`,
          [albumId, gid]
        )
      }
    } else {
      ;[rows] = await pool.execute(
        `SELECT ${COLS} FROM photos WHERE album_id = ? ORDER BY created_at ASC`,
        [albumId]
      )
    }
    return NextResponse.json(rows)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/albums/:id/photos — unggah satu foto (multipart/form-data)
export async function POST(req, { params }) {
  try {
    const pool = getPool()

    const album = await resolveAlbum(pool, params.id, 'id, max_per_guest, event_end, reveal_mode')
    if (!album) {
      return NextResponse.json({ error: 'Album tidak ditemukan.' }, { status: 404 })
    }
    const albumId = album.id
    const maxPerGuest = album.max_per_guest

    // Unggahan ditutup begitu galeri dibuka (reveal). Mode "during" (tanpa reveal) selalu terbuka.
    const revealT = revealTimestamp(album)
    if (revealT != null && Date.now() >= revealT) {
      return NextResponse.json(
        { error: 'Unggahan sudah ditutup — galeri sudah dibuka.', closed: true },
        { status: 403 }
      )
    }

    const form = await req.formData()
    const file = form.get('file')
    const uploaderName = (form.get('uploader_name') || '').toString().trim() || null
    const guestId = (form.get('guest_id') || '').toString().trim() || null

    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'File tidak ada.' }, { status: 400 })
    }

    if (maxPerGuest && guestId) {
      const [cnt] = await pool.execute(
        'SELECT COUNT(*) AS n FROM photos WHERE album_id = ? AND guest_id = ?',
        [albumId, guestId]
      )
      if (cnt[0].n >= maxPerGuest) {
        return NextResponse.json({ error: 'Jatah foto untuk tamu ini sudah habis.' }, { status: 403 })
      }
    }

    const buf = Buffer.from(await file.arrayBuffer())
    const dir = path.join(process.cwd(), 'uploads', albumId)
    await mkdir(dir, { recursive: true })
    const fileName = randomUUID() + '.jpg'
    await writeFile(path.join(dir, fileName), buf)
    const storagePath = `/api/uploads/${albumId}/${fileName}`

    const photoId = randomUUID()
    await pool.execute(
      'INSERT INTO photos (id, album_id, storage_path, uploader_name, guest_id) VALUES (?, ?, ?, ?, ?)',
      [photoId, albumId, storagePath, uploaderName, guestId]
    )

    return NextResponse.json({ id: photoId, storage_path: storagePath })
  } catch (e) {
    return NextResponse.json({ error: 'Gagal unggah: ' + e.message }, { status: 500 })
  }
}

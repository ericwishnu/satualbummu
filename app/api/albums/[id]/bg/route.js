import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { getPool } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }

// POST /api/albums/:id/bg — unggah background acara (admin)
export async function POST(req, { params }) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Perlu login admin.' }, { status: 401 })
  }
  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'File tidak ada.' }, { status: 400 })
    }
    const ext = ALLOWED[file.type] || 'jpg'
    const buf = Buffer.from(await file.arrayBuffer())
    const dir = path.join(process.cwd(), 'uploads', 'bg')
    await mkdir(dir, { recursive: true })
    const fileName = params.id + '-' + randomUUID() + '.' + ext
    await writeFile(path.join(dir, fileName), buf)
    const bgPath = `/api/uploads/bg/${fileName}`
    const pool = getPool()
    await pool.execute('UPDATE albums SET bg_path = ? WHERE id = ?', [bgPath, params.id])
    return NextResponse.json({ bg_path: bgPath })
  } catch (e) {
    return NextResponse.json({ error: 'Gagal unggah: ' + e.message }, { status: 500 })
  }
}

// DELETE /api/albums/:id/bg — hapus background (admin)
export async function DELETE(req, { params }) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Perlu login admin.' }, { status: 401 })
  }
  try {
    const pool = getPool()
    await pool.execute('UPDATE albums SET bg_path = NULL WHERE id = ?', [params.id])
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

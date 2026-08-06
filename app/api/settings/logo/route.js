import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { getPool } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { getSettings } from '@/lib/settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/svg+xml': 'svg' }

// POST /api/settings/logo — unggah logo brand (admin)
export async function POST(req) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Perlu login admin.' }, { status: 401 })
  }
  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'File tidak ada.' }, { status: 400 })
    }
    const ext = ALLOWED[file.type] || 'png'
    const buf = Buffer.from(await file.arrayBuffer())
    const dir = path.join(process.cwd(), 'uploads', 'brand')
    await mkdir(dir, { recursive: true })
    const fileName = randomUUID() + '.' + ext
    await writeFile(path.join(dir, fileName), buf)
    const logoPath = `/api/uploads/brand/${fileName}`

    const pool = getPool()
    await pool.execute('UPDATE settings SET logo_path = ? WHERE id = 1', [logoPath])
    return NextResponse.json(await getSettings())
  } catch (e) {
    return NextResponse.json({ error: 'Gagal unggah: ' + e.message }, { status: 500 })
  }
}

// DELETE /api/settings/logo — hapus logo (admin)
export async function DELETE(req) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Perlu login admin.' }, { status: 401 })
  }
  try {
    const pool = getPool()
    await pool.execute('UPDATE settings SET logo_path = NULL WHERE id = 1')
    return NextResponse.json(await getSettings())
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

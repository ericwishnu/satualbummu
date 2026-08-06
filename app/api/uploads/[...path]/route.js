import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/uploads/<albumId>/<file>.jpg — menyajikan file foto dari folder uploads.
// (Next.js tidak menyajikan file yang dibuat saat runtime dari /public, jadi
//  kita layani sendiri lewat route ini. Di produksi bisa juga di-offload ke nginx.)
export async function GET(req, { params }) {
  try {
    const parts = params.path || []
    // cegah path traversal
    for (const p of parts) {
      if (!p || p.includes('..') || p.includes('/') || p.includes('\\')) {
        return new NextResponse('Bad request', { status: 400 })
      }
    }
    const filePath = path.join(process.cwd(), 'uploads', ...parts)
    const data = await readFile(filePath)
    const ext = (parts[parts.length - 1].split('.').pop() || '').toLowerCase()
    const types = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
      webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml',
    }
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        'Content-Type': types[ext] || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (e) {
    return new NextResponse('Not found', { status: 404 })
  }
}

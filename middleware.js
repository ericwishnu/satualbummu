import { NextResponse } from 'next/server'

// Pengecekan sesi admin di sisi server, SEBELUM halaman dirender.
// Ini mencegah "kedipan" halaman /admin muncul sesaat sebelum dilempar ke /login.

const COOKIE = 'sa_admin'
const MSG = 'satualbum-admin-v1'

function toHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function expectedToken() {
  const secret =
    process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || 'satualbum-dev-secret'
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(MSG))
  return toHex(sig)
}

async function isAuthed(req) {
  const token = req.cookies.get(COOKIE)?.value
  if (!token) return false
  try {
    return token === (await expectedToken())
  } catch (e) {
    return false
  }
}

export async function middleware(req) {
  const { pathname } = req.nextUrl
  const authed = await isAuthed(req)

  if (pathname === '/') {
    const url = req.nextUrl.clone()
    url.pathname = authed ? '/admin' : '/login'
    return NextResponse.redirect(url)
  }

  // Halaman admin, "kelola", & "cetak" album hanya untuk admin.
  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/')
  const isAlbumAdmin = /^\/a\/[^/]+\/(kelola|cetak|semua)\/?$/.test(pathname)
  if (isAdminPath || isAlbumAdmin) {
    if (!authed) {
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/admin', '/admin/:path*', '/a/:id/kelola', '/a/:id/cetak', '/a/:id/semua'],
}

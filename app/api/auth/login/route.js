import { NextResponse } from 'next/server'
import { makeToken, passwordOk, COOKIE_NAME } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req) {
  const body = await req.json().catch(() => ({}))
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: 'ADMIN_PASSWORD belum diatur di server (.env.local).' },
      { status: 500 }
    )
  }
  if (!passwordOk(body.password)) {
    return NextResponse.json({ error: 'Password salah.' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, makeToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === '1',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  return res
}

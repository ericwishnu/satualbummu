import crypto from 'crypto'

// Autentikasi admin sederhana untuk satu pemilik.
// Password admin & secret diambil dari .env.local:
//   ADMIN_PASSWORD=... (wajib)
//   SESSION_SECRET=... (disarankan; kalau kosong pakai ADMIN_PASSWORD)

export const COOKIE_NAME = 'sa_admin'

function secret() {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || 'satualbum-dev-secret'
}

// Token cookie = HMAC dari secret. Deterministik untuk satu admin.
export function makeToken() {
  return crypto.createHmac('sha256', secret()).update('satualbum-admin-v1').digest('hex')
}

export function tokenValid(token) {
  if (!token) return false
  const expected = makeToken()
  const a = Buffer.from(String(token))
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  try {
    return crypto.timingSafeEqual(a, b)
  } catch (e) {
    return false
  }
}

// Cek apakah request datang dari admin yang sudah login (baca cookie).
export function requireAdmin(req) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return tokenValid(token)
}

// Bandingkan password dengan aman (waktu-konstan).
export function passwordOk(input) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  const a = Buffer.from(String(input || ''))
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  try {
    return crypto.timingSafeEqual(a, b)
  } catch (e) {
    return false
  }
}

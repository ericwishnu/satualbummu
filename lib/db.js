import mysql from 'mysql2/promise'

// Koneksi pool ke MySQL. Hanya dipakai di sisi server (API routes),
// TIDAK PERNAH diakses dari browser. Nilai diambil dari .env.local.
let pool

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'satualbummu',
      waitForConnections: true,
      connectionLimit: 5,
      timezone: 'Z', // simpan & baca waktu dalam UTC agar konsisten
      dateStrings: false,
    })
  }
  return pool
}

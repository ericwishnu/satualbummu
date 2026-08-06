// Migration runner ringan untuk SatuAlbumMu (MySQL).
// Perintah:
//   node scripts/migrate.mjs up        -> jalankan semua migration yang belum
//   node scripts/migrate.mjs down      -> batalkan (rollback) migration terakhir
//   node scripts/migrate.mjs status    -> lihat mana yang sudah/belum
//   node scripts/migrate.mjs make NAMA -> buat file migration baru
//
// Tiap file di folder migrations/ berisi dua bagian:
//   -- migrate:up      (SQL untuk menerapkan)
//   -- migrate:down    (SQL untuk membatalkan)

import mysql from 'mysql2/promise'
import { readdir, readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync, readFileSync } from 'fs'
import path from 'path'

const MIG_DIR = path.join(process.cwd(), 'migrations')

// Muat .env.local tanpa dependency tambahan.
function loadEnv() {
  const p = path.join(process.cwd(), '.env.local')
  if (!existsSync(p)) return
  const txt = readFileSync(p, 'utf8')
  for (const line of txt.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && !(m[1] in process.env)) {
      let v = m[2]
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1)
      }
      process.env[m[1]] = v
    }
  }
}

function parseSql(text) {
  const up = []
  const down = []
  let target = null
  for (const line of text.split('\n')) {
    const t = line.trim().toLowerCase()
    if (t.startsWith('-- migrate:up')) { target = up; continue }
    if (t.startsWith('-- migrate:down')) { target = down; continue }
    if (target) target.push(line)
  }
  return { up: up.join('\n').trim(), down: down.join('\n').trim() }
}

async function getConn() {
  loadEnv()
  return mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'satualbummu',
    multipleStatements: true,
  })
}

async function ensureTable(conn) {
  await conn.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       version    VARCHAR(255) NOT NULL PRIMARY KEY,
       applied_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  )
}

async function listFiles() {
  if (!existsSync(MIG_DIR)) return []
  const files = await readdir(MIG_DIR)
  return files.filter((f) => f.endsWith('.sql')).sort()
}

async function appliedVersions(conn) {
  const [rows] = await conn.query('SELECT version FROM schema_migrations ORDER BY version')
  return rows.map((r) => r.version)
}

async function cmdUp(conn) {
  const files = await listFiles()
  const done = new Set(await appliedVersions(conn))
  let n = 0
  for (const f of files) {
    const version = f.replace(/\.sql$/, '')
    if (done.has(version)) continue
    const { up } = parseSql(await readFile(path.join(MIG_DIR, f), 'utf8'))
    if (up) await conn.query(up)
    await conn.query('INSERT INTO schema_migrations (version) VALUES (?)', [version])
    console.log('  ✓ up   ', version)
    n++
  }
  console.log(n ? `Selesai: ${n} migration diterapkan.` : 'Sudah paling baru — tidak ada yang perlu dijalankan.')
}

async function cmdDown(conn) {
  const applied = await appliedVersions(conn)
  if (!applied.length) {
    console.log('Tidak ada migration untuk dibatalkan.')
    return
  }
  const version = applied[applied.length - 1]
  const file = path.join(MIG_DIR, version + '.sql')
  if (!existsSync(file)) {
    console.log(`File ${version}.sql tidak ditemukan, tidak bisa rollback otomatis.`)
    return
  }
  const { down } = parseSql(await readFile(file, 'utf8'))
  if (down) await conn.query(down)
  await conn.query('DELETE FROM schema_migrations WHERE version = ?', [version])
  console.log('  ✓ down ', version)
}

async function cmdStatus(conn) {
  const files = await listFiles()
  const done = new Set(await appliedVersions(conn))
  if (!files.length) {
    console.log('Belum ada file migration.')
    return
  }
  for (const f of files) {
    const version = f.replace(/\.sql$/, '')
    console.log(`  [${done.has(version) ? 'x' : ' '}] ${version}`)
  }
}

async function cmdMake(name) {
  await mkdir(MIG_DIR, { recursive: true })
  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
  const slug = (name || 'migration')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
  const file = path.join(MIG_DIR, `${ts}_${slug}.sql`)
  await writeFile(file, '-- migrate:up\n\n\n-- migrate:down\n\n')
  console.log('Dibuat:', path.relative(process.cwd(), file))
}

async function main() {
  const cmd = process.argv[2] || 'up'
  if (cmd === 'make') {
    await cmdMake(process.argv[3])
    return
  }
  const conn = await getConn()
  try {
    await ensureTable(conn)
    if (cmd === 'up') await cmdUp(conn)
    else if (cmd === 'down') await cmdDown(conn)
    else if (cmd === 'status') await cmdStatus(conn)
    else console.log('Perintah tidak dikenal:', cmd, '\nGunakan: up | down | status | make')
  } finally {
    await conn.end()
  }
}

main().catch((e) => {
  console.error('Migration gagal:', e.message)
  process.exit(1)
})

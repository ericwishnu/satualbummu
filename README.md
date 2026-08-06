# SatuAlbumMu 📷

Kamera sekali pakai digital untuk acara — versi buatan sendiri. Tamu scan QR, motret lewat browser HP (tanpa install app), semua foto muncul bareng-bareng di galeri pada waktu yang kamu tentukan.

Fitur:
- Ambil foto lewat link/QR (langsung buka kamera HP)
- Galeri gabungan + unduh per foto **dan unduh semua sekaligus (zip)**
- Reveal serentak (foto disembunyikan sampai waktu yang ditentukan)
- **Preset filter film** — satu look seragam untuk seluruh album
- **Batas foto per tamu** (dicek di server)

**Arsitektur (versi MySQL / VM sendiri):**
- **Next.js** — tampilan + API routes (folder `app/api`)
- **MySQL** — menyimpan data album & foto (via `lib/db.js`)
- **Folder `uploads/`** — menyimpan file foto di server-mu

Browser tidak menyentuh MySQL langsung; semua lewat API routes di server (cara aman untuk MySQL).

---

## Yang perlu disiapkan

- **Node.js** LTS (cek `node -v`)
- **MySQL** yang bisa diakses (di VM yang sama atau server DB kamu)

---

## Langkah 1 — Pasang dependency

```bash
npm install
```

## Langkah 2 — Buat database

Cukup buat database kosongnya (tabel dibuat oleh migration di Langkah 4):

```sql
CREATE DATABASE satualbummu CHARACTER SET utf8mb4;
```

## Langkah 3 — Isi koneksi

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=satualbum
DB_PASSWORD=passwordmu
DB_NAME=satualbummu
```

## Langkah 4 — Jalankan migration (bikin tabel)

```bash
npm run migrate
```

Ini membaca `.env.local`, membuat tabel `schema_migrations`, lalu menjalankan semua migration yang belum pernah jalan. Aman diulang.

## Langkah 5 — Jalankan aplikasi

Saat mengembangkan:

```bash
npm run dev
```

Buka http://localhost:3000. Alur: buat album → halaman "kelola" (QR & link) → buka link → ambil foto → galeri.

Untuk dipakai beneran di VM (mode produksi):

```bash
npm run build
npm run start
```

Sarannya pakai process manager biar tetap hidup, mis. **pm2**:

```bash
npm install -g pm2
pm2 start "npm run start" --name satualbummu
pm2 save
```

## Langkah 6 — Domain, HTTPS & "CDN"

- Pasang **nginx** sebagai reverse proxy ke `localhost:3000`, arahkan domainmu ke VM.
- **HTTPS wajib** supaya kamera HP tamu mulus. Cara termudah: taruh **Cloudflare (gratis)** di depan domainmu — sekaligus memberi efek CDN (cache & percepatan) untuk foto tanpa mengubah kode. Alternatif: sertifikat gratis Let's Encrypt via nginx.
- Foto dilayani aplikasi lewat `/api/uploads/...` (dibaca dari folder `uploads/`). Kalau trafik besar, arahkan nginx menyajikan folder `uploads/` langsung, mis: `location /api/uploads/ { alias /path/ke/app/uploads/; }` (lebih ringan daripada lewat Node), dan/atau andalkan cache Cloudflare.

---

## Migration (mengelola perubahan struktur database)

Struktur database dikelola bertahap lewat file di folder `migrations/` (mirip Laravel). Tiap file punya bagian `-- migrate:up` (menerapkan) dan `-- migrate:down` (membatalkan). Tabel `schema_migrations` mencatat file mana yang sudah dijalankan, jadi tidak pernah dobel.

Perintah:

```bash
npm run migrate            # jalankan semua migration yang belum
npm run migrate:status     # lihat mana yang sudah [x] / belum [ ]
npm run migrate:down       # batalkan (rollback) migration TERAKHIR, satu langkah
npm run migrate:make nama_perubahan   # buat file migration baru
```

**Menambah perubahan struktur** (mis. tambah kolom lokasi):

1. `npm run migrate:make tambah_kolom_lokasi` → membuat file baru bernomor di `migrations/`.
2. Buka file itu, isi bagian up & down, contoh:

   ```sql
   -- migrate:up
   ALTER TABLE albums ADD COLUMN lokasi VARCHAR(255) NULL;

   -- migrate:down
   ALTER TABLE albums DROP COLUMN lokasi;
   ```

3. `npm run migrate` untuk menerapkan. Kalau perlu membatalkan: `npm run migrate:down`.

Di VM/produksi, setelah menarik kode terbaru cukup jalankan `npm run migrate` lagi — hanya migration baru yang dijalankan.

> Catatan: `db/schema.sql` adalah snapshot lengkap sekali-jalan (opsional). Untuk pemakaian sehari-hari, andalkan migration di atas sebagai sumber kebenaran struktur.

---

## Struktur folder

```
app/
  page.js                    → beranda: buat album
  a/[id]/page.js             → halaman ambil foto (di-scan tamu)
  a/[id]/galeri/page.js      → galeri + reveal + unduh semua
  a/[id]/kelola/page.js      → QR, statistik, pengaturan
  api/albums/route.js               → POST buat album
  api/albums/[id]/route.js          → GET album, PATCH pengaturan
  api/albums/[id]/photos/route.js   → GET daftar foto, POST unggah foto
  api/uploads/[...path]/route.js    → menyajikan file foto
lib/db.js                    → koneksi MySQL (server)
lib/filmPresets.js           → preset & pemrosesan filter foto (browser)
lib/uuid.js                  → uuid untuk browser (aman di HTTP)
migrations/                  → file migration .sql bernomor (up/down)
scripts/migrate.mjs          → runner migration (up/down/status/make)
db/schema.sql                → snapshot skema lengkap (opsional)
uploads/                     → file foto (dibuat otomatis, tidak masuk git)
```

## Catatan

- **Reveal serentak** diterapkan di sisi tampilan; **batas foto per tamu** dicek di server. Untuk skala pakai sendiri sudah cukup.
- **Backup foto** = cukup backup folder `uploads` + database MySQL.
- Foto diproses (filter + diperkecil) di browser tamu sebelum dikirim, jadi beban server ringan.
- **Trial 30 hari + pembayaran** belum dibuat (tahap ini untuk pakai sendiri). Fondasinya sudah siap ditambah nanti.

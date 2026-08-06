# SatuAlbumMu 📷

Kamera sekali pakai digital untuk acara — versi buatan sendiri. Tamu scan QR, motret lewat browser HP (tanpa install app), semua foto muncul bareng-bareng di galeri pada waktu yang kamu tentukan.

Fitur:
- Ambil foto lewat link/QR (langsung buka kamera HP), pilih dari kamera atau galeri
- Galeri gabungan + unduh per foto **dan unduh semua sekaligus (zip)**
- **Reveal terjadwal** — atur kapan acara berakhir & kapan galeri dibuka (selama acara / saat berakhir / +1j·6j·12j·24j·48j). Sebelum dibuka, tiap tamu hanya melihat fotonya sendiri dalam keadaan blur.
- **Visibilitas** publik (semua lihat semua) atau privat (tiap tamu hanya lihat fotonya)
- **Gaya unduhan** foto asli atau bingkai polaroid (dengan nama pengambil)
- **Preset filter film** — satu look seragam untuk seluruh album
- **Batas foto per tamu** (dicek di server)
- **Portal admin** dengan login — hanya pemilik yang bisa buat/kelola album

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

ADMIN_PASSWORD=password_admin_kamu
SESSION_SECRET=string_acak_panjang_bebas
COOKIE_SECURE=0
```

`ADMIN_PASSWORD` dipakai untuk masuk ke portal admin. `SESSION_SECRET` isi string acak apa saja (untuk menandatangani sesi login). `COOKIE_SECURE=0` aman untuk http; setelah situs pakai HTTPS, ubah ke `1`.

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

## Akses admin & pembagian ke tamu

Ada dua "sisi":

- **Sisi admin (kamu).** Buka `/` atau `/admin` → diminta login pakai `ADMIN_PASSWORD`. Di sini kamu membuat album baru dan melihat **semua album** yang terkumpul (jumlah foto + tanggal). Hanya yang tahu password admin yang bisa membuat/mengubah album.
- **Sisi tamu (umum).** Tamu memakai **link/QR album** langsung (`/a/<id>` untuk ambil foto, `/a/<id>/galeri` untuk galeri). Mereka **tidak perlu login** dan tidak bisa membuat album.

Ganti password admin = cukup ubah `ADMIN_PASSWORD` di `.env.local` lalu restart aplikasi. Untuk memaksa semua sesi login ulang, ubah juga `SESSION_SECRET`.

Halaman `/admin` dan `/a/<id>/kelola` dilindungi login (dicek di server via `middleware.js`, jadi tidak ada "kedipan").

## Reveal, visibilitas & unduhan (setelan per album)

Saat membuat album (atau di halaman Kelola), admin mengatur:

- **Kapan acara berakhir** — waktu acuan untuk membuka galeri.
- **Kapan galeri dibuka** — `Selama acara` (langsung tampil), `Saat acara berakhir`, atau `+1/6/12/24/48 jam` setelah berakhir.
- **Visibilitas** — `Publik` (semua tamu melihat semua foto) atau `Privat` (tiap tamu hanya melihat foto yang ia unggah).
- **Gaya unduhan** — `Foto asli` atau `Bingkai polaroid` (menambahkan bingkai putih + nama pengambil saat diunduh).

Perilaku galeri:

- **Sebelum dibuka:** siapa pun yang membuka galeri hanya melihat **fotonya sendiri** dalam keadaan **blur**, plus hitung mundur. Yang belum mengunggah hanya melihat hitung mundur.
- **Setelah dibuka:** publik → semua foto tampil jelas; privat → tiap tamu tetap hanya melihat fotonya sendiri. Admin (login) selalu melihat semua.

Aturan ini dijaga di server (API `photos`), bukan hanya di tampilan.

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
middleware.js                → cek login admin di server (anti-kedipan)
app/
  page.js                    → beranda: dialihkan ke /admin
  login/page.js              → login admin
  admin/page.js              → portal admin: buat album + daftar semua album
  a/[id]/page.js             → halaman ambil foto (di-scan tamu)
  a/[id]/galeri/page.js      → galeri: blur/reveal, unduh (asli/polaroid)
  a/[id]/kelola/page.js      → QR, statistik, pengaturan (admin)
  api/albums/route.js               → POST buat album (admin)
  api/albums/[id]/route.js          → GET album, PATCH setelan (admin)
  api/albums/[id]/photos/route.js   → GET daftar foto (aturan privasi), POST unggah
  api/uploads/[...path]/route.js    → menyajikan file foto
  api/admin/albums/route.js         → daftar semua album (admin)
  api/auth/login|logout/route.js    → login/logout admin
lib/db.js                    → koneksi MySQL (server)
lib/auth.js                  → autentikasi admin
lib/reveal.js                → logika kapan galeri dibuka
lib/polaroid.js              → bingkai polaroid saat unduh (browser)
lib/filmPresets.js           → preset & pemrosesan filter foto (browser)
lib/uuid.js                  → uuid untuk browser (aman di HTTP)
migrations/                  → file migration .sql bernomor (up/down)
scripts/migrate.mjs          → runner migration (up/down/status/make)
db/schema.sql                → snapshot skema lengkap (opsional)
uploads/                     → file foto (dibuat otomatis, tidak masuk git)
```

## Catatan

- **Aturan reveal/privasi & batas foto per tamu** dicek di server (API), bukan hanya di tampilan.
- **Backup foto** = cukup backup folder `uploads` + database MySQL.
- Foto diproses (filter + diperkecil) di browser tamu sebelum dikirim, jadi beban server ringan.
- **Trial 30 hari + pembayaran** belum dibuat (tahap ini untuk pakai sendiri). Fondasinya sudah siap ditambah nanti.

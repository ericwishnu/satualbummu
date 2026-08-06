# SatuAlbumMu 📷

Kamera sekali pakai digital untuk acara — versi buatan sendiri. Tamu scan QR, motret lewat browser HP (tanpa install app), dan semua foto muncul bareng-bareng di galeri pada waktu yang kamu tentukan.

Fitur versi ini:
- Ambil foto lewat link/QR (langsung buka kamera HP)
- Galeri gabungan + unduh per foto **dan unduh semua sekaligus (zip)**
- Reveal serentak (foto disembunyikan sampai waktu yang ditentukan)
- **Preset filter film** — pilih satu look (Klasik, Portra, CineStill, Hitam-Putih) saat buat album, otomatis diterapkan ke semua foto biar seragam

Dibangun dengan **Next.js** (tampilan) + **Supabase** (database & penyimpanan foto). Gratis untuk dipakai sendiri.

---

## Yang perlu disiapkan (sekali saja)

1. **Node.js** versi LTS — https://nodejs.org (cek dengan `node -v`)
2. Akun **Supabase** gratis — https://supabase.com
3. (Nanti, untuk online) akun **Vercel** gratis — https://vercel.com

---

## Langkah 1 — Pasang dependency

Buka Terminal di folder ini, lalu jalankan:

```bash
npm install
```

## Langkah 2 — Siapkan Supabase

1. Masuk ke https://supabase.com → **New project**. Beri nama (misal `satualbummu`), atur password database, pilih region **Southeast Asia (Singapore)**. Tunggu ±2 menit sampai jadi.
2. Buka menu **Storage** → **New bucket** → nama persis `photos` → centang **Public bucket** → Save.
3. Buka menu **SQL Editor** → **New query** → salin seluruh isi file `supabase/schema.sql` → tempel → **Run**. Ini membuat tabel dan izin akses.

## Langkah 3 — Isi kunci koneksi

1. Di Supabase buka **Project Settings** (ikon gerigi) → **API**.
2. Salin **Project URL** dan **anon public key**.
3. Di folder ini, salin file `.env.local.example` menjadi `.env.local`:

```bash
cp .env.local.example .env.local
```

4. Buka `.env.local`, isi:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

## Langkah 4 — Jalankan di komputer

```bash
npm run dev
```

Buka http://localhost:3000 di browser komputer. Coba: buat album → halaman "kelola" menampilkan QR & link → buka link itu → ambil foto → cek galeri.

**Mau coba dari HP di rumah?** Saat `npm run dev` jalan, di terminal muncul juga alamat "Network" seperti `http://192.168.x.x:3000`. Buka alamat itu di HP (HP harus satu WiFi dengan komputer).

## Langkah 5 — Online-kan (biar QR bisa dipakai di mana saja)

Supaya QR bisa dipindai tamu dari HP mana pun (bukan cuma satu WiFi), deploy ke Vercel:

1. Push folder ini ke sebuah repo GitHub.
2. Di https://vercel.com → **Add New → Project** → pilih repo tadi.
3. Di bagian **Environment Variables**, isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` (nilai sama seperti `.env.local`).
4. **Deploy**. Kamu dapat alamat `https://namamu.vercel.app` — dari sinilah QR akan dibuat, dan bisa dibuka siapa saja.

---

## Struktur folder

```
app/
  page.js                 → beranda: buat album + daftar albummu
  a/[id]/page.js          → halaman ambil foto (yang di-scan tamu)
  a/[id]/galeri/page.js   → galeri + logika reveal serentak
  a/[id]/kelola/page.js   → QR & link untuk dibagikan
lib/supabaseClient.js     → koneksi ke Supabase
supabase/schema.sql       → setup tabel & izin (jalankan di Supabase)
```

## Catatan

- **Reveal serentak** saat ini diterapkan di sisi tampilan (galeri menyembunyikan foto sampai waktunya). Cukup untuk dipakai sendiri; kalau nanti serius, kita pindahkan aturannya ke server agar tidak bisa diakali.
- **Preset film** diterapkan di browser tamu sebelum foto diunggah. Di HP/iPhone baru hasilnya bagus; di browser yang sangat lama, foto tetap terunggah tapi tanpa filter (otomatis fallback).
- **Trial 30 hari + pembayaran** belum dibuat karena tahap ini untuk pakai sendiri (tanpa transaksi). Fondasinya sudah siap untuk menambahkannya nanti.
- Album yang kamu buat diingat di browser komputermu (localStorage) supaya muncul di beranda. Simpan juga link "kelola" sebagai cadangan.

// Terjemahan dua bahasa (EN/ID) untuk halaman tamu (ambil foto & galeri).
// Default: English. Pilihan tamu disimpan di localStorage 'lang'.

export const LANGS = ['en', 'id']
export const DEFAULT_LANG = 'en'

export function getInitialLang() {
  try {
    const v = localStorage.getItem('lang')
    if (v === 'en' || v === 'id') return v
  } catch (e) {}
  return DEFAULT_LANG
}

export function setStoredLang(lang) {
  try { localStorage.setItem('lang', lang) } catch (e) {}
}

// Satuan hitung mundur ringkas (fmtLeft): d=hari, h=jam, m=menit, s=detik.
export const TIME_UNITS = {
  en: { d: 'd', h: 'h', m: 'm', s: 's' },
  id: { d: 'h', h: 'j', m: 'm', s: 'd' },
}

export const dict = {
  en: {
    loading: 'Loading…',
    notFoundTitle: 'Album not found',
    notFoundSub: 'The link may be wrong, or the album was removed.',

    // capture
    kicker: 'Disposable Camera',
    captureSub: 'Capture your moments from this event. All photos are combined and revealed together in the gallery.',
    statMoments: 'Moments',
    statLeft: 'Left',
    statQuota: 'Quota',
    namePlaceholder: 'Enter your name…',
    btnTake: 'Take Photo',
    btnQuotaFull: 'Quota full',
    btnUploading: 'Uploading…',
    ghostAria: 'Choose from gallery',
    hint: 'From camera or pick from gallery • multiple at once',
    hintQuotaFull: "You've used up your photo quota.",
    badgePrivate: '🔒 Private',
    badgePublic: '🌐 Public',
    errName: 'Please enter your name first so we know who’s shooting.',
    errQuotaFull: 'Your photo quota for this album is used up.',
    errPartial: 'Failed to upload some photos.',
    errUploadPrefix: 'Upload failed: ',
    msgQuotaLeft: (n) => `You have ${n} photo${n === 1 ? '' : 's'} left — only the first ${n} were sent.`,
    msgSent: (n) => `${n} photo${n === 1 ? '' : 's'} sent! 🎉`,
    revealLabel: 'Photos reveal in',
    sentLabel: 'Photos you sent',
    galleryLink: 'View gallery →',
    capCaptionDefault: 'Moment',

    // gallery
    kickerGallery: 'Event Gallery',
    kickerRevealing: 'Revealing Soon',
    nameGateSub: 'Enter your name to view the gallery.',
    btnViewGallery: 'View Gallery',
    backTakePhoto: '← Take photos',
    lockedYours: 'These are your photos — still locked. All photos open together on:',
    lockedGeneric: 'The gallery is locked. Photos will open on:',
    cdDays: 'Days',
    cdHours: 'Hours',
    cdMin: 'Min',
    cdSec: 'Sec',
    noUpload: "You haven't uploaded any photos.",
    countCollected: (n) => `${n} photo${n === 1 ? '' : 's'} collected`,
    countYours: (n) => `${n} photo${n === 1 ? '' : 's'} (yours)`,
    privateNote: '🔒 Private gallery — you only see photos you uploaded.',
    noPhotos: 'No photos yet. Be the first!',
    btnDownloadAll: (n) => `⬇  Download all (${n})`,
    btnPreparing: 'Preparing…',
    polaroidNote: 'Downloads use a polaroid frame.',
    errDownloadAll: 'Failed to download all. Try downloading them one by one.',
    backTakeMore: '← Take more photos',
    locale: 'en-US',
  },
  id: {
    loading: 'Memuat…',
    notFoundTitle: 'Album tidak ditemukan',
    notFoundSub: 'Link mungkin salah, atau album sudah dihapus.',

    // capture
    kicker: 'Kamera Sekali Pakai',
    captureSub: 'Abadikan momenmu dari acara ini. Semua foto tergabung dan muncul bareng di galeri.',
    statMoments: 'Momen',
    statLeft: 'Tersisa',
    statQuota: 'Jatah',
    namePlaceholder: 'Tulis namamu…',
    btnTake: 'Ambil Foto',
    btnQuotaFull: 'Jatah habis',
    btnUploading: 'Mengunggah…',
    ghostAria: 'Pilih dari galeri',
    hint: 'Dari kamera atau pilih dari galeri • bisa banyak sekaligus',
    hintQuotaFull: 'Jatah fotomu sudah habis.',
    badgePrivate: '🔒 Privat',
    badgePublic: '🌐 Publik',
    errName: 'Isi namamu dulu ya, biar tahu siapa yang motret.',
    errQuotaFull: 'Jatah fotomu untuk album ini sudah habis.',
    errPartial: 'Gagal upload sebagian foto.',
    errUploadPrefix: 'Gagal upload: ',
    msgQuotaLeft: (n) => `Jatahmu tinggal ${n} foto — hanya ${n} foto pertama yang dikirim.`,
    msgSent: (n) => `${n} foto terkirim! 🎉`,
    revealLabel: 'Foto terungkap dalam',
    sentLabel: 'Foto yang kamu kirim',
    galleryLink: 'Lihat galeri →',
    capCaptionDefault: 'Momen',

    // gallery
    kickerGallery: 'Galeri Acara',
    kickerRevealing: 'Segera Terungkap',
    nameGateSub: 'Tulis namamu dulu untuk melihat galeri.',
    btnViewGallery: 'Lihat Galeri',
    backTakePhoto: '← Ambil foto',
    lockedYours: 'Ini fotomu — masih terkunci. Semua foto terbuka bersamaan pada:',
    lockedGeneric: 'Galeri masih terkunci. Foto akan terbuka pada:',
    cdDays: 'Hari',
    cdHours: 'Jam',
    cdMin: 'Menit',
    cdSec: 'Detik',
    noUpload: 'Kamu belum mengunggah foto.',
    countCollected: (n) => `${n} foto terkumpul`,
    countYours: (n) => `${n} foto (fotomu)`,
    privateNote: '🔒 Galeri privat — kamu hanya melihat foto yang kamu unggah.',
    noPhotos: 'Belum ada foto. Jadilah yang pertama!',
    btnDownloadAll: (n) => `⬇  Unduh semua (${n})`,
    btnPreparing: 'Menyiapkan…',
    polaroidNote: 'Unduhan memakai bingkai polaroid.',
    errDownloadAll: 'Gagal mengunduh semua. Coba unduh satu per satu ya.',
    backTakeMore: '← Ambil foto lagi',
    locale: 'id-ID',
  },
}

export function tFor(lang) {
  return dict[lang] || dict[DEFAULT_LANG]
}

// Metadata SEO per bahasa (dipakai generateMetadata di server).
export function metaFor(lang, name) {
  const nm = name || (lang === 'id' ? 'Acara' : 'Event')
  if (lang === 'id') {
    return {
      title: `${nm} — Album Foto`,
      description: `Ikut ${nm}: ambil & bagikan fotomu, semua muncul bareng di satu galeri. Tanpa aplikasi — cukup buka lewat kamera HP.`,
    }
  }
  return {
    title: `${nm} — Photo Album`,
    description: `Join ${nm}: snap and share your photos, all revealed together in one gallery. No app needed — just open with your phone camera.`,
  }
}

// Pilih bahasa dari header Accept-Language (untuk SEO). Default English.
export function langFromAcceptLanguage(header) {
  const h = (header || '').toLowerCase()
  return h.trim().startsWith('id') ? 'id' : 'en'
}

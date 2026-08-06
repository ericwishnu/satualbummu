'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { processImage, FILM_PRESETS, DEFAULT_PRESET } from '@/lib/filmPresets'
import { clientUUID } from '@/lib/uuid'
import { revealTimestamp } from '@/lib/reveal'

function getGuestId() {
  try {
    let id = localStorage.getItem('guestId')
    if (!id) {
      id = clientUUID()
      localStorage.setItem('guestId', id)
    }
    return id
  } catch (e) {
    return 'anon'
  }
}

// Format sisa waktu jadi ringkas: "1h 21j", "45j 31m", "12m 40d"
function fmtLeft(ms) {
  if (ms == null || ms <= 0) return null
  const totalMin = Math.floor(ms / 60000)
  const d = Math.floor(totalMin / 1440)
  const h = Math.floor((totalMin % 1440) / 60)
  const m = totalMin % 60
  const s = Math.floor((ms % 60000) / 1000)
  if (d > 0) return `${d}h ${h}j`
  if (h > 0) return `${h}j ${m}m`
  if (m > 0) return `${m}m ${s}d`
  return `${s}d`
}

const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
)

export default function Capture({ params }) {
  const albumId = params.id
  const [album, setAlbum] = useState(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [guestId, setGuestId] = useState('')
  const [used, setUsed] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [sentThumbs, setSentThumbs] = useState([])
  const [now, setNow] = useState(0)
  const fileRef = useRef(null)

  const max = album && album.max_per_guest ? album.max_per_guest : null
  const remaining = max == null ? Infinity : Math.max(0, max - used)
  const limitReached = max != null && remaining <= 0

  useEffect(() => {
    const gid = getGuestId()
    setGuestId(gid)
    setNow(Date.now())
    try {
      const n = localStorage.getItem('uploaderName')
      if (n) setName(n)
    } catch (e) {}

    async function load() {
      try {
        const res = await fetch(`/api/albums/${albumId}`)
        if (res.ok) {
          setAlbum(await res.json())
          const pr = await fetch(`/api/albums/${albumId}/photos?guest_id=${encodeURIComponent(gid)}`)
          if (pr.ok) {
            const photos = await pr.json()
            setUsed(photos.filter((p) => p.guest_id === gid).length)
          }
        }
      } catch (e) {}
      setLoading(false)
    }
    load()

    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [albumId])

  async function handleFiles(e) {
    let files = Array.from(e.target.files || [])
    if (!files.length) return
    if (!name.trim()) {
      setErr('Isi namamu dulu ya, biar tahu siapa yang motret.')
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    setErr('')
    setMsg('')

    if (max != null) {
      if (remaining <= 0) {
        setErr('Jatah fotomu untuk album ini sudah habis.')
        if (fileRef.current) fileRef.current.value = ''
        return
      }
      if (files.length > remaining) {
        files = files.slice(0, remaining)
        setMsg(`Jatahmu tinggal ${remaining} foto — hanya ${remaining} foto pertama yang dikirim.`)
      }
    }

    try { localStorage.setItem('uploaderName', name.trim()) } catch (e) {}
    setUploading(true)

    const preset = (album && album.film_preset) || DEFAULT_PRESET
    let ok = 0
    const newThumbs = []
    for (const file of files) {
      try {
        const processed = await processImage(file, preset)
        const fd = new FormData()
        fd.append('file', processed, 'foto.jpg')
        fd.append('uploader_name', name.trim())
        fd.append('guest_id', guestId)
        const res = await fetch(`/api/albums/${albumId}/photos`, { method: 'POST', body: fd })
        if (res.ok) {
          ok++
          try { newThumbs.push(URL.createObjectURL(processed)) } catch (e) {}
        } else {
          const d = await res.json().catch(() => ({}))
          setErr(d.error || 'Gagal upload sebagian foto.')
        }
      } catch (e) {
        setErr('Gagal upload: ' + e.message)
      }
    }
    setUploading(false)
    setUsed((c) => c + ok)
    if (newThumbs.length) setSentThumbs((prev) => [...prev, ...newThumbs])
    if (ok > 0 && !msg) setMsg(`${ok} foto terkirim! 🎉`)
    if (fileRef.current) fileRef.current.value = ''
  }

  if (loading) {
    return <p className="sub" style={{ textAlign: 'center', marginTop: 60 }}>Memuat…</p>
  }
  if (!album) {
    return (
      <div className="ev">
        <div className="ev-hero noimg" />
        <div className="ev-body">
          <div className="ev-spacer" />
          <h1 className="ev-title font-serif">Album tidak ditemukan</h1>
          <p className="ev-sub">Link mungkin salah, atau album sudah dihapus.</p>
        </div>
      </div>
    )
  }

  const presetLabel = FILM_PRESETS[album.film_preset]?.label
  const hasBg = !!album.bg_path

  // hitung mundur
  const endMs = album.event_end ? new Date(album.event_end).getTime() : null
  const leftToEnd = endMs != null ? fmtLeft(endMs - now) : null
  const revealMs = revealTimestamp(album)
  const revealed = revealMs == null ? true : now >= revealMs
  const leftToReveal = revealMs != null && !revealed ? fmtLeft(revealMs - now) : null

  const capCaption = (album.polaroid_title || '').trim() || 'Momen'

  return (
    <div className="ev">
      <div
        className={`ev-hero ${hasBg ? '' : 'noimg'}`}
        style={hasBg ? { backgroundImage: `url(${album.bg_path})` } : undefined}
      />

      <div className="ev-body">
        <div className="ev-spacer" />

        <div className="ev-kicker">Kamera Sekali Pakai</div>
        <h1 className="ev-title font-serif">{album.name}</h1>
        <p className="ev-sub">
          Abadikan momenmu dari acara ini. Semua foto tergabung dan muncul bareng di galeri.
        </p>

        <div className="ev-stats">
          <div className="ev-stat">
            <div className="ev-stat-num">{used}</div>
            <div className="ev-stat-lbl">Momen</div>
          </div>
          <div className="ev-div" />
          <div className="ev-stat">
            <div className="ev-stat-num">{leftToEnd || '∞'}</div>
            <div className="ev-stat-lbl">Tersisa</div>
          </div>
          <div className="ev-div" />
          <div className="ev-stat">
            <div className="ev-stat-num">{max != null ? `${used}/${max}` : '∞'}</div>
            <div className="ev-stat-lbl">Jatah</div>
          </div>
        </div>

        <div className="ev-panel">
          <input
            className="ev-name"
            type="text"
            placeholder="Tulis namamu…"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            ref={fileRef}
            id="cam"
            type="file"
            accept="image/*"
            multiple
            disabled={limitReached || uploading}
            onChange={handleFiles}
            style={{ display: 'none' }}
          />

          <div className="ev-actions">
            <label htmlFor="cam" className={`ev-btn primary ${limitReached || uploading ? 'disabled' : ''}`}>
              <CameraIcon />
              {limitReached ? 'Jatah habis' : uploading ? 'Mengunggah…' : 'Ambil Foto'}
            </label>
            <label htmlFor="cam" className={`ev-btn ghost ${limitReached || uploading ? 'disabled' : ''}`} aria-label="Pilih dari galeri">
              ＋
            </label>
          </div>

          <p className="ev-hint">
            {limitReached ? 'Jatah fotomu sudah habis.' : 'Dari kamera atau pilih dari galeri • bisa banyak sekaligus'}
          </p>

          {err ? <div className="error" style={{ textAlign: 'center' }}>{err}</div> : null}
          {msg ? <div className="ok" style={{ textAlign: 'center' }}>{msg}</div> : null}
        </div>

        <div className="ev-badges">
          {presetLabel ? <span className="ev-badge">🎞️ {presetLabel}</span> : null}
          <span className="ev-badge">{album.visibility === 'private' ? '🔒 Privat' : '🌐 Publik'}</span>
        </div>

        {leftToReveal ? (
          <div className="ev-reveal">
            <div className="ev-reveal-lbl">Foto terungkap dalam</div>
            <div className="ev-reveal-num font-serif">{leftToReveal}</div>
          </div>
        ) : null}

        {sentThumbs.length > 0 ? (
          <>
            <div className="ev-sent-lbl">Foto yang kamu kirim</div>
            <div className="ev-polas">
              {sentThumbs.slice(-6).map((u, i) => (
                <div className="ev-pola" key={i}>
                  <img src={u} alt="" />
                  <div className="ev-pola-cap font-script">{capCaption}</div>
                </div>
              ))}
            </div>
          </>
        ) : null}

        <Link className="ev-gallery-link" href={`/a/${albumId}/galeri`}>
          Lihat galeri →
        </Link>
      </div>
    </div>
  )
}

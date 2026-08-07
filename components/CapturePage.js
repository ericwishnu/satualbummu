'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { processImage, FILM_PRESETS, DEFAULT_PRESET } from '@/lib/filmPresets'
import { clientUUID } from '@/lib/uuid'
import { revealTimestamp } from '@/lib/reveal'
import { getInitialLang, tFor, TIME_UNITS } from '@/lib/i18n'
import LangToggle from '@/components/LangToggle'

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

// Format sisa waktu ringkas, satuan mengikuti bahasa.
function fmtLeft(ms, lang) {
  if (ms == null || ms <= 0) return null
  const u = TIME_UNITS[lang] || TIME_UNITS.en
  const totalMin = Math.floor(ms / 60000)
  const d = Math.floor(totalMin / 1440)
  const h = Math.floor((totalMin % 1440) / 60)
  const m = totalMin % 60
  const s = Math.floor((ms % 60000) / 1000)
  if (d > 0) return `${d}${u.d} ${h}${u.h}`
  if (h > 0) return `${h}${u.h} ${m}${u.m}`
  if (m > 0) return `${m}${u.m} ${s}${u.s}`
  return `${s}${u.s}`
}

const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
)

// albumId bisa berupa UUID atau slug kustom — keduanya diterima API.
export default function CapturePage({ albumId }) {
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
  const [lang, setLang] = useState('en')
  const t = tFor(lang)

  const max = album && album.max_per_guest ? album.max_per_guest : null
  const remaining = max == null ? Infinity : Math.max(0, max - used)
  const limitReached = max != null && remaining <= 0

  useEffect(() => {
    setLang(getInitialLang())
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

    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [albumId])

  async function handleFiles(e) {
    const input = e.target
    let files = Array.from(input.files || [])
    if (!files.length) return
    if (!name.trim()) {
      setErr(t.errName)
      input.value = ''
      return
    }
    setErr('')
    setMsg('')

    if (max != null) {
      if (remaining <= 0) {
        setErr(t.errQuotaFull)
        input.value = ''
        return
      }
      if (files.length > remaining) {
        files = files.slice(0, remaining)
        setMsg(t.msgQuotaLeft(remaining))
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
          setErr(d.error || t.errPartial)
        }
      } catch (e) {
        setErr(t.errUploadPrefix + e.message)
      }
    }
    setUploading(false)
    setUsed((c) => c + ok)
    if (newThumbs.length) setSentThumbs((prev) => [...prev, ...newThumbs])
    if (ok > 0 && !msg) setMsg(t.msgSent(ok))
    input.value = ''
  }

  if (loading) {
    return <p className="sub" style={{ textAlign: 'center', marginTop: 60 }}>{t.loading}</p>
  }
  if (!album) {
    return (
      <div className="ev">
        <LangToggle lang={lang} onChange={setLang} />
        <div className="ev-hero noimg" />
        <div className="ev-body">
          <div className="ev-spacer" />
          <h1 className="ev-title font-serif">{t.notFoundTitle}</h1>
          <p className="ev-sub">{t.notFoundSub}</p>
        </div>
      </div>
    )
  }

  // Link antar-halaman pakai slug kalau ada, biar tetap cantik.
  const base = album.slug ? `/event/${album.slug}` : `/a/${albumId}`

  const presetLabel = FILM_PRESETS[album.film_preset]?.label
  const hasBg = !!album.bg_path

  // hitung mundur
  const endMs = album.event_end ? new Date(album.event_end).getTime() : null
  const leftToEnd = endMs != null ? fmtLeft(endMs - now, lang) : null
  const revealMs = revealTimestamp(album)
  const revealed = revealMs == null ? true : now >= revealMs
  const leftToReveal = revealMs != null && !revealed ? fmtLeft(revealMs - now, lang) : null

  const capCaption = (album.polaroid_title || '').trim() || t.capCaptionDefault

  return (
    <div className="ev">
      <LangToggle lang={lang} onChange={setLang} />
      <div
        className={`ev-hero ${hasBg ? '' : 'noimg'}`}
        style={hasBg ? { backgroundImage: `url(${album.bg_path})` } : undefined}
      />

      <div className="ev-body">
        <div className="ev-spacer" />

        <div className="ev-kicker">{t.kicker}</div>
        <h1 className="ev-title font-serif">{album.name}</h1>
        <p className="ev-sub">{t.captureSub}</p>

        <div className="ev-stats">
          <div className="ev-stat">
            <div className="ev-stat-num">{used}</div>
            <div className="ev-stat-lbl">{t.statMoments}</div>
          </div>
          <div className="ev-div" />
          <div className="ev-stat">
            <div className="ev-stat-num">{leftToEnd || '∞'}</div>
            <div className="ev-stat-lbl">{t.statLeft}</div>
          </div>
          <div className="ev-div" />
          <div className="ev-stat">
            <div className="ev-stat-num">{max != null ? `${used}/${max}` : '∞'}</div>
            <div className="ev-stat-lbl">{t.statQuota}</div>
          </div>
        </div>

        <div className="ev-panel">
          <input
            className="ev-name"
            type="text"
            placeholder={t.namePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* Kamera langsung (Android/iOS): capture=environment membuka kamera belakang */}
          <input
            id="cam-camera"
            type="file"
            accept="image/*"
            capture="environment"
            disabled={limitReached || uploading}
            onChange={handleFiles}
            style={{ display: 'none' }}
          />
          {/* Galeri / berkas: tanpa capture, boleh banyak sekaligus */}
          <input
            id="cam-gallery"
            type="file"
            accept="image/*"
            multiple
            disabled={limitReached || uploading}
            onChange={handleFiles}
            style={{ display: 'none' }}
          />

          <div className="ev-actions">
            <label htmlFor="cam-camera" className={`ev-btn primary ${limitReached || uploading ? 'disabled' : ''}`}>
              <CameraIcon />
              {limitReached ? t.btnQuotaFull : uploading ? t.btnUploading : t.btnTake}
            </label>
            <label htmlFor="cam-gallery" className={`ev-btn ghost ${limitReached || uploading ? 'disabled' : ''}`} aria-label={t.ghostAria}>
              ＋
            </label>
          </div>

          <p className="ev-hint">{limitReached ? t.hintQuotaFull : t.hint}</p>

          {err ? <div className="error" style={{ textAlign: 'center' }}>{err}</div> : null}
          {msg ? <div className="ok" style={{ textAlign: 'center' }}>{msg}</div> : null}
        </div>

        <div className="ev-badges">
          {presetLabel ? <span className="ev-badge">🎞️ {presetLabel}</span> : null}
          <span className="ev-badge">{album.visibility === 'private' ? t.badgePrivate : t.badgePublic}</span>
        </div>

        {leftToReveal ? (
          <div className="ev-reveal">
            <div className="ev-reveal-lbl">{t.revealLabel}</div>
            <div className="ev-reveal-num font-serif">{leftToReveal}</div>
          </div>
        ) : null}

        {sentThumbs.length > 0 ? (
          <>
            <div className="ev-sent-lbl">{t.sentLabel}</div>
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

        <Link className="ev-gallery-link" href={`${base}/galeri`}>
          {t.galleryLink}
        </Link>
      </div>
    </div>
  )
}

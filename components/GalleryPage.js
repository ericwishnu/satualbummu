'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import JSZip from 'jszip'
import { revealTimestamp } from '@/lib/reveal'
import { clientUUID } from '@/lib/uuid'
import { toPolaroidBlob } from '@/lib/polaroid'
import { getInitialLang, tFor } from '@/lib/i18n'
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

// albumId bisa berupa UUID atau slug kustom — keduanya diterima API.
export default function GalleryPage({ albumId }) {
  const [album, setAlbum] = useState(null)
  const [loadingAlbum, setLoadingAlbum] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [photos, setPhotos] = useState([])
  const [now, setNow] = useState(() => Date.now())
  const [gid, setGid] = useState('')
  const [zipping, setZipping] = useState(false)
  const [msg, setMsg] = useState('')
  const [viewerName, setViewerName] = useState('')
  const [nameReady, setNameReady] = useState(false)
  const [lang, setLang] = useState('en')
  const t = tFor(lang)

  useEffect(() => {
    setLang(getInitialLang())
    setGid(getGuestId())
    try {
      const n = localStorage.getItem('uploaderName')
      if (n) { setViewerName(n); setNameReady(true) }
    } catch (e) {}
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    async function loadAlbum() {
      try {
        const res = await fetch(`/api/albums/${albumId}`, { cache: 'no-store' })
        if (res.ok) setAlbum(await res.json())
        else setNotFound(true)
      } catch (e) {
        setNotFound(true)
      }
      setLoadingAlbum(false)
    }
    loadAlbum()
  }, [albumId])

  const revealMs = album ? revealTimestamp(album) : null
  const revealed = revealMs == null || now >= revealMs

  useEffect(() => {
    if (!album || !gid || !nameReady) return
    let cancelled = false
    async function loadPhotos() {
      try {
        const res = await fetch(`/api/albums/${albumId}/photos?guest_id=${encodeURIComponent(gid)}`)
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setPhotos(data)
        }
      } catch (e) {}
    }
    loadPhotos()
    return () => { cancelled = true }
  }, [album, gid, revealed, nameReady, albumId])

  function submitName(e) {
    e.preventDefault()
    const v = viewerName.trim()
    if (!v) return
    try { localStorage.setItem('uploaderName', v) } catch (e) {}
    setNameReady(true)
  }

  async function blobFor(p) {
    if ((album?.download_style) === 'polaroid') {
      const title = album?.polaroid_title || ''
      const subtitle = album?.polaroid_subtitle || ''
      const cap = title || subtitle ? { title, subtitle } : { title: p.uploader_name || '' }
      return await toPolaroidBlob(p.storage_path, cap)
    }
    const r = await fetch(p.storage_path)
    return await r.blob()
  }

  async function downloadOne(p) {
    try {
      const blob = await blobFor(p)
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${(p.uploader_name || 'foto').replace(/[^a-z0-9]/gi, '_')}.jpg`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 4000)
    } catch (e) {}
  }

  async function downloadAll() {
    if (!photos.length) return
    setZipping(true)
    setMsg('')
    try {
      const zip = new JSZip()
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i]
        const blob = await blobFor(p)
        const who = (p.uploader_name || 'tamu').replace(/[^a-z0-9]/gi, '_')
        zip.file(`${String(i + 1).padStart(3, '0')}_${who}.jpg`, blob)
      }
      const content = await zip.generateAsync({ type: 'blob' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(content)
      a.download = `${(album?.name || 'album').replace(/[^a-z0-9]/gi, '_')}.zip`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 4000)
    } catch (e) {
      setMsg(t.errDownloadAll)
    }
    setZipping(false)
  }

  const hasBg = !!album?.bg_path
  const heroStyle = hasBg ? { backgroundImage: `url(${album.bg_path})` } : undefined
  const heroClass = `ev-hero ${hasBg ? '' : 'noimg'}`
  const base = album?.slug ? `/event/${album.slug}` : `/a/${albumId}`

  if (loadingAlbum) return <p className="sub" style={{ textAlign: 'center', marginTop: 60 }}>{t.loading}</p>

  if (notFound || !album) {
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

  // === Wajib isi nama dulu ===
  if (!nameReady) {
    return (
      <div className="ev">
        <LangToggle lang={lang} onChange={setLang} />
        <div className={heroClass} style={heroStyle} />
        <div className="ev-body">
          <div className="ev-spacer" />
          <div className="ev-kicker">{t.kickerGallery}</div>
          <h1 className="ev-title font-serif">{album.name}</h1>
          <p className="ev-sub">{t.nameGateSub}</p>
          <div className="ev-panel">
            <form onSubmit={submitName}>
              <input
                className="ev-name"
                type="text"
                placeholder={t.namePlaceholder}
                value={viewerName}
                onChange={(e) => setViewerName(e.target.value)}
                autoFocus
              />
              <div className="ev-actions">
                <button className="ev-btn primary" type="submit">{t.btnViewGallery}</button>
              </div>
            </form>
          </div>
          <Link className="ev-gallery-link" href={base}>{t.backTakePhoto}</Link>
        </div>
      </div>
    )
  }

  // === Belum dibuka: blur + hitung mundur ===
  if (!revealed) {
    const diff = Math.max(0, revealMs - now)
    const d = Math.floor(diff / 86400000)
    const h = Math.floor((diff % 86400000) / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    const pad = (n) => String(n).padStart(2, '0')
    return (
      <div className="ev compact">
        <LangToggle lang={lang} onChange={setLang} />
        <div className={heroClass} style={heroStyle} />
        <div className="ev-body wide">
          <div className="ev-spacer" />
          <div className="ev-kicker">{t.kickerRevealing}</div>
          <h1 className="ev-title font-serif">{album.name}</h1>
          <p className="ev-sub">{photos.length > 0 ? t.lockedYours : t.lockedGeneric}</p>

          <div className="ev-cd-grid">
            <div className="ev-cd"><div className="ev-cd-num font-serif">{d}</div><div className="ev-cd-lbl">{t.cdDays}</div></div>
            <div className="ev-cd"><div className="ev-cd-num font-serif">{pad(h)}</div><div className="ev-cd-lbl">{t.cdHours}</div></div>
            <div className="ev-cd"><div className="ev-cd-num font-serif">{pad(m)}</div><div className="ev-cd-lbl">{t.cdMin}</div></div>
            <div className="ev-cd"><div className="ev-cd-num font-serif">{pad(s)}</div><div className="ev-cd-lbl">{t.cdSec}</div></div>
          </div>
          <p className="ev-date">{new Date(revealMs).toLocaleString(t.locale)}</p>

          {photos.length > 0 ? (
            <div className="ev-masonry-wrap">
              <div className="masonry blurred">
                {photos.map((p) => (
                  <div className="m-item" key={p.id}>
                    <img src={p.storage_path} alt="" loading="lazy" />
                    <span className="m-lock">🔒</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="ev-sub" style={{ marginTop: 22 }}>{t.noUpload}</p>
          )}

          <Link className="ev-gallery-link" href={base}>{t.backTakePhoto}</Link>
        </div>
      </div>
    )
  }

  // === Sudah dibuka ===
  const polaroid = album.download_style === 'polaroid'
  return (
    <div className="ev compact">
      <LangToggle lang={lang} onChange={setLang} />
      <div className={heroClass} style={heroStyle} />
      <div className="ev-body wide">
        <div className="ev-spacer" />
        <div className="ev-kicker">{t.kickerGallery}</div>
        <h1 className="ev-title font-serif">{album.name}</h1>
        <p className="ev-sub">
          {album.visibility === 'private' ? t.countYours(photos.length) : t.countCollected(photos.length)}
        </p>

        {album.visibility === 'private' ? (
          <div className="ev-note">{t.privateNote}</div>
        ) : null}

        {photos.length === 0 ? (
          <p className="ev-sub" style={{ marginTop: 22 }}>{t.noPhotos}</p>
        ) : (
          <>
            <button className="ev-download" onClick={downloadAll} disabled={zipping}>
              {zipping ? t.btnPreparing : t.btnDownloadAll(photos.length)}
            </button>
            {album.download_style === 'polaroid' ? (
              <p className="ev-dl-note">{t.polaroidNote}</p>
            ) : null}
            {msg ? <div className="error" style={{ textAlign: 'center' }}>{msg}</div> : null}

            <div className="ev-masonry-wrap">
              <div className={`masonry ${polaroid ? 'polaroid' : ''}`}>
                {photos.map((p) => {
                  // Caption polaroid sama dengan yang dipakai saat unduhan.
                  const hasCap = !!(album.polaroid_title || album.polaroid_subtitle)
                  const capTitle = polaroid ? (hasCap ? (album.polaroid_title || '') : (p.uploader_name || '')) : ''
                  const capSub = polaroid && hasCap ? (album.polaroid_subtitle || '') : ''
                  return (
                    <div className="m-item" key={p.id}>
                      <button className="m-dl" onClick={() => downloadOne(p)} title="Unduh">⬇</button>
                      <img src={p.storage_path} alt={p.uploader_name || 'foto'} loading="lazy" />
                      {polaroid ? (
                        (capTitle || capSub) ? (
                          <div className="m-pola-cap">
                            {capTitle ? <div className="m-pola-title">{capTitle}</div> : null}
                            {capSub ? <div className="m-pola-sub">{capSub}</div> : null}
                          </div>
                        ) : null
                      ) : (
                        p.uploader_name ? <span className="m-chip">{p.uploader_name}</span> : null
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        <Link className="ev-gallery-link" href={base}>{t.backTakeMore}</Link>
      </div>
    </div>
  )
}

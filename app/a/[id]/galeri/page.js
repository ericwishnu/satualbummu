'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import JSZip from 'jszip'
import { revealTimestamp } from '@/lib/reveal'
import { clientUUID } from '@/lib/uuid'
import { toPolaroidBlob } from '@/lib/polaroid'
import { BrandLogo } from '@/components/BrandProvider'

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

export default function Gallery({ params }) {
  const albumId = params.id
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

  useEffect(() => {
    setGid(getGuestId())
    try {
      const n = localStorage.getItem('uploaderName')
      if (n) { setViewerName(n); setNameReady(true) }
    } catch (e) {}
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    async function loadAlbum() {
      try {
        const res = await fetch(`/api/albums/${albumId}`)
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
      setMsg('Gagal mengunduh semua. Coba unduh satu per satu ya.')
    }
    setZipping(false)
  }

  const eventBg = album?.bg_path ? (
    <div className="event-bg" style={{ backgroundImage: `url(${album.bg_path})` }} />
  ) : null

  if (loadingAlbum) return <p className="sub" style={{ textAlign: 'center', marginTop: 40 }}>Memuat…</p>
  if (notFound || !album) {
    return (
      <div className="hero" style={{ marginTop: 40 }}>
        <BrandLogo className="hero-logo" />
        <h1 className="hero-title">Album tidak ditemukan</h1>
      </div>
    )
  }

  if (!nameReady) {
    return (
      <div>
        {eventBg}
        <div className="hero">
          <BrandLogo className="hero-logo" />
          <h1 className="hero-title">{album.name}</h1>
          <p className="hero-sub">Isi namamu dulu untuk melihat galeri.</p>
        </div>
        <div className="card">
          <form onSubmit={submitName}>
            <label>Namamu</label>
            <input type="text" placeholder="Nama kamu" value={viewerName} onChange={(e) => setViewerName(e.target.value)} autoFocus />
            <button className="btn" type="submit">Lihat galeri</button>
          </form>
        </div>
        <p className="sub" style={{ textAlign: 'center' }}>
          <Link className="link" href={`/a/${albumId}`}>← Ambil foto</Link>
        </p>
      </div>
    )
  }

  if (!revealed) {
    const diff = Math.max(0, revealMs - now)
    const d = Math.floor(diff / 86400000)
    const h = Math.floor((diff % 86400000) / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    const pad = (n) => String(n).padStart(2, '0')
    return (
      <div>
        {eventBg}
        <div className="hero">
          <div className="hero-logo">🎞️</div>
          <h1 className="hero-title">{album.name}</h1>
          <p className="hero-sub">
            {photos.length > 0
              ? 'Ini fotomu — masih terkunci. Semua foto akan terbuka bersamaan pada:'
              : 'Galeri masih terkunci. Foto akan dibuka pada:'}
          </p>
        </div>
        <div className="card">
          <div className="cd-grid">
            <div className="cd-box"><div className="cd-num">{d}</div><div className="cd-lbl">Hari</div></div>
            <div className="cd-box"><div className="cd-num">{pad(h)}</div><div className="cd-lbl">Jam</div></div>
            <div className="cd-box"><div className="cd-num">{pad(m)}</div><div className="cd-lbl">Menit</div></div>
            <div className="cd-box"><div className="cd-num">{pad(s)}</div><div className="cd-lbl">Detik</div></div>
          </div>
          <p className="sub" style={{ textAlign: 'center', margin: '14px 0 0', fontSize: 13 }}>
            {new Date(revealMs).toLocaleString('id-ID')}
          </p>
        </div>

        {photos.length > 0 ? (
          <div className="masonry blurred">
            {photos.map((p) => (
              <div className="m-item" key={p.id}>
                <img src={p.storage_path} alt="" loading="lazy" />
                <span className="m-lock">🔒</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="card">
            <p className="sub" style={{ margin: 0, textAlign: 'center' }}>
              Kamu belum mengunggah foto. <Link className="link" href={`/a/${albumId}`}>Ambil foto dulu →</Link>
            </p>
          </div>
        )}

        <p className="sub" style={{ textAlign: 'center', marginTop: 20 }}>
          <Link className="link" href={`/a/${albumId}`}>← Ambil foto</Link>
        </p>
      </div>
    )
  }

  return (
    <div>
      {eventBg}
      <div className="page-head">
        <h1 className="page-title">{album.name}</h1>
        <p className="page-sub">{photos.length} foto{album.visibility === 'private' ? ' (fotomu)' : ' terkumpul'}</p>
      </div>

      {album.visibility === 'private' ? (
        <p className="sub" style={{ fontSize: 13, marginTop: -6 }}>
          🔒 Galeri privat — tiap tamu hanya melihat foto yang ia unggah.
        </p>
      ) : null}

      {photos.length === 0 ? (
        <div className="card">
          <p className="sub" style={{ margin: 0 }}>Belum ada foto. Jadilah yang pertama!</p>
        </div>
      ) : (
        <>
          <button className="btn" onClick={downloadAll} disabled={zipping}>
            {zipping ? 'Menyiapkan…' : `⬇ Unduh semua (${photos.length})`}
          </button>
          {album.download_style === 'polaroid' ? (
            <p className="sub" style={{ fontSize: 12, textAlign: 'center', marginTop: 8 }}>Unduhan memakai bingkai polaroid.</p>
          ) : null}
          {msg ? <div className="error">{msg}</div> : null}
          <div className="masonry">
            {photos.map((p) => (
              <div className="m-item" key={p.id}>
                <button className="m-dl" onClick={() => downloadOne(p)} title="Unduh">⬇</button>
                <img src={p.storage_path} alt={p.uploader_name || 'foto'} loading="lazy" />
                {p.uploader_name ? <span className="m-chip">{p.uploader_name}</span> : null}
              </div>
            ))}
          </div>
        </>
      )}

      <p className="sub" style={{ textAlign: 'center', marginTop: 24 }}>
        <Link className="link" href={`/a/${albumId}`}>← Ambil foto lagi</Link>
      </p>
    </div>
  )
}

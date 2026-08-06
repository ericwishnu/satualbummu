'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import JSZip from 'jszip'

export default function Gallery({ params }) {
  const albumId = params.id
  const [album, setAlbum] = useState(null)
  const [loadingAlbum, setLoadingAlbum] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [photos, setPhotos] = useState([])
  const [loadedPhotos, setLoadedPhotos] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [zipping, setZipping] = useState(false)
  const [zipMsg, setZipMsg] = useState('')

  useEffect(() => {
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

  const revealTime = album?.reveal_at ? new Date(album.reveal_at).getTime() : null
  const revealed = !revealTime || now >= revealTime

  useEffect(() => {
    async function loadPhotos() {
      try {
        const res = await fetch(`/api/albums/${albumId}/photos`)
        if (res.ok) setPhotos(await res.json())
      } catch (e) {}
      setLoadedPhotos(true)
    }
    if (revealed && !loadedPhotos && album) loadPhotos()
  }, [revealed, loadedPhotos, album, albumId])

  async function downloadAll() {
    if (!photos.length) return
    setZipping(true)
    setZipMsg('')
    try {
      const zip = new JSZip()
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i]
        const resp = await fetch(p.storage_path)
        const blob = await resp.blob()
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
      setZipMsg('Gagal mengunduh semua. Coba unduh satu per satu ya.')
    }
    setZipping(false)
  }

  if (loadingAlbum) return <p className="sub">Memuat…</p>
  if (notFound || !album) {
    return (
      <div>
        <h1>Album tidak ditemukan</h1>
      </div>
    )
  }

  if (!revealed) {
    const diff = Math.max(0, revealTime - now)
    const d = Math.floor(diff / 86400000)
    const h = Math.floor((diff % 86400000) / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    const pad = (n) => String(n).padStart(2, '0')
    return (
      <div>
        <h1>{album.name}</h1>
        <div className="card countdown">
          <p className="sub">📸 Foto masih di dalam &quot;roll&quot;. Akan dibuka pada:</p>
          <div className="big">
            {d > 0 ? `${d} hari ` : ''}{pad(h)}:{pad(m)}:{pad(s)}
          </div>
          <p className="sub" style={{ marginTop: 16 }}>
            {new Date(revealTime).toLocaleString('id-ID')}
          </p>
        </div>
        <p className="sub" style={{ textAlign: 'center' }}>
          <Link className="link" href={`/a/${albumId}`}>← Ambil foto</Link>
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1>{album.name}</h1>
      <p className="sub">{photos.length} foto dari acara ini.</p>

      {photos.length === 0 ? (
        <div className="card">
          <p className="sub" style={{ margin: 0 }}>Belum ada foto. Jadilah yang pertama!</p>
        </div>
      ) : (
        <>
          <button className="btn" onClick={downloadAll} disabled={zipping}>
            {zipping ? 'Menyiapkan…' : `⬇ Unduh semua (${photos.length})`}
          </button>
          {zipMsg ? <div className="error">{zipMsg}</div> : null}
          <div className="grid">
            {photos.map((p) => (
              <div className="tile" key={p.id}>
                {p.uploader_name ? <span className="who">{p.uploader_name}</span> : null}
                <img src={p.storage_path} alt={p.uploader_name || 'foto'} loading="lazy" />
                <a className="dl" href={p.storage_path} download>Unduh</a>
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

'use client'

import { useState, useEffect } from 'react'

// Layar tayang (proyektor): tampilan bersih tanpa tombol.
// Foto diperbarui otomatis; yang terbaru tampil paling atas dengan animasi masuk.
export default function ScreenWall({ albumId }) {
  const [album, setAlbum] = useState(null)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let stopped = false

    async function loadAlbum() {
      try {
        const r = await fetch(`/api/albums/${albumId}`, { cache: 'no-store' })
        if (r.ok) { if (!stopped) setAlbum(await r.json()) }
        else if (!stopped) setNotFound(true)
      } catch (e) { if (!stopped) setNotFound(true) }
    }

    async function loadPhotos() {
      try {
        const r = await fetch(`/api/albums/${albumId}/photos`, { cache: 'no-store' })
        if (r.ok) {
          const data = await r.json()
          // Terbaru dulu, biar foto baru muncul di paling atas.
          data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          if (!stopped) setPhotos(data)
        }
      } catch (e) {}
      if (!stopped) setLoading(false)
    }

    loadAlbum()
    loadPhotos()
    const t = setInterval(loadPhotos, 7000) // pembaruan langsung
    return () => { stopped = true; clearInterval(t) }
  }, [albumId])

  if (loading) {
    return <div className="screen"><p className="screen-sub" style={{ textAlign: 'center', marginTop: 60 }}>Memuat…</p></div>
  }
  if (notFound || !album) {
    return <div className="screen"><p className="screen-sub" style={{ textAlign: 'center', marginTop: 60 }}>Album tidak ditemukan.</p></div>
  }

  return (
    <div className="screen">
      <div className="screen-head">
        <div className="screen-title font-serif">{album.name}</div>
        <div className="screen-sub">
          <span className="screen-live" /> {photos.length} foto · pembaruan langsung
        </div>
      </div>

      {photos.length === 0 ? (
        <p className="screen-sub" style={{ textAlign: 'center', marginTop: 50 }}>
          Belum ada foto. Foto akan muncul di sini secara langsung.
        </p>
      ) : (
        <div className="screen-grid">
          {photos.map((p) => (
            <div className="screen-item" key={p.id}>
              <img src={p.storage_path} alt={p.uploader_name || ''} loading="lazy" />
              {p.uploader_name ? <span className="screen-name font-script">{p.uploader_name}</span> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

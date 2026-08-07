'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import JSZip from 'jszip'
import { toPolaroidBlob } from '@/lib/polaroid'

// Halaman admin: tampilkan SEMUA foto album tanpa gerbang nama/reveal.
// Dilindungi middleware (hanya admin yang login bisa membuka).
export default function AdminGallery({ albumId }) {
  const [album, setAlbum] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [photos, setPhotos] = useState([])
  const [zipping, setZipping] = useState(false)
  const [msg, setMsg] = useState('')
  const [confirmId, setConfirmId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const ar = await fetch(`/api/albums/${albumId}`, { cache: 'no-store' })
        if (ar.ok) {
          setAlbum(await ar.json())
          const pr = await fetch(`/api/albums/${albumId}/photos`, { cache: 'no-store' })
          if (pr.ok) setPhotos(await pr.json())
        } else {
          setNotFound(true)
        }
      } catch (e) {
        setNotFound(true)
      }
      setLoading(false)
    }
    load()
  }, [albumId])

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

  async function deletePhoto(id) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/albums/${albumId}/photos/${id}`, { method: 'DELETE' })
      if (res.ok) setPhotos((prev) => prev.filter((p) => p.id !== id))
    } catch (e) {}
    setConfirmId(null)
    setDeleting(false)
  }

  if (loading) return <p className="sub" style={{ textAlign: 'center', marginTop: 60 }}>Memuat…</p>

  if (notFound || !album) {
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

  const hasBg = !!album.bg_path
  const heroStyle = hasBg ? { backgroundImage: `url(${album.bg_path})` } : undefined
  const heroClass = `ev-hero ${hasBg ? '' : 'noimg'}`

  return (
    <div className="ev compact">
      <div className={heroClass} style={heroStyle} />
      <div className="ev-body wide">
        <div className="ev-spacer" />
        <div className="ev-kicker">Tampilan Admin</div>
        <h1 className="ev-title font-serif">{album.name}</h1>
        <p className="ev-sub">{photos.length} foto — semua terlihat (mode admin)</p>

        {photos.length > 0 ? (
          <button className="ev-download" onClick={downloadAll} disabled={zipping}>
            {zipping ? 'Menyiapkan…' : `⬇  Unduh semua (${photos.length})`}
          </button>
        ) : null}
        {msg ? <div className="error" style={{ textAlign: 'center' }}>{msg}</div> : null}

        {photos.length === 0 ? (
          <p className="ev-sub" style={{ marginTop: 22 }}>Belum ada foto.</p>
        ) : (
          <div className="ev-masonry-wrap">
            <div className="masonry">
              {photos.map((p) => (
                <div className="m-item" key={p.id}>
                  <button className="m-del-btn" onClick={() => setConfirmId(p.id)} title="Hapus" aria-label="Hapus foto">🗑</button>
                  <button className="m-dl" onClick={() => downloadOne(p)} title="Unduh">⬇</button>
                  <img src={p.storage_path} alt={p.uploader_name || 'foto'} loading="lazy" />
                  {p.uploader_name ? <span className="m-chip">{p.uploader_name}</span> : null}
                  {confirmId === p.id ? (
                    <div className="pm-confirm">
                      <div className="q">Hapus foto ini?</div>
                      <div className="row">
                        <button className="pm-yes" disabled={deleting} onClick={() => deletePhoto(p.id)}>{deleting ? '…' : 'Hapus'}</button>
                        <button className="pm-no" onClick={() => setConfirmId(null)}>Batal</button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        <Link className="ev-gallery-link" href={`/a/${albumId}/kelola`}>← Kembali ke kelola</Link>
      </div>
    </div>
  )
}

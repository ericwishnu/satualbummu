'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { processImage, FILM_PRESETS, DEFAULT_PRESET } from '@/lib/filmPresets'
import { clientUUID } from '@/lib/uuid'

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
  const fileRef = useRef(null)

  const max = album && album.max_per_guest ? album.max_per_guest : null
  const remaining = max == null ? Infinity : Math.max(0, max - used)
  const limitReached = max != null && remaining <= 0

  useEffect(() => {
    const gid = getGuestId()
    setGuestId(gid)
    try {
      const n = localStorage.getItem('uploaderName')
      if (n) setName(n)
    } catch (e) {}

    async function load() {
      try {
        const res = await fetch(`/api/albums/${albumId}`)
        if (res.ok) {
          setAlbum(await res.json())
          const pr = await fetch(`/api/albums/${albumId}/photos`)
          if (pr.ok) {
            const photos = await pr.json()
            setUsed(photos.filter((p) => p.guest_id === gid).length)
          }
        }
      } catch (e) {}
      setLoading(false)
    }
    load()
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

  if (loading) return <p className="sub" style={{ textAlign: 'center', marginTop: 40 }}>Memuat…</p>
  if (!album) {
    return (
      <div className="hero" style={{ marginTop: 40 }}>
        <div className="hero-logo">📷</div>
        <h1 className="hero-title">Album tidak ditemukan</h1>
        <p className="hero-sub">Link mungkin salah, atau album sudah dihapus.</p>
      </div>
    )
  }

  const presetLabel = FILM_PRESETS[album.film_preset]?.label

  return (
    <div>
      <div className="hero">
        <div className="hero-logo">📷</div>
        <h1 className="hero-title">{album.name}</h1>
        <p className="hero-sub">
          Ambil momen dari acara ini. Fotomu akan tergabung dan muncul bareng-bareng di galeri.
        </p>
      </div>

      <div className="card">
        <label>Namamu</label>
        <input
          type="text"
          placeholder="Nama kamu"
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
        <label htmlFor="cam" className={`capture-tile ${limitReached ? 'disabled' : ''}`}>
          <span className="ic">{limitReached ? '🚫' : '📸'}</span>
          <span>{limitReached ? 'Jatah foto habis' : uploading ? 'Mengunggah…' : 'Ambil / Pilih Foto'}</span>
          {!limitReached && !uploading ? (
            <span className="hint">Dari kamera atau galeri • bisa banyak sekaligus</span>
          ) : null}
        </label>

        <div className="badgerow">
          {presetLabel ? <span className="count-pill">🎞️ {presetLabel}</span> : null}
          {max != null ? (
            <span className="count-pill">Sisa jatah: {remaining}/{max}</span>
          ) : used > 0 ? (
            <span className="count-pill">Terkirim: {used}</span>
          ) : null}
        </div>

        {err ? <div className="error" style={{ textAlign: 'center' }}>{err}</div> : null}
        {msg ? <div className="ok" style={{ textAlign: 'center' }}>{msg}</div> : null}

        {sentThumbs.length > 0 ? (
          <>
            <p className="sub" style={{ fontSize: 13, marginTop: 18, marginBottom: 0, textAlign: 'center' }}>
              Foto yang kamu kirim
            </p>
            <div className="sent-grid">
              {sentThumbs.slice(-8).map((u, i) => (
                <img key={i} src={u} alt="" />
              ))}
            </div>
          </>
        ) : null}
      </div>

      <Link className="btn secondary" href={`/a/${albumId}/galeri`}>Lihat galeri →</Link>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FILM_PRESETS, DEFAULT_PRESET } from '@/lib/filmPresets'

export default function Admin() {
  const router = useRouter()
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [revealAt, setRevealAt] = useState('')
  const [preset, setPreset] = useState(DEFAULT_PRESET)
  const [maxPerGuest, setMaxPerGuest] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const res = await fetch('/api/admin/albums')
    if (res.status === 401) {
      router.replace('/login')
      return
    }
    if (res.ok) setAlbums(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function createAlbum(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('Nama acara wajib diisi.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          reveal_at: revealAt ? new Date(revealAt).toISOString() : null,
          film_preset: preset,
          max_per_guest: maxPerGuest ? parseInt(maxPerGuest, 10) : null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 401) {
        router.replace('/login')
        return
      }
      if (!res.ok) {
        setError(data.error || 'Gagal membuat album.')
        setSaving(false)
        return
      }
      router.push(`/a/${data.id}/kelola`)
    } catch (e) {
      setError('Gagal terhubung ke server.')
      setSaving(false)
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
  }

  function fmtDate(iso) {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch (e) {
      return ''
    }
  }

  const totalPhotos = albums.reduce((s, a) => s + (Number(a.photo_count) || 0), 0)

  return (
    <div>
      <div className="topbar">
        <div className="brandmark">
          <div className="mark">📷</div>
          <div>
            <div className="brandname">SatuAlbumMu</div>
            <div className="brandrole">Panel admin</div>
          </div>
        </div>
        <button className="btn-ghost" onClick={logout}>Keluar</button>
      </div>

      <div className="statrow" style={{ marginBottom: 16 }}>
        <div className="stat">
          <div className="stat-num">{loading ? '…' : albums.length}</div>
          <div className="stat-lbl">Album</div>
        </div>
        <div className="stat">
          <div className="stat-num">{loading ? '…' : totalPhotos}</div>
          <div className="stat-lbl">Total foto</div>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Buat album baru</h2>
        <form onSubmit={createAlbum}>
          <label>Nama acara</label>
          <input type="text" placeholder="Ulang Tahun ke-30 / Trip Bali" value={name} onChange={(e) => setName(e.target.value)} />

          <label>Filter film (dipakai untuk semua foto)</label>
          <select value={preset} onChange={(e) => setPreset(e.target.value)}>
            {Object.entries(FILM_PRESETS).map(([key, p]) => (
              <option key={key} value={key}>{p.label}</option>
            ))}
          </select>

          <label>Batas foto per tamu (opsional)</label>
          <input type="number" min="1" placeholder="mis. 10 — kosongkan untuk tanpa batas" value={maxPerGuest} onChange={(e) => setMaxPerGuest(e.target.value)} />

          <label>Foto dibuka pada (opsional)</label>
          <input type="datetime-local" value={revealAt} onChange={(e) => setRevealAt(e.target.value)} />

          {error ? <div className="error">{error}</div> : null}
          <button className="btn" type="submit" disabled={saving}>
            {saving ? 'Membuat…' : '＋ Buat album'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="section-title">Semua album {loading ? '' : `(${albums.length})`}</h2>
        {loading ? (
          <p className="sub" style={{ margin: 0 }}>Memuat…</p>
        ) : albums.length === 0 ? (
          <p className="sub" style={{ margin: 0 }}>Belum ada album. Buat yang pertama di atas.</p>
        ) : (
          albums.map((a) => (
            <div className="album-row" key={a.id}>
              <div className="a-info">
                <div className="a-name">{a.name}</div>
                <div className="a-meta">
                  <span>📷 {a.photo_count} foto</span>
                  <span>{fmtDate(a.created_at)}</span>
                  <span>🎞️ {FILM_PRESETS[a.film_preset]?.label || a.film_preset}</span>
                </div>
              </div>
              <div className="album-actions">
                <Link className="btn-sm solid" href={`/a/${a.id}/kelola`}>Kelola</Link>
                <Link className="btn-sm" href={`/a/${a.id}/galeri`}>Galeri</Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

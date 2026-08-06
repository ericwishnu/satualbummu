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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}><span className="brand">Admin</span></h1>
        <button className="btn secondary" style={{ width: 'auto', marginTop: 0, padding: '8px 14px' }} onClick={logout}>
          Keluar
        </button>
      </div>
      <p className="sub" style={{ marginTop: 8 }}>Buat album baru dan lihat semua album yang terkumpul.</p>

      <div className="card">
        <h2>Buat album baru</h2>
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
            {saving ? 'Membuat…' : 'Buat album'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Semua album ({loading ? '…' : albums.length})</h2>
        {loading ? (
          <p className="sub" style={{ margin: 0 }}>Memuat…</p>
        ) : albums.length === 0 ? (
          <p className="sub" style={{ margin: 0 }}>Belum ada album. Buat yang pertama di atas.</p>
        ) : (
          albums.map((a) => (
            <div className="mine-item" key={a.id}>
              <span>
                <strong>{a.name}</strong>
                <br />
                <span className="sub" style={{ fontSize: 12 }}>
                  {a.photo_count} foto · {fmtDate(a.created_at)}
                </span>
              </span>
              <span>
                <Link href={`/a/${a.id}/kelola`}>Kelola</Link>
                {' · '}
                <Link href={`/a/${a.id}/galeri`}>Galeri</Link>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

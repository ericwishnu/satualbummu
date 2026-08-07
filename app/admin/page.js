'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FILM_PRESETS, DEFAULT_PRESET } from '@/lib/filmPresets'
import { REVEAL_OPTIONS } from '@/lib/reveal'
import { normalizeSlug } from '@/lib/slug'
import { BrandLogo, BrandName } from '@/components/BrandProvider'

export default function Admin() {
  const router = useRouter()
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [preset, setPreset] = useState(DEFAULT_PRESET)
  const [visibility, setVisibility] = useState('public')
  const [eventEnd, setEventEnd] = useState('')
  const [revealMode, setRevealMode] = useState('during')
  const [maxPerGuest, setMaxPerGuest] = useState('')
  const [downloadStyle, setDownloadStyle] = useState('raw')
  const [polaroidTitle, setPolaroidTitle] = useState('')
  const [polaroidSubtitle, setPolaroidSubtitle] = useState('')
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
    if (revealMode !== 'during' && !eventEnd) {
      setError('Isi waktu acara berakhir dulu, atau pilih "Selama acara".')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: normalizeSlug(slug),
          film_preset: preset,
          visibility,
          event_end: eventEnd ? new Date(eventEnd).toISOString() : null,
          reveal_mode: revealMode,
          max_per_guest: maxPerGuest ? parseInt(maxPerGuest, 10) : null,
          download_style: downloadStyle,
          polaroid_title: polaroidTitle.trim(),
          polaroid_subtitle: polaroidSubtitle.trim(),
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
          <BrandLogo className="mark" />
          <div>
            <div className="brandname"><BrandName /></div>
            <div className="brandrole">Panel admin</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link className="btn-ghost" href="/admin/branding">⚙ Branding</Link>
          <button className="btn-ghost" onClick={logout}>Keluar</button>
        </div>
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

          <label>Link kustom (slug) — opsional</label>
          <input type="text" placeholder="EricChelseaWedding" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <p className="sub" style={{ marginTop: 6, fontSize: 12 }}>Kosongkan untuk pakai link default. Bisa diubah nanti di Kelola.</p>

          <label>Filter film (dipakai untuk semua foto)</label>
          <select value={preset} onChange={(e) => setPreset(e.target.value)}>
            {Object.entries(FILM_PRESETS).map(([key, p]) => (
              <option key={key} value={key}>{p.label}</option>
            ))}
          </select>

          <label>Visibilitas galeri</label>
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
            <option value="public">Publik — semua tamu melihat semua foto</option>
            <option value="private">Privat — tiap tamu hanya melihat fotonya sendiri</option>
          </select>

          <label>Kapan acara berakhir</label>
          <input type="datetime-local" value={eventEnd} onChange={(e) => setEventEnd(e.target.value)} />

          <label>Kapan galeri dibuka</label>
          <select value={revealMode} onChange={(e) => setRevealMode(e.target.value)}>
            {REVEAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <p className="sub" style={{ marginTop: 6, fontSize: 12 }}>
            Sebelum dibuka, tiap tamu hanya melihat fotonya sendiri dalam keadaan blur. Unggahan tamu otomatis ditutup saat galeri dibuka.
          </p>

          <label>Batas foto per tamu (opsional)</label>
          <input type="number" min="1" placeholder="mis. 10 — kosongkan untuk tanpa batas" value={maxPerGuest} onChange={(e) => setMaxPerGuest(e.target.value)} />

          <label>Gaya unduhan</label>
          <select value={downloadStyle} onChange={(e) => setDownloadStyle(e.target.value)}>
            <option value="raw">Foto asli</option>
            <option value="polaroid">Bingkai polaroid</option>
          </select>

          {downloadStyle === 'polaroid' ? (
            <>
              <label>Caption polaroid — judul</label>
              <input type="text" maxLength={80} value={polaroidTitle} placeholder="mis. Eric & Claudia" onChange={(e) => setPolaroidTitle(e.target.value)} />
              <label>Caption polaroid — subjudul</label>
              <input type="text" maxLength={80} value={polaroidSubtitle} placeholder="mis. 12 Des 2026" onChange={(e) => setPolaroidSubtitle(e.target.value)} />
            </>
          ) : null}

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
                  <span>{a.visibility === 'private' ? '🔒 Privat' : '🌐 Publik'}</span>
                </div>
              </div>
              <div className="album-actions">
                <Link className="btn-sm solid" href={`/a/${a.id}/kelola`}>Kelola</Link>
                <Link className="btn-sm" href={`/a/${a.id}/semua`}>Galeri</Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

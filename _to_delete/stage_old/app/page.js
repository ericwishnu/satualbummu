'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { FILM_PRESETS, DEFAULT_PRESET } from '@/lib/filmPresets'

export default function Home() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [revealAt, setRevealAt] = useState('')
  const [preset, setPreset] = useState(DEFAULT_PRESET)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [mine, setMine] = useState([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('myAlbums')
      if (raw) setMine(JSON.parse(raw))
    } catch (e) {}
  }, [])

  async function createAlbum(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('Nama acara wajib diisi.')
      return
    }
    setSaving(true)
    const reveal = revealAt ? new Date(revealAt).toISOString() : null
    const { data, error: insErr } = await supabase
      .from('albums')
      .insert({ name: name.trim(), reveal_at: reveal, film_preset: preset })
      .select()
      .single()
    setSaving(false)
    if (insErr) {
      setError('Gagal membuat album: ' + insErr.message)
      return
    }
    try {
      const list = [{ id: data.id, name: data.name }, ...mine]
      localStorage.setItem('myAlbums', JSON.stringify(list))
    } catch (e) {}
    router.push(`/a/${data.id}/kelola`)
  }

  return (
    <div>
      <h1><span className="brand">SatuAlbumMu</span></h1>
      <p className="sub">Kamera sekali pakai digital. Bikin album, bagikan QR, foto muncul bareng-bareng.</p>

      <div className="card">
        <h2>Buat album baru</h2>
        <form onSubmit={createAlbum}>
          <label>Nama acara</label>
          <input
            type="text"
            placeholder="Ulang Tahun ke-30 / Trip Bali"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label>Filter film (dipakai untuk semua foto)</label>
          <select value={preset} onChange={(e) => setPreset(e.target.value)}>
            {Object.entries(FILM_PRESETS).map(([key, p]) => (
              <option key={key} value={key}>{p.label}</option>
            ))}
          </select>

          <label>Foto dibuka pada (opsional)</label>
          <input
            type="datetime-local"
            value={revealAt}
            onChange={(e) => setRevealAt(e.target.value)}
          />
          <p className="sub" style={{ marginTop: 6, fontSize: 13 }}>
            Kosongkan kalau ingin foto langsung bisa dilihat. Kalau diisi, foto baru muncul di galeri setelah waktu ini.
          </p>
          {error ? <div className="error">{error}</div> : null}
          <button className="btn" type="submit" disabled={saving}>
            {saving ? 'Membuat…' : 'Buat album'}
          </button>
        </form>
      </div>

      {mine.length > 0 ? (
        <div className="card">
          <h2>Album kamu</h2>
          {mine.map((a) => (
            <div className="mine-item" key={a.id}>
              <span>{a.name}</span>
              <span>
                <Link href={`/a/${a.id}/kelola`}>Kelola</Link>
                {' · '}
                <Link href={`/a/${a.id}/galeri`}>Galeri</Link>
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

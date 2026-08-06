'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Branding() {
  const router = useRouter()
  const [brandName, setBrandName] = useState('')
  const [accent, setAccent] = useState('#f4f4f5')
  const [logoText, setLogoText] = useState('')
  const [logo, setLogo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/settings')
      if (res.status === 401) {
        router.replace('/login')
        return
      }
      if (res.ok) {
        const s = await res.json()
        setBrandName(s.brand_name || '')
        setAccent(s.accent || '#f4f4f5')
        setLogoText(s.logo_text || '')
        setLogo(s.logo_path || null)
      }
      setLoading(false)
    }
    load()
  }, [])

  // Pratinjau warna aksen langsung.
  useEffect(() => {
    if (/^#[0-9a-fA-F]{6}$/.test(accent)) {
      document.documentElement.style.setProperty('--accent', accent)
    }
  }, [accent])

  async function save(e) {
    e.preventDefault()
    setErr('')
    setMsg('')
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_name: brandName.trim(), accent, logo_text: logoText.trim() }),
      })
      if (res.status === 401) { router.replace('/login'); return }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setErr(d.error || 'Gagal menyimpan.')
        setSaving(false)
        return
      }
      setMsg('Tersimpan ✓ — muat ulang halaman untuk melihat brand baru di mana-mana.')
    } catch (e) {
      setErr('Gagal terhubung ke server.')
    }
    setSaving(false)
  }

  async function uploadLogo(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setErr('')
    setMsg('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/settings/logo', { method: 'POST', body: fd })
      if (res.status === 401) { router.replace('/login'); return }
      const s = await res.json().catch(() => ({}))
      if (!res.ok) { setErr(s.error || 'Gagal unggah logo.'); return }
      setLogo(s.logo_path || null)
      setMsg('Logo diperbarui ✓ — muat ulang untuk melihat di mana-mana.')
    } catch (e) {
      setErr('Gagal unggah logo.')
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  async function removeLogo() {
    setErr('')
    setMsg('')
    try {
      const res = await fetch('/api/settings/logo', { method: 'DELETE' })
      if (res.ok) {
        setLogo(null)
        setMsg('Logo dihapus ✓')
      }
    } catch (e) {}
  }

  if (loading) return <p className="sub" style={{ textAlign: 'center', marginTop: 40 }}>Memuat…</p>

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Branding</h1>
        <p className="page-sub">Sesuaikan nama, warna, dan logo aplikasimu.</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div className="mark" style={{ width: 52, height: 52, fontSize: 26 }}>
            {logo ? (
              <img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
            ) : logoText ? (
              <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: 0.5 }}>{logoText}</span>
            ) : '📷'}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{brandName || 'SatuAlbumMu'}</div>
            <div className="sub" style={{ fontSize: 12 }}>Pratinjau</div>
          </div>
        </div>
      </div>

      <div className="card">
        <form onSubmit={save}>
          <label>Nama brand</label>
          <input type="text" value={brandName} maxLength={80} placeholder="Nama aplikasimu" onChange={(e) => setBrandName(e.target.value)} />

          <label>Warna aksen</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(accent) ? accent : '#f4f4f5'} onChange={(e) => setAccent(e.target.value)} style={{ width: 54, height: 46, padding: 4, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10 }} />
            <input type="text" value={accent} onChange={(e) => setAccent(e.target.value)} placeholder="#f4f4f5" style={{ flex: 1 }} />
          </div>

          <label>Logo teks / inisial (kalau tidak pakai gambar)</label>
          <input type="text" value={logoText} maxLength={12} placeholder="mis. E & C" onChange={(e) => setLogoText(e.target.value)} />

          {err ? <div className="error">{err}</div> : null}
          {msg ? <div className="ok">{msg}</div> : null}
          <button className="btn" type="submit" disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan brand & warna'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="section-title">Logo</h2>
        <p className="sub" style={{ fontSize: 13 }}>Gambar persegi paling bagus (PNG/JPG/WebP/SVG). Kalau kosong, dipakai teks/ikon.</p>
        <input ref={fileRef} id="logo" type="file" accept="image/*" onChange={uploadLogo} style={{ display: 'none' }} />
        <label htmlFor="logo" className="btn secondary" style={{ cursor: 'pointer' }}>⬆ Unggah logo</label>
        {logo ? (
          <button className="btn secondary" onClick={removeLogo} style={{ marginTop: 10 }}>Hapus logo</button>
        ) : null}
      </div>

      <p className="sub" style={{ textAlign: 'center' }}>
        <Link className="link" href="/admin">← Kembali ke admin</Link>
      </p>
    </div>
  )
}

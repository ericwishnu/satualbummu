'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { QRCodeCanvas } from 'qrcode.react'
import { FILM_PRESETS } from '@/lib/filmPresets'

function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function Kelola({ params }) {
  const albumId = params.id
  const [album, setAlbum] = useState(null)
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState(false)
  const [photos, setPhotos] = useState([])
  const [loadingStats, setLoadingStats] = useState(true)

  const [revealInput, setRevealInput] = useState('')
  const [maxInput, setMaxInput] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [settingsErr, setSettingsErr] = useState('')

  const qrWrapRef = useRef(null)

  async function loadStats() {
    setLoadingStats(true)
    try {
      const res = await fetch(`/api/albums/${albumId}/photos`)
      if (res.ok) setPhotos(await res.json())
    } catch (e) {}
    setLoadingStats(false)
  }

  useEffect(() => {
    setOrigin(window.location.origin)
    async function loadAlbum() {
      try {
        const res = await fetch(`/api/albums/${albumId}`)
        if (res.ok) {
          const data = await res.json()
          setAlbum(data)
          setRevealInput(toLocalInput(data?.reveal_at))
          setMaxInput(data?.max_per_guest ? String(data.max_per_guest) : '')
        }
      } catch (e) {}
    }
    loadAlbum()
    loadStats()
  }, [albumId])

  const captureUrl = origin ? `${origin}/a/${albumId}` : ''

  const total = photos.length
  const contributors = new Set(photos.map((p) => p.guest_id || p.uploader_name || 'anon')).size
  const byName = {}
  for (const p of photos) {
    const key = p.uploader_name || 'Tanpa nama'
    byName[key] = (byName[key] || 0) + 1
  }
  const leaderboard = Object.entries(byName).sort((a, b) => b[1] - a[1]).slice(0, 5)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(captureUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (e) {}
  }

  function downloadQR() {
    const canvas = qrWrapRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'qr-satualbummu.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  async function saveSettings(e) {
    e.preventDefault()
    setSettingsErr('')
    setSavedMsg('')
    setSavingSettings(true)
    try {
      const res = await fetch(`/api/albums/${albumId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reveal_at: revealInput ? new Date(revealInput).toISOString() : null,
          max_per_guest: maxInput ? parseInt(maxInput, 10) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSettingsErr(data.error || 'Gagal menyimpan.')
        setSavingSettings(false)
        return
      }
      setAlbum(data)
      setSavedMsg('Tersimpan ✓')
      setTimeout(() => setSavedMsg(''), 2000)
    } catch (e) {
      setSettingsErr('Gagal terhubung ke server.')
    }
    setSavingSettings(false)
  }

  const presetLabel = album ? (FILM_PRESETS[album.film_preset]?.label || '—') : '…'

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">{album ? album.name : 'Album'}</h1>
        <p className="page-sub">Bagikan ke tamu — mereka scan lalu langsung motret.</p>
      </div>

      <div className="card">
        <div className="qr-frame" ref={qrWrapRef}>
          {captureUrl ? <QRCodeCanvas value={captureUrl} size={210} includeMargin /> : null}
        </div>
        <label>Link untuk tamu</label>
        <div className="copyrow">
          <span className="mono">{captureUrl || '…'}</span>
          <button className="btn" onClick={copyLink}>{copied ? '✓' : 'Salin'}</button>
        </div>
        <button className="btn secondary" onClick={downloadQR} style={{ marginTop: 10 }}>
          ⬇ Unduh QR (PNG)
        </button>
      </div>

      <div className="card">
        <h2 className="section-title">Statistik</h2>
        <div className="statrow">
          <div className="stat">
            <div className="stat-num">{loadingStats ? '…' : total}</div>
            <div className="stat-lbl">Foto masuk</div>
          </div>
          <div className="stat">
            <div className="stat-num">{loadingStats ? '…' : contributors}</div>
            <div className="stat-lbl">Kontributor</div>
          </div>
        </div>

        {leaderboard.length > 0 ? (
          <>
            <p className="sub" style={{ marginTop: 16, marginBottom: 6, fontSize: 13 }}>Paling banyak motret:</p>
            {leaderboard.map(([nm, c]) => (
              <div className="mine-item" key={nm}>
                <span>{nm}</span>
                <span className="count-pill">{c} foto</span>
              </div>
            ))}
          </>
        ) : null}

        <button className="btn secondary" onClick={loadStats} style={{ marginTop: 14 }}>
          ↻ Segarkan statistik
        </button>
      </div>

      <div className="card">
        <h2 className="section-title">Pengaturan</h2>
        <p className="sub" style={{ fontSize: 13 }}>Filter foto album ini: <strong>{presetLabel}</strong></p>
        <form onSubmit={saveSettings}>
          <label>Foto dibuka pada (kosongkan = langsung tampil)</label>
          <input
            type="datetime-local"
            value={revealInput}
            onChange={(e) => setRevealInput(e.target.value)}
          />
          <label>Batas foto per tamu (kosongkan = tanpa batas)</label>
          <input
            type="number"
            min="1"
            placeholder="mis. 10"
            value={maxInput}
            onChange={(e) => setMaxInput(e.target.value)}
          />
          {settingsErr ? <div className="error">{settingsErr}</div> : null}
          {savedMsg ? <div className="ok">{savedMsg}</div> : null}
          <button className="btn" type="submit" disabled={savingSettings}>
            {savingSettings ? 'Menyimpan…' : 'Simpan pengaturan'}
          </button>
        </form>
      </div>

      <div className="card">
        <Link className="btn secondary" href={`/a/${albumId}/galeri`}>Lihat galeri</Link>
        <Link className="btn secondary" href={`/a/${albumId}`} style={{ marginTop: 10 }}>Halaman ambil foto</Link>
      </div>

      <p className="sub" style={{ textAlign: 'center' }}>
        <Link className="link" href="/admin">← Kembali ke admin</Link>
      </p>
    </div>
  )
}

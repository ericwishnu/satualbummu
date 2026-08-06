'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { QRCodeCanvas } from 'qrcode.react'
import { FILM_PRESETS } from '@/lib/filmPresets'
import { REVEAL_OPTIONS } from '@/lib/reveal'

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

  const [eventEnd, setEventEnd] = useState('')
  const [revealMode, setRevealMode] = useState('during')
  const [visibility, setVisibility] = useState('public')
  const [downloadStyle, setDownloadStyle] = useState('raw')
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
          setEventEnd(toLocalInput(data?.event_end))
          setRevealMode(data?.reveal_mode || 'during')
          setVisibility(data?.visibility || 'public')
          setDownloadStyle(data?.download_style || 'raw')
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
    if (revealMode !== 'during' && !eventEnd) {
      setSettingsErr('Isi waktu acara berakhir dulu, atau pilih "Selama acara".')
      return
    }
    setSavingSettings(true)
    try {
      const res = await fetch(`/api/albums/${albumId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_end: eventEnd ? new Date(eventEnd).toISOString() : null,
          reveal_mode: revealMode,
          visibility,
          download_style: downloadStyle,
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

          <label>Batas foto per tamu (kosongkan = tanpa batas)</label>
          <input type="number" min="1" placeholder="mis. 10" value={maxInput} onChange={(e) => setMaxInput(e.target.value)} />

          <label>Gaya unduhan</label>
          <select value={downloadStyle} onChange={(e) => setDownloadStyle(e.target.value)}>
            <option value="raw">Foto asli</option>
            <option value="polaroid">Bingkai polaroid</option>
          </select>

          {settingsErr ? <div className="error">{settingsErr}</div> : null}
          {savedMsg ? <div className="ok">{savedMsg}</div> : null}
          <button className="btn" type="submit" disabled={savingSettings}>
            {savingSettings ? 'Menyimpan…' : 'Simpan pengaturan'}
          </button>
        </form>
      </div>

      <div className="card">
        <Link className="btn" href={`/a/${albumId}/cetak`}>🖨 Kartu QR untuk dicetak</Link>
        <Link className="btn secondary" href={`/a/${albumId}/galeri`} style={{ marginTop: 10 }}>Lihat galeri</Link>
        <Link className="btn secondary" href={`/a/${albumId}`} style={{ marginTop: 10 }}>Halaman ambil foto</Link>
      </div>

      <p className="sub" style={{ textAlign: 'center' }}>
        <Link className="link" href="/admin">← Kembali ke admin</Link>
      </p>
    </div>
  )
}

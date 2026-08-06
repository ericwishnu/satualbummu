'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { QRCodeCanvas } from 'qrcode.react'
import { supabase } from '@/lib/supabaseClient'

export default function Kelola({ params }) {
  const albumId = params.id
  const [album, setAlbum] = useState(null)
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState(false)
  const qrWrapRef = useRef(null)

  useEffect(() => {
    setOrigin(window.location.origin)
    supabase.from('albums').select('*').eq('id', albumId).single().then(({ data }) => setAlbum(data))
  }, [albumId])

  const captureUrl = origin ? `${origin}/a/${albumId}` : ''

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

  return (
    <div>
      <h1>{album ? album.name : 'Album'}</h1>
      <p className="sub">Bagikan QR atau link ini ke tamu. Mereka tinggal scan lalu langsung motret.</p>

      <div className="card">
        <div className="qrbox" ref={qrWrapRef}>
          {captureUrl ? <QRCodeCanvas value={captureUrl} size={220} includeMargin /> : null}
        </div>
        <button className="btn secondary" onClick={downloadQR} style={{ marginTop: 14 }}>
          ⬇ Unduh QR (PNG)
        </button>
      </div>

      <div className="card">
        <label>Link untuk tamu</label>
        <p className="mono">{captureUrl || '…'}</p>
        <button className="btn" onClick={copyLink}>
          {copied ? '✓ Tersalin' : 'Salin link'}
        </button>
      </div>

      <div className="card">
        <Link className="btn secondary" href={`/a/${albumId}/galeri`}>Lihat galeri</Link>
        <Link className="btn secondary" href={`/a/${albumId}`} style={{ marginTop: 10 }}>Halaman ambil foto</Link>
      </div>

      <p className="sub" style={{ textAlign: 'center' }}>
        <Link className="link" href="/">← Kembali</Link>
      </p>
    </div>
  )
}

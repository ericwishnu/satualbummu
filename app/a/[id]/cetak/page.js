'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { QRCodeCanvas } from 'qrcode.react'
import { useBrand } from '@/components/BrandProvider'

export default function Cetak({ params }) {
  const albumId = params.id
  const brand = useBrand()
  const [album, setAlbum] = useState(null)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
    fetch(`/api/albums/${albumId}`).then((r) => (r.ok ? r.json() : null)).then((d) => setAlbum(d)).catch(() => {})
  }, [albumId])

  const captureUrl = origin ? `${origin}/a/${albumId}` : ''

  return (
    <div className="cetak-wrap">
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Link className="link" href={`/a/${albumId}/kelola`}>← Kembali</Link>
        <button className="btn" style={{ width: 'auto', marginTop: 0, padding: '10px 16px' }} onClick={() => window.print()}>
          🖨 Cetak / Simpan PDF
        </button>
      </div>

      <div className="print-card">
        <div className="pc-brand">
          {brand?.logo ? <img src={brand.logo} alt="" /> : <span>📷</span>}
          <span>{brand?.name || 'SatuAlbumMu'}</span>
        </div>
        <div className="pc-title">{album ? album.name : ' '}</div>
        <div className="pc-qr">
          {captureUrl ? <QRCodeCanvas value={captureUrl} size={230} includeMargin /> : null}
        </div>
        <div className="pc-cta">Scan untuk ikut memotret 📸</div>
        <div className="pc-steps">
          Foto kamu otomatis masuk ke galeri acara.<br />
          Tanpa aplikasi — cukup buka lewat kamera HP.
        </div>
        <div className="pc-link">{captureUrl}</div>
      </div>

      <p className="no-print sub" style={{ textAlign: 'center', marginTop: 14, fontSize: 13 }}>
        Tips: saat mencetak, pilih ukuran kertas kecil (A5/A6) atau "Simpan sebagai PDF".
      </p>
    </div>
  )
}

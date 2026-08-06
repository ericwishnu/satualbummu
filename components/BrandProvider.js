'use client'

import { createContext, useContext } from 'react'

const BrandCtx = createContext({ name: 'SatuAlbumMu', logo: null, logoText: null })

export function useBrand() {
  return useContext(BrandCtx)
}

export default function BrandProvider({ brand, children }) {
  return <BrandCtx.Provider value={brand}>{children}</BrandCtx.Provider>
}

// Logo brand: gambar > teks/inisial > emoji kamera.
export function BrandLogo({ className = 'hero-logo' }) {
  const b = useBrand()
  return (
    <div className={className}>
      {b?.logo ? (
        <img
          src={b.logo}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
        />
      ) : b?.logoText ? (
        <span style={{ fontSize: '0.5em', fontWeight: 800, letterSpacing: '0.5px', lineHeight: 1 }}>
          {b.logoText}
        </span>
      ) : (
        '📷'
      )}
    </div>
  )
}

export function BrandName() {
  const b = useBrand()
  return <>{b?.name || 'SatuAlbumMu'}</>
}

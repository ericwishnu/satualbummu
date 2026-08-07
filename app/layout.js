import './globals.css'
import { getSettings } from '@/lib/settings'
import BrandProvider from '@/components/BrandProvider'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const s = await getSettings()
  return {
    title: s.brand_name || 'SatuAlbumMu',
    description: 'Kamera sekali pakai digital untuk acaramu',
  }
}

export default async function RootLayout({ children }) {
  const s = await getSettings()
  const css = `:root{--accent:${s.accent};--accent-dark:${s.accent_dark};}`
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600;1,700&family=Dancing+Script:wght@600;700&family=Share+Tech+Mono&display=swap"
        />
      </head>
      <body>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <BrandProvider brand={{ name: s.brand_name, logo: s.logo_path, logoText: s.logo_text }}>
          <main className="container">{children}</main>
        </BrandProvider>
      </body>
    </html>
  )
}

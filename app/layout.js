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
      <body>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <BrandProvider brand={{ name: s.brand_name, logo: s.logo_path, logoText: s.logo_text }}>
          <main className="container">{children}</main>
        </BrandProvider>
      </body>
    </html>
  )
}

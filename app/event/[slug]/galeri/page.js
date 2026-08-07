import { headers } from 'next/headers'
import { getPool } from '@/lib/db'
import { resolveAlbum } from '@/lib/albums'
import { metaFor, langFromAcceptLanguage } from '@/lib/i18n'
import GalleryPage from '@/components/GalleryPage'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const h = headers()
  const lang = langFromAcceptLanguage(h.get('accept-language'))
  let album = null
  try {
    const pool = getPool()
    album = await resolveAlbum(pool, params.slug, 'name')
  } catch (e) {}
  const meta = metaFor(lang, album?.name)
  return {
    title: meta.title,
    description: meta.description,
    // Galeri di balik gerbang nama — jangan diindeks mesin pencari.
    robots: { index: false, follow: false },
  }
}

// Galeri via slug kustom, mis. /event/EricChelseaWedding/galeri
export default function Page({ params }) {
  return <GalleryPage albumId={params.slug} />
}

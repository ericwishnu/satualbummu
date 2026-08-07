import { headers } from 'next/headers'
import { getPool } from '@/lib/db'
import { resolveAlbum } from '@/lib/albums'
import { metaFor, langFromAcceptLanguage } from '@/lib/i18n'
import CapturePage from '@/components/CapturePage'

export const dynamic = 'force-dynamic'

function originFromHeaders(h) {
  const host = h.get('x-forwarded-host') || h.get('host')
  const proto = h.get('x-forwarded-proto') || 'https'
  return host ? `${proto}://${host}` : ''
}

// SEO per-acara: judul & deskripsi ikut nama acara, gambar OG = background acara.
export async function generateMetadata({ params }) {
  const h = headers()
  const lang = langFromAcceptLanguage(h.get('accept-language'))
  const origin = originFromHeaders(h)

  let album = null
  try {
    const pool = getPool()
    album = await resolveAlbum(pool, params.slug, 'name, slug, bg_path')
  } catch (e) {}

  const meta = metaFor(lang, album?.name)
  const url = origin && album?.slug ? `${origin}/event/${album.slug}` : undefined
  const image = origin && album?.bg_path ? `${origin}${album.bg_path}` : undefined

  const og = {
    title: meta.title,
    description: meta.description,
    type: 'website',
    ...(url ? { url } : {}),
    ...(image ? { images: [{ url: image }] } : {}),
  }

  return {
    title: meta.title,
    description: meta.description,
    ...(url ? { alternates: { canonical: url } } : {}),
    openGraph: og,
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: meta.title,
      description: meta.description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

// Halaman tamu via slug kustom, mis. /event/EricChelseaWedding
export default function Page({ params }) {
  return <CapturePage albumId={params.slug} />
}

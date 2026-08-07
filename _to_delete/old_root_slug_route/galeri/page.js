import GalleryPage from '@/components/GalleryPage'

export const dynamic = 'force-dynamic'

// Galeri via slug kustom, mis. /EricChelseaWedding/galeri
export default function Page({ params }) {
  return <GalleryPage albumId={params.slug} />
}

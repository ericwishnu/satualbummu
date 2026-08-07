import CapturePage from '@/components/CapturePage'

export const dynamic = 'force-dynamic'

// Halaman tamu via slug kustom, mis. /event/EricChelseaWedding
export default function Page({ params }) {
  return <CapturePage albumId={params.slug} />
}

import CapturePage from '@/components/CapturePage'

export const dynamic = 'force-dynamic'

// Halaman tamu via slug kustom, mis. /EricChelseaWedding
export default function Page({ params }) {
  return <CapturePage albumId={params.slug} />
}

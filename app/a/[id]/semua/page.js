import AdminGallery from '@/components/AdminGallery'

export const dynamic = 'force-dynamic'

// Halaman admin "semua foto" — dilindungi middleware.
export default function Page({ params }) {
  return <AdminGallery albumId={params.id} />
}

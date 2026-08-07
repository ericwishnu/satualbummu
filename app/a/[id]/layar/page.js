import ScreenWall from '@/components/ScreenWall'

export const dynamic = 'force-dynamic'

// Layar tayang (proyektor) — dilindungi middleware.
export default function Page({ params }) {
  return <ScreenWall albumId={params.id} />
}

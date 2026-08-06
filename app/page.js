import { redirect } from 'next/navigation'

// Beranda diarahkan ke portal admin. Tamu tidak membuka halaman ini —
// mereka memakai link/QR album langsung (/a/<id>).
export default function Home() {
  redirect('/admin')
}

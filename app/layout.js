import './globals.css'

export const metadata = {
  title: 'SatuAlbumMu',
  description: 'Kamera sekali pakai digital untuk acaramu',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <main className="container">{children}</main>
      </body>
    </html>
  )
}

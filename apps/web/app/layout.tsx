import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dubbing With Your Friends',
  description: 'Mira un clip. Dóblalo. Vota el mejor doblaje.',
}

export const viewport: Viewport = {
  themeColor: '#09090b',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // `dark` fijo: el juego es dark-mode-only por diseño (party game)
    <html lang="es" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}

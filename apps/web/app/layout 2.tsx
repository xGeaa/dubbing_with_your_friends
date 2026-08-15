import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dubbing With Your Friends',
  description: 'Watch a clip. Dub it. Vote for the best one.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-50 antialiased">
        {children}
      </body>
    </html>
  )
}

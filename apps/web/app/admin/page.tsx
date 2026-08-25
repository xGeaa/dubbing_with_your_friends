// apps/web/app/admin/page.tsx
// Página de admin — server component con gate de contraseña.
// Acceder en: /admin?key=<ADMIN_KEY>
//
// En .env.local añade: ADMIN_KEY=tu_clave_secreta
// En producción en Vercel añade la misma variable de entorno (server-only).

import { listClips } from './actions'
import { ClipManagerClient } from './ClipManagerClient'

interface AdminPageProps {
  searchParams: { key?: string }
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const adminKey = process.env.ADMIN_KEY
  const providedKey = searchParams.key

  if (!adminKey || providedKey !== adminKey) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold">🔒 Admin</h1>
          <p className="text-gray-400 text-sm">
            Accede con <code className="bg-gray-800 px-1 rounded">/admin?key=TU_CLAVE</code>
          </p>
        </div>
      </main>
    )
  }

  const clips = await listClips()

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">🎬 Clip Manager</h1>
            <p className="text-gray-400 text-sm mt-1">
              {clips.length} clips en la base de datos
            </p>
          </div>
        </header>

        <ClipManagerClient initialClips={clips} adminKey={providedKey} />
      </div>
    </main>
  )
}

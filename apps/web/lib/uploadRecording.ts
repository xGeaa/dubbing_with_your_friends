const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3001'

interface UploadArgs {
  blob: Blob
  roomCode: string
  playerId: string
  /** Identifica la ronda: el servidor guarda en `<sala>/<sesión>/<jugador>`. */
  sessionId: string
}

/**
 * Sube la grabación a `POST /audio/upload` y devuelve la URL pública de
 * Supabase Storage. El endpoint usa `upsert`, así que regrabar sobrescribe.
 */
export async function uploadRecording({
  blob,
  roomCode,
  playerId,
  sessionId,
}: UploadArgs): Promise<string> {
  const extension = blob.type.includes('mp4') ? 'm4a' : 'webm'
  const formData = new FormData()
  formData.append('audioBlob', blob, `recording.${extension}`)
  formData.append('roomCode', roomCode)
  formData.append('playerId', playerId)
  formData.append('sessionId', sessionId)

  let response: Response
  try {
    response = await fetch(`${SERVER_URL}/audio/upload`, {
      method: 'POST',
      body: formData,
    })
  } catch {
    throw new Error(
      'No hemos podido contactar con el servidor para subir tu grabación.'
    )
  }

  if (!response.ok) {
    throw new Error('El servidor ha rechazado la grabación. Inténtalo de nuevo.')
  }

  const data = (await response.json()) as { url?: string }
  if (!data.url) throw new Error('El servidor no ha devuelto la URL del audio.')

  return data.url
}

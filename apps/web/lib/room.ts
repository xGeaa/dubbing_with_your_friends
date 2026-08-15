export const ROOM_CODE_LENGTH = 4

/** El servidor rechaza `room:start` con menos de 2 jugadores. */
export const MIN_PLAYERS_TO_START = 2

/**
 * El servidor genera los códigos con `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`
 * (sin O, 0, I ni 1 por ser confusos), así que aceptamos letras y dígitos.
 */
const ROOM_CODE_CHARS = /[^A-Z0-9]/g

/** Deja solo caracteres válidos en mayúsculas y recorta a 4. */
export function normalizeRoomCode(raw: string): string {
  return raw.toUpperCase().replace(ROOM_CODE_CHARS, '').slice(0, ROOM_CODE_LENGTH)
}

export function isValidRoomCode(code: string): boolean {
  return new RegExp(`^[A-Z0-9]{${ROOM_CODE_LENGTH}}$`).test(code)
}

/** URL absoluta de invitación a la sala (para copiar al portapapeles). */
export function buildInviteUrl(code: string): string {
  if (typeof window === 'undefined') return `/room/${code}`
  return `${window.location.origin}/room/${code}`
}

/** Copia texto al portapapeles con fallback para navegadores sin permisos. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }

    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}

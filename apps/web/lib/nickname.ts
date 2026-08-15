/**
 * Nicknames aleatorios y persistencia local.
 *
 * El servidor también genera un nickname si se envía vacío, pero lo generamos
 * aquí para poder mostrárselo al jugador antes de entrar en la sala.
 */

const ADJECTIVES = [
  'Bold',
  'Swift',
  'Calm',
  'Bright',
  'Wild',
  'Cool',
  'Brave',
  'Keen',
] as const

const ANIMALS = [
  'Fox',
  'Bear',
  'Wolf',
  'Hawk',
  'Lion',
  'Deer',
  'Owl',
  'Cat',
] as const

function pick<T>(list: readonly T[], fallback: T): T {
  return list[Math.floor(Math.random() * list.length)] ?? fallback
}

export function randomNickname(): string {
  return `${pick(ADJECTIVES, 'Bold')}${pick(ANIMALS, 'Fox')}`
}

const NICKNAME_KEY = 'dub:nickname'

/** Guarda el nickname para poder reconectar tras un refresco de página. */
export function storeNickname(nickname: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(NICKNAME_KEY, nickname)
  } catch {
    // Modo incógnito o storage lleno: no es crítico, seguimos sin persistir.
  }
}

/** Devuelve el nickname guardado o uno nuevo aleatorio. */
export function loadNickname(): string {
  if (typeof window === 'undefined') return randomNickname()
  try {
    return window.localStorage.getItem(NICKNAME_KEY) || randomNickname()
  } catch {
    return randomNickname()
  }
}

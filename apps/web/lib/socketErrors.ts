/**
 * El backend emite `room:error` con mensajes en inglés.
 * Aquí los traducimos a mensajes de usuario en español.
 */
export function translateRoomError(message: string): string {
  const raw = message.trim()

  if (/not found/i.test(raw)) return 'No existe ninguna sala con ese código.'
  if (/already in progress/i.test(raw))
    return 'La partida de esa sala ya ha empezado.'
  if (/invalid room code/i.test(raw))
    return 'El código de sala debe tener 4 caracteres.'
  if (/only the host/i.test(raw))
    return 'Solo el anfitrión puede empezar la partida.'
  if (/at least 2 players/i.test(raw))
    return 'Necesitáis al menos 2 jugadores para empezar.'
  if (/could not create/i.test(raw))
    return 'No se ha podido crear la sala. Inténtalo de nuevo.'
  if (/could not join/i.test(raw))
    return 'No se ha podido entrar en la sala. Inténtalo de nuevo.'
  if (/could not start/i.test(raw))
    return 'No se ha podido empezar la partida. Inténtalo de nuevo.'

  return raw || 'Ha ocurrido un error inesperado.'
}

export const CONNECTION_ERROR =
  'No hemos podido conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.'

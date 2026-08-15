import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null
let disconnectTimer: ReturnType<typeof setTimeout> | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3001', {
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })
  }
  return socket
}

/**
 * Desconecta con un pequeño retardo cancelable.
 *
 * En desarrollo React 18 monta cada componente dos veces (StrictMode), así que
 * un `disconnect()` inmediato en el cleanup provocaba desconectar y reconectar
 * con un socket.id nuevo: el servidor veía dos jugadores distintos y el lobby
 * mostraba un jugador fantasma. Con el retardo, el remount cancela la
 * desconexión y se conserva la misma sesión.
 */
export function disconnectSocketSoon(delayMs = 150): void {
  const current = getSocket()
  if (disconnectTimer) clearTimeout(disconnectTimer)
  disconnectTimer = setTimeout(() => {
    disconnectTimer = null
    current.disconnect()
  }, delayMs)
}

/** Cancela una desconexión programada (p. ej. al volver a montar la sala). */
export function cancelPendingDisconnect(): void {
  if (!disconnectTimer) return
  clearTimeout(disconnectTimer)
  disconnectTimer = null
}

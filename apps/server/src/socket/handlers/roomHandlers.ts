import type { Server, Socket } from 'socket.io'
import type { RoomManager } from '../../rooms/RoomManager'
import {
  ROOM_EVENTS,
  type RoomCreatePayload,
  type RoomJoinPayload,
} from '@dub/shared-types'

function randomNickname(): string {
  const adjectives = ['Bold', 'Swift', 'Calm', 'Bright', 'Wild', 'Cool', 'Brave', 'Keen']
  const animals = ['Fox', 'Bear', 'Wolf', 'Hawk', 'Lion', 'Deer', 'Owl', 'Cat']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)] ?? 'Bold'
  const animal = animals[Math.floor(Math.random() * animals.length)] ?? 'Fox'
  return `${adj}${animal}`
}

export function registerRoomHandlers(
  io: Server,
  socket: Socket,
  roomManager: RoomManager
): void {
  // ── room:create ────────────────────────────────────────────────────────────
  socket.on(ROOM_EVENTS.CREATE, (payload: RoomCreatePayload) => {
    try {
      const nickname = payload.nickname?.trim() || randomNickname()
      const room = roomManager.createRoom(socket.id, nickname)

      void socket.join(room.code)
      socket.emit(ROOM_EVENTS.UPDATED, { room })
      console.log(`[socket] ${nickname} created room ${room.code}`)
    } catch (err) {
      socket.emit(ROOM_EVENTS.ERROR, { message: 'Could not create room' })
      console.error('[socket] room:create error', err)
    }
  })

  // ── room:join ──────────────────────────────────────────────────────────────
  socket.on(ROOM_EVENTS.JOIN, (payload: RoomJoinPayload) => {
    try {
      const code = payload.code?.toUpperCase().trim()
      const nickname = payload.nickname?.trim() || randomNickname()

      if (!code || code.length !== 4) {
        socket.emit(ROOM_EVENTS.ERROR, { message: 'Invalid room code' })
        return
      }

      const room = roomManager.joinRoom(code, socket.id, nickname)
      void socket.join(code)

      // Notifica a todos en la sala (incluido el que acaba de entrar)
      io.to(code).emit(ROOM_EVENTS.UPDATED, { room })
      console.log(`[socket] ${nickname} joined room ${code}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not join room'
      socket.emit(ROOM_EVENTS.ERROR, { message })
      console.error('[socket] room:join error', err)
    }
  })

  // ── room:leave ─────────────────────────────────────────────────────────────
  socket.on(ROOM_EVENTS.LEAVE, () => {
    handleLeave(io, socket, roomManager)
  })

  // ── disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    handleLeave(io, socket, roomManager)
  })

  // ── room:start ─────────────────────────────────────────────────────────────
  socket.on(ROOM_EVENTS.START, (payload: { code: string }) => {
    try {
      const code = payload.code?.toUpperCase()

      if (!roomManager.isHost(code, socket.id)) {
        socket.emit(ROOM_EVENTS.ERROR, { message: 'Only the host can start the game' })
        return
      }

      const room = roomManager.getRoom(code)
      if (!room) {
        socket.emit(ROOM_EVENTS.ERROR, { message: 'Room not found' })
        return
      }

      if (room.players.length < 2) {
        socket.emit(ROOM_EVENTS.ERROR, { message: 'Need at least 2 players to start' })
        return
      }

      // La GameStateMachine (ISSUE-017) tomará el control desde aquí.
      // Por ahora simplemente cambiamos la fase a 'record' para que el frontend pueda avanzar.
      const updatedRoom = roomManager.setPhase(code, 'record')
      io.to(code).emit(ROOM_EVENTS.UPDATED, { room: updatedRoom })
      console.log(`[socket] game started in room ${code}`)
    } catch (err) {
      socket.emit(ROOM_EVENTS.ERROR, { message: 'Could not start game' })
      console.error('[socket] room:start error', err)
    }
  })
}

function handleLeave(io: Server, socket: Socket, roomManager: RoomManager): void {
  // Busca en qué salas está el socket y lo elimina de todas
  socket.rooms.forEach((roomCode) => {
    if (roomCode === socket.id) return // socket siempre está en su propia room
    const room = roomManager.leaveRoom(roomCode, socket.id)
    if (room) {
      io.to(roomCode).emit(ROOM_EVENTS.UPDATED, { room })
    }
    console.log(`[socket] ${socket.id} left room ${roomCode}`)
  })
}

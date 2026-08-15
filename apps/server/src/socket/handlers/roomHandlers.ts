import type { Server, Socket } from 'socket.io'
import type { RoomManager } from '../../rooms/RoomManager'
import type { GameStateMachine } from '../../rooms/GameStateMachine'
import {
  ROOM_EVENTS,
  PLAYER_EVENTS,
  type Clip,
  type RoomCreatePayload,
  type RoomJoinPayload,
  type PlayerAudioReadyPayload,
  type PlayerVotePayload,
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
  roomManager: RoomManager,
  gsm: GameStateMachine,
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
    handleLeave(io, socket, roomManager, gsm)
  })

  // ── disconnecting (socket.rooms aún está disponible aquí) ─────────────────
  socket.on('disconnecting', () => {
    handleLeave(io, socket, roomManager, gsm)
  })

  // ── room:start ─────────────────────────────────────────────────────────────
  socket.on(ROOM_EVENTS.START, (payload: { code: string }) => {
    void (async () => {
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

        // Pedir clip al servidor
        const res = await fetch(`http://localhost:${process.env.PORT ?? 3001}/clips/random`)
        const clip = await res.json() as Clip

        gsm.startGame(code, clip)
      } catch (err) {
        socket.emit(ROOM_EVENTS.ERROR, { message: 'Could not start game' })
        console.error('[socket] room:start error', err)
      }
    })()
  })

  // ── player:audioReady ──────────────────────────────────────────────────────
  socket.on(PLAYER_EVENTS.AUDIO_READY, (payload: PlayerAudioReadyPayload) => {
    try {
      gsm.playerAudioReady(payload.playerId, socket.id, payload.audioUrl)
    } catch (err) {
      console.error('[socket] player:audioReady error', err)
    }
  })

  // ── player:vote ────────────────────────────────────────────────────────────
  socket.on(PLAYER_EVENTS.VOTE, (payload: PlayerVotePayload & { roomCode: string }) => {
    try {
      gsm.registerVote(payload.roomCode, socket.id, payload.targetPlayerId)
    } catch (err) {
      console.error('[socket] player:vote error', err)
    }
  })

  // ── game:playbackFinished ──────────────────────────────────────────────────
  socket.on('game:playbackFinished', (payload: { roomCode: string }) => {
    try {
      gsm.playbackFinished(payload.roomCode)
    } catch (err) {
      console.error('[socket] game:playbackFinished error', err)
    }
  })
}

function handleLeave(
  io: Server,
  socket: Socket,
  roomManager: RoomManager,
  gsm: GameStateMachine,
): void {
  socket.rooms.forEach((roomCode) => {
    if (roomCode === socket.id) return
    const room = roomManager.leaveRoom(roomCode, socket.id)
    if (room) {
      io.to(roomCode).emit(ROOM_EVENTS.UPDATED, { room })
    } else {
      gsm.cleanup(roomCode)
    }
    console.log(`[socket] ${socket.id} left room ${roomCode}`)
  })
}

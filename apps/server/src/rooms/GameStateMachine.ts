import type { Server } from 'socket.io'
import type { Clip } from '@dub/shared-types'
import { GAME_EVENTS, ROOM_EVENTS } from '@dub/shared-types'
import type { RoomManager } from './RoomManager'

const RECORD_DURATION_SEC = 30
const VOTE_TIMEOUT_SEC = 20

interface GameConfig {
  roundDurationSec?: number
  maxRounds?: number
  voteTimeoutSec?: number
}

export class GameStateMachine {
  private timers = new Map<string, ReturnType<typeof setTimeout>>()

  constructor(
    private readonly io: Server,
    private readonly roomManager: RoomManager,
  ) {}

  startGame(roomCode: string, clip: Clip, config: GameConfig = {}): void {
    const roundDurationSec = config.roundDurationSec ?? RECORD_DURATION_SEC
    const room = this.roomManager.setClip(roomCode, clip)
    const updatedRoom = this.roomManager.setPhase(roomCode, 'record')

    // Notifica a todos: empieza la fase de grabación
    this.io.to(roomCode).emit(GAME_EVENTS.START, {
      clip,
      roundDurationSec,
    })
    this.io.to(roomCode).emit(ROOM_EVENTS.UPDATED, { room: updatedRoom })

    console.log(`[GSM] room ${roomCode} — record phase (${roundDurationSec}s)`)

    // Cuando acaba el tiempo de grabación → playback
    this.scheduleTimer(roomCode, 'record', roundDurationSec * 1000, () => {
      this.startPlayback(roomCode, config)
    })
  }

  // Llamado desde el handler de socket cuando un jugador sube su audio
  playerAudioReady(roomCode: string, playerId: string, audioUrl: string): void {
    const room = this.roomManager.getRoom(roomCode)
    if (!room || room.phase !== 'record') return

    // Añadir grabación al estado de la sala
    room.recordings.push({
      playerId,
      playerNickname: room.players.find((p) => p.id === playerId)?.nickname ?? 'Unknown',
      audioUrl,
      votesReceived: 0,
    })

    this.io.to(roomCode).emit(ROOM_EVENTS.UPDATED, { room })

    // Si todos han grabado → adelantar a playback sin esperar el timer
    const totalPlayers = room.players.length
    if (room.recordings.length >= totalPlayers) {
      this.clearTimer(roomCode, 'record')
      this.startPlayback(roomCode)
    }
  }

  private startPlayback(roomCode: string, config: GameConfig = {}): void {
    const room = this.roomManager.setPhase(roomCode, 'playback')
    this.io.to(roomCode).emit(GAME_EVENTS.PHASE_CHANGE, { phase: 'playback' })
    this.io.to(roomCode).emit(ROOM_EVENTS.UPDATED, { room })

    console.log(`[GSM] room ${roomCode} — playback phase`)

    // El frontend controla el playback y avisa cuando acaba.
    // Aquí usamos un timer de seguridad por si acaso.
    const recordings = room.recordings.length
    const safetyTimeoutMs = Math.max(recordings * 45, 60) * 1000

    this.scheduleTimer(roomCode, 'playback', safetyTimeoutMs, () => {
      this.startVote(roomCode, config)
    })
  }

  // Llamado desde el handler de socket cuando el frontend termina el playback
  playbackFinished(roomCode: string): void {
    const room = this.roomManager.getRoom(roomCode)
    if (!room || room.phase !== 'playback') return
    this.clearTimer(roomCode, 'playback')
    this.startVote(roomCode)
  }

  private startVote(roomCode: string, config: GameConfig = {}): void {
    const voteTimeoutSec = config.voteTimeoutSec ?? VOTE_TIMEOUT_SEC
    const room = this.roomManager.setPhase(roomCode, 'vote')

    this.io.to(roomCode).emit(GAME_EVENTS.PHASE_CHANGE, { phase: 'vote' })
    this.io.to(roomCode).emit(ROOM_EVENTS.UPDATED, { room })

    console.log(`[GSM] room ${roomCode} — vote phase (${voteTimeoutSec}s)`)

    this.scheduleTimer(roomCode, 'vote', voteTimeoutSec * 1000, () => {
      this.finishVote(roomCode, config)
    })
  }

  // Llamado cuando un jugador vota
  registerVote(roomCode: string, voterId: string, targetPlayerId: string): void {
    const room = this.roomManager.getRoom(roomCode)
    if (!room || room.phase !== 'vote') return
    if (voterId === targetPlayerId) return // no puede votarse a sí mismo

    const recording = room.recordings.find((r) => r.playerId === targetPlayerId)
    if (recording) recording.votesReceived++

    this.io.to(roomCode).emit(ROOM_EVENTS.UPDATED, { room })

    // Si todos han votado → cerrar la votación
    const voters = room.players.filter((p) =>
      room.recordings.some((r) => r.playerId !== p.id) // tiene a alguien a quien votar
    )
    const totalVotesCast = room.recordings.reduce((sum, r) => sum + r.votesReceived, 0)
    if (totalVotesCast >= voters.length) {
      this.clearTimer(roomCode, 'vote')
      this.finishVote(roomCode)
    }
  }

  private finishVote(roomCode: string, config: GameConfig = {}): void {
    const room = this.roomManager.getRoom(roomCode)
    if (!room) return

    const maxRounds = config.maxRounds ?? room.maxRounds
    const isLastRound = room.round + 1 >= maxRounds

    // Calcular scores de la ronda
    const scores = room.recordings.map((r) => ({
      playerId: r.playerId,
      nickname: r.playerNickname,
      pointsThisRound: r.votesReceived * 100,
      totalPoints: r.votesReceived * 100, // simplificado — en el futuro acumular entre rondas
    }))

    const updatedRoom = this.roomManager.setPhase(roomCode, 'results')
    updatedRoom.round += 1

    this.io.to(roomCode).emit(GAME_EVENTS.RESULTS, { scores, isLastRound })
    this.io.to(roomCode).emit(ROOM_EVENTS.UPDATED, { room: updatedRoom })

    console.log(`[GSM] room ${roomCode} — results (round ${updatedRoom.round}/${maxRounds})`)

    if (isLastRound) {
      this.io.to(roomCode).emit(GAME_EVENTS.END, {})
      this.roomManager.setPhase(roomCode, 'lobby')
    }
  }

  // Limpia todos los timers de una sala (cuando se destruye)
  cleanup(roomCode: string): void {
    for (const key of this.timers.keys()) {
      if (key.startsWith(roomCode)) this.clearTimer(roomCode, key.split(':')[1] ?? '')
    }
  }

  private scheduleTimer(
    roomCode: string,
    label: string,
    ms: number,
    cb: () => void,
  ): void {
    const key = `${roomCode}:${label}`
    const existing = this.timers.get(key)
    if (existing) clearTimeout(existing)
    this.timers.set(key, setTimeout(cb, ms))
  }

  private clearTimer(roomCode: string, label: string): void {
    const key = `${roomCode}:${label}`
    const timer = this.timers.get(key)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(key)
    }
  }
}

import type { Room, Player, GamePhase, Clip } from '@dub/shared-types'

const ROOM_EXPIRY_MS = 2 * 60 * 60 * 1000 // 2 horas
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin O, 0, I, 1 (confusos)

function generateCode(): string {
  return Array.from({ length: 4 }, () =>
    CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  ).join('')
}

function createRoom(code: string, host: Player): Room {
  return {
    code,
    players: [host],
    phase: 'lobby',
    round: 0,
    maxRounds: 3,
    currentClip: null,
    recordings: [],
  }
}

export class RoomManager {
  private rooms = new Map<string, Room>()
  private timers = new Map<string, ReturnType<typeof setTimeout>>()

  createRoom(hostId: string, hostNickname: string): Room {
    const code = this.generateUniqueCode()
    const host: Player = { id: hostId, nickname: hostNickname, isHost: true, isReady: false }
    const room = createRoom(code, host)
    this.rooms.set(code, room)
    this.scheduleExpiry(code)
    console.log(`[RoomManager] created room ${code}`)
    return room
  }

  joinRoom(code: string, playerId: string, nickname: string): Room {
    const room = this.getRoom(code)
    if (!room) throw new Error(`Room ${code} not found`)
    if (room.phase !== 'lobby') throw new Error(`Room ${code} is already in progress`)
    if (room.players.some((p) => p.id === playerId)) return room // reconexión

    const player: Player = { id: playerId, nickname, isHost: false, isReady: false }
    room.players.push(player)
    this.resetExpiry(code)
    console.log(`[RoomManager] ${nickname} joined room ${code}`)
    return room
  }

  leaveRoom(code: string, playerId: string): Room | null {
    const room = this.getRoom(code)
    if (!room) return null

    room.players = room.players.filter((p) => p.id !== playerId)
    console.log(`[RoomManager] player ${playerId} left room ${code}`)

    if (room.players.length === 0) {
      this.destroyRoom(code)
      return null
    }

    // Si el host se va, el siguiente jugador es el nuevo host
    if (!room.players.some((p) => p.isHost)) {
      const newHost = room.players[0]
      if (newHost) newHost.isHost = true
    }

    return room
  }

  getRoom(code: string): Room | null {
    return this.rooms.get(code) ?? null
  }

  setPhase(code: string, phase: GamePhase): Room {
    const room = this.getRoom(code)
    if (!room) throw new Error(`Room ${code} not found`)
    room.phase = phase
    return room
  }

  setClip(code: string, clip: Clip): Room {
    const room = this.getRoom(code)
    if (!room) throw new Error(`Room ${code} not found`)
    room.currentClip = clip
    room.recordings = []
    return room
  }

  isHost(code: string, playerId: string): boolean {
    const room = this.getRoom(code)
    if (!room) return false
    return room.players.find((p) => p.id === playerId)?.isHost ?? false
  }

  private generateUniqueCode(): string {
    let code: string
    let attempts = 0
    do {
      code = generateCode()
      attempts++
      if (attempts > 100) throw new Error('Could not generate unique room code')
    } while (this.rooms.has(code))
    return code
  }

  private destroyRoom(code: string): void {
    this.rooms.delete(code)
    const timer = this.timers.get(code)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(code)
    }
    console.log(`[RoomManager] destroyed room ${code}`)
  }

  private scheduleExpiry(code: string): void {
    const timer = setTimeout(() => {
      console.log(`[RoomManager] room ${code} expired`)
      this.destroyRoom(code)
    }, ROOM_EXPIRY_MS)
    this.timers.set(code, timer)
  }

  private resetExpiry(code: string): void {
    const existing = this.timers.get(code)
    if (existing) clearTimeout(existing)
    this.scheduleExpiry(code)
  }
}

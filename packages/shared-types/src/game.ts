// packages/shared-types/src/game.ts
// Reemplaza el contenido actual de este archivo con esto.

export type GamePhase = 'lobby' | 'record' | 'playback' | 'vote' | 'results'

export interface Player {
  id: string          // socket.id
  nickname: string
  isHost: boolean
  isReady: boolean
  assignedCharacter?: string  // personaje asignado cuando empieza la ronda
}

export interface Clip {
  id: string
  youtubeId: string
  startSec: number
  endSec: number
  title: string
  category: string
  characters: string[]  // nombres de los personajes del clip, ej: ['Scrat'] | ['Shrek', 'Burro']
}

export interface Recording {
  playerId: string
  playerNickname: string
  character: string       // personaje que estaba doblando
  audioUrl: string
  votesReceived: number
}

export interface Room {
  code: string
  players: Player[]
  phase: GamePhase
  round: number
  maxRounds: number
  currentClip: Clip | null
  recordings: Recording[]
}

export interface RoundScore {
  playerId: string
  nickname: string
  character: string
  pointsThisRound: number
  totalPoints: number
}

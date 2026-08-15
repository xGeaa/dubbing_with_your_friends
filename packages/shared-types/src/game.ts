export type GamePhase = 'lobby' | 'record' | 'playback' | 'vote' | 'results'

export interface Player {
  id: string
  nickname: string
  isHost: boolean
  isReady: boolean
}

export interface Clip {
  id: string
  youtubeId: string
  startSec: number
  endSec: number
  title: string
  category: string
}

export interface Recording {
  playerId: string
  playerNickname: string
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
  pointsThisRound: number
  totalPoints: number
}

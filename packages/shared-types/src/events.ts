// Socket.io event names — usar siempre estas constantes, nunca strings directos

export const ROOM_EVENTS = {
  CREATE: 'room:create',
  JOIN: 'room:join',
  LEAVE: 'room:leave',
  UPDATED: 'room:updated',
  START: 'room:start',
  ERROR: 'room:error',
} as const

export const GAME_EVENTS = {
  START: 'game:start',
  PHASE_CHANGE: 'game:phaseChange',
  RESULTS: 'game:results',
  NEXT_ROUND: 'game:nextRound',
  END: 'game:end',
} as const

export const PLAYER_EVENTS = {
  AUDIO_READY: 'player:audioReady',
  VOTE: 'player:vote',
} as const

// Payload types
export interface RoomCreatePayload { nickname: string }
export interface RoomJoinPayload { code: string; nickname: string }
export interface RoomUpdatedPayload { room: import('./game').Room }
export interface RoomErrorPayload { message: string }
export interface GameStartPayload { clip: import('./game').Clip; roundDurationSec: number }
export interface PhaseChangePayload { phase: import('./game').GamePhase; data?: unknown }
export interface PlayerAudioReadyPayload { playerId: string; audioUrl: string }
export interface PlayerVotePayload { targetPlayerId: string }
export interface GameResultsPayload { scores: import('./game').RoundScore[]; isLastRound: boolean }

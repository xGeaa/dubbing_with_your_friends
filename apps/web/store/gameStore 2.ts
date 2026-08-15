import { create } from 'zustand'
import type { Room, Player, GamePhase } from '@dub/shared-types'

interface GameStore {
  room: Room | null
  localPlayer: Player | null
  phase: GamePhase
  setRoom: (room: Room) => void
  setLocalPlayer: (player: Player) => void
  setPhase: (phase: GamePhase) => void
  reset: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  room: null,
  localPlayer: null,
  phase: 'lobby',
  setRoom: (room) => set({ room, phase: room.phase }),
  setLocalPlayer: (localPlayer) => set({ localPlayer }),
  setPhase: (phase) => set({ phase }),
  reset: () => set({ room: null, localPlayer: null, phase: 'lobby' }),
}))

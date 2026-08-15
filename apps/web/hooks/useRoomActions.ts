'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import type { Socket } from 'socket.io-client'
import {
  ROOM_EVENTS,
  type RoomErrorPayload,
  type RoomUpdatedPayload,
} from '@dub/shared-types'

import { getSocket } from '@/lib/socket'
import { randomNickname, storeNickname } from '@/lib/nickname'
import { CONNECTION_ERROR, translateRoomError } from '@/lib/socketErrors'
import { useGameStore } from '@/store/gameStore'

const RESPONSE_TIMEOUT_MS = 10_000

export type RoomAction = 'create' | 'join'

/**
 * Encapsula el flujo "emitir evento → esperar room:updated → navegar al lobby"
 * que comparten la Home (`room:create`) y la página /join (`room:join`).
 */
export function useRoomActions() {
  const router = useRouter()
  const setRoom = useGameStore((state) => state.setRoom)
  const setLocalPlayer = useGameStore((state) => state.setLocalPlayer)

  const [pending, setPending] = useState<RoomAction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const teardownRef = useRef<(() => void) | null>(null)

  // Si el usuario abandona la página con una petición en vuelo, limpiamos.
  useEffect(() => () => teardownRef.current?.(), [])

  const start = useCallback(
    (action: RoomAction, nickname: string, emit: (socket: Socket) => void) => {
      if (teardownRef.current) return // ya hay una acción en curso

      const socket = getSocket()
      setError(null)
      setPending(action)

      const teardown = () => {
        clearTimeout(timer)
        socket.off(ROOM_EVENTS.UPDATED, onUpdated)
        socket.off(ROOM_EVENTS.ERROR, onRoomError)
        socket.off('connect_error', onConnectError)
        socket.off('connect', onConnect)
        teardownRef.current = null
        setPending(null)
      }

      const fail = (message: string) => {
        teardown()
        setError(message)
      }

      const onUpdated = ({ room }: RoomUpdatedPayload) => {
        teardown()
        setRoom(room)
        const me = room.players.find((player) => player.id === socket.id)
        if (me) setLocalPlayer(me)
        storeNickname(nickname)
        router.push(`/room/${room.code}` as Route)
      }

      const onRoomError = ({ message }: RoomErrorPayload) => {
        fail(translateRoomError(message))
      }

      const onConnectError = () => fail(CONNECTION_ERROR)
      const onConnect = () => emit(socket)
      const timer = setTimeout(() => fail(CONNECTION_ERROR), RESPONSE_TIMEOUT_MS)

      teardownRef.current = teardown
      socket.on(ROOM_EVENTS.UPDATED, onUpdated)
      socket.on(ROOM_EVENTS.ERROR, onRoomError)
      socket.on('connect_error', onConnectError)

      if (socket.connected) {
        emit(socket)
      } else {
        socket.once('connect', onConnect)
        socket.connect()
      }
    },
    [router, setLocalPlayer, setRoom]
  )

  const createRoom = useCallback(
    (rawNickname?: string) => {
      const nickname = rawNickname?.trim() || randomNickname()
      start('create', nickname, (socket) => {
        socket.emit(ROOM_EVENTS.CREATE, { nickname })
      })
    },
    [start]
  )

  const joinRoom = useCallback(
    (code: string, rawNickname?: string) => {
      const nickname = rawNickname?.trim() || randomNickname()
      start('join', nickname, (socket) => {
        socket.emit(ROOM_EVENTS.JOIN, { code, nickname })
      })
    },
    [start]
  )

  return {
    createRoom,
    joinRoom,
    pending,
    isPending: pending !== null,
    error,
    clearError: useCallback(() => setError(null), []),
  }
}

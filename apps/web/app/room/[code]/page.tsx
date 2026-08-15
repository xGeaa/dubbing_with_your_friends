'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, LoaderCircle } from 'lucide-react'
import {
  GAME_EVENTS,
  ROOM_EVENTS,
  type GameStartPayload,
  type RoomErrorPayload,
  type RoomUpdatedPayload,
} from '@dub/shared-types'

import { Button } from '@/components/ui/button'
import { ErrorMessage } from '@/components/game/ErrorMessage'
import { Lobby } from '@/components/game/Lobby'
import { PhasePlaceholder } from '@/components/game/PhasePlaceholder'
import { RecordScreen } from '@/components/game/RecordScreen'
import { loadNickname } from '@/lib/nickname'
import { isValidRoomCode, normalizeRoomCode } from '@/lib/room'
import {
  cancelPendingDisconnect,
  disconnectSocketSoon,
  getSocket,
} from '@/lib/socket'
import { CONNECTION_ERROR, translateRoomError } from '@/lib/socketErrors'
import { useGameStore } from '@/store/gameStore'

const CONNECT_TIMEOUT_MS = 12_000
const NOTICE_TIMEOUT_MS = 5_000
/** Igual que `RECORD_DURATION_SEC` en la GameStateMachine del servidor. */
const DEFAULT_ROUND_SEC = 30

export default function RoomPage({ params }: { params: { code: string } }) {
  const code = normalizeRoomCode(params.code)

  const room = useGameStore((state) => state.room)
  const localPlayer = useGameStore((state) => state.localPlayer)

  const [fatalError, setFatalError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // `game:start` trae la duración de la ronda; el instante de recepción es la
  // referencia para que el countdown vaya a la par que el timer del servidor.
  const [round, setRound] = useState<{
    durationSec: number
    startedAt: number
  } | null>(null)

  useEffect(() => {
    const { setRoom, setLocalPlayer, reset } = useGameStore.getState()

    if (!isValidRoomCode(code)) {
      setFatalError('El código de sala no es válido. Debe tener 4 caracteres.')
      return
    }

    const socket = getSocket()
    const nickname = loadNickname()

    // Si volvemos a montar (StrictMode) recuperamos la conexión en curso.
    cancelPendingDisconnect()

    // Si venimos de la Home o de /join ya estamos dentro de la sala.
    const alreadyJoined =
      socket.connected && useGameStore.getState().room?.code === code

    const showNotice = (message: string) => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current)
      setNotice(message)
      noticeTimer.current = setTimeout(() => setNotice(null), NOTICE_TIMEOUT_MS)
    }

    const clearNotice = () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current)
      setNotice(null)
    }

    const timeout = setTimeout(() => {
      if (!useGameStore.getState().room) setFatalError(CONNECTION_ERROR)
    }, CONNECT_TIMEOUT_MS)

    const onUpdated = ({ room: updatedRoom }: RoomUpdatedPayload) => {
      clearTimeout(timeout)
      clearNotice()
      setFatalError(null)
      setRoom(updatedRoom)
      const me = updatedRoom.players.find((player) => player.id === socket.id)
      if (me) setLocalPlayer(me)
    }

    const onGameStart = ({ roundDurationSec }: GameStartPayload) => {
      setRound({ durationSec: roundDurationSec, startedAt: Date.now() })
    }

    const onRoomError = ({ message }: RoomErrorPayload) => {
      const text = translateRoomError(message)
      // Si ya estamos dentro de la sala el error es de una acción concreta
      // (p. ej. `room:start`): avisamos sin tumbar el lobby.
      if (useGameStore.getState().room) showNotice(text)
      else {
        clearTimeout(timeout)
        setFatalError(text)
      }
    }

    // El `connect` inicial y cada reconexión traen un socket.id nuevo,
    // así que hay que volver a entrar en la sala siempre.
    const onConnect = () => {
      socket.emit(ROOM_EVENTS.JOIN, { code, nickname })
    }

    const onDisconnect = (reason: string) => {
      if (reason === 'io client disconnect') return // salida provocada por nosotros
      showNotice('Se ha perdido la conexión. Reconectando…')
    }

    const onConnectError = () => {
      if (!useGameStore.getState().room) {
        clearTimeout(timeout)
        setFatalError(CONNECTION_ERROR)
      }
    }

    socket.on(ROOM_EVENTS.UPDATED, onUpdated)
    socket.on(ROOM_EVENTS.ERROR, onRoomError)
    socket.on(GAME_EVENTS.START, onGameStart)
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onConnectError)

    if (!socket.connected) {
      socket.connect() // `onConnect` emitirá el room:join
    } else if (!alreadyJoined) {
      onConnect()
    } else {
      clearTimeout(timeout)
    }

    return () => {
      clearTimeout(timeout)
      if (noticeTimer.current) clearTimeout(noticeTimer.current)
      socket.off(ROOM_EVENTS.UPDATED, onUpdated)
      socket.off(ROOM_EVENTS.ERROR, onRoomError)
      socket.off(GAME_EVENTS.START, onGameStart)
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onConnectError)
      disconnectSocketSoon()
      reset()
    }
  }, [code])

  const renderPhase = () => {
    if (!room) return null

    if (room.phase === 'lobby') {
      return <Lobby room={room} localPlayerId={localPlayer?.id ?? null} />
    }

    if (room.phase === 'record' && room.currentClip) {
      return (
        <RecordScreen
          room={room}
          clip={room.currentClip}
          // Si entramos con la ronda ya empezada no hemos visto `game:start`:
          // caemos al valor por defecto del servidor.
          duration={round?.durationSec ?? DEFAULT_ROUND_SEC}
          startedAt={round?.startedAt}
          localPlayerId={localPlayer?.id ?? null}
        />
      )
    }

    return <PhasePlaceholder phase={room.phase} />
  }

  return (
    <main className="bg-stage flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-8 sm:py-12">
      {notice ? (
        <ErrorMessage message={notice} className="w-full max-w-2xl" />
      ) : null}

      {fatalError ? (
        <div className="flex w-full max-w-md flex-col items-center gap-4">
          <ErrorMessage message={fatalError} className="w-full" />
          <Button asChild variant="secondary">
            <Link href="/">
              <ArrowLeft />
              Volver al inicio
            </Link>
          </Button>
        </div>
      ) : room ? (
        renderPhase()
      ) : (
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <LoaderCircle className="size-8 animate-spin text-primary" />
          <p className="text-sm">Conectando con la sala {code}…</p>
        </div>
      )}
    </main>
  )
}

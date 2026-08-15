'use client'

import { useCallback } from 'react'
import { Mic, Users } from 'lucide-react'
import { PLAYER_EVENTS, type Clip, type Room } from '@dub/shared-types'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { AudioRecorder } from '@/components/game/AudioRecorder'
import { VideoPlayer } from '@/components/game/VideoPlayer'
import { getSocket } from '@/lib/socket'
import { uploadRecording } from '@/lib/uploadRecording'

interface RecordScreenProps {
  room: Room
  clip: Clip
  /** Segundos de grabación que anuncia el servidor en `game:start`. */
  duration: number
  startedAt?: number
  localPlayerId: string | null
}

/**
 * Fase `record`: el clip se reproduce en silencio mientras cada jugador
 * graba su doblaje. Al terminar se sube el audio y se avisa al servidor.
 */
export function RecordScreen({
  room,
  clip,
  duration,
  startedAt,
  localPlayerId,
}: RecordScreenProps) {
  const handleComplete = useCallback(
    async (blob: Blob) => {
      const socket = getSocket()
      const playerId = localPlayerId ?? socket.id
      if (!playerId) throw new Error('Te has desconectado de la sala.')

      const audioUrl = await uploadRecording({
        blob,
        roomCode: room.code,
        playerId,
        sessionId: `round-${room.round}`,
      })

      socket.emit(PLAYER_EVENTS.AUDIO_READY, {
        playerId,
        audioUrl,
        roomCode: room.code,
      })
    },
    [localPlayerId, room.code, room.round]
  )

  const ready = room.recordings.length
  const total = room.players.length

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
            <Mic className="size-3.5" />
            Ronda {room.round + 1} de {room.maxRounds}
          </span>
          <h1 className="text-lg font-bold sm:text-xl">{clip.title}</h1>
        </div>
        <Badge variant="secondary" className="gap-1.5">
          <Users className="size-3" />
          {ready}/{total} han enviado
        </Badge>
      </header>

      {/* El vídeo va siempre en silencio: la voz la pone el jugador */}
      <VideoPlayer clip={clip} muted />

      <Card className="border-border/70 bg-card/80 backdrop-blur">
        <CardContent className="p-4 sm:p-6">
          <AudioRecorder
            duration={duration}
            startedAt={startedAt}
            onComplete={handleComplete}
          />
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, SkipForward } from 'lucide-react'
import { GAME_EVENTS, type Clip, type Recording, type Room } from '@dub/shared-types'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { VideoPlayer } from '@/components/game/VideoPlayer'
import { getSocket } from '@/lib/socket'

interface PlaybackProps {
  recordings: Recording[]
  clip: Clip
  room: Room
}

/**
 * Fase `playback`: reproduce el vídeo (en silencio) sincronizado con el
 * audio de cada jugador uno por uno. Al terminar todos emite
 * `game:playbackFinished` al servidor para pasar a votación.
 */
export function Playback({ recordings, clip, room }: PlaybackProps) {
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro')
  const audioRef = useRef<HTMLAudioElement>(null)

  const current = recordings[index]

  // Limpia el audio al cambiar de grabación
  useEffect(() => {
    const audio = audioRef.current
    return () => {
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
    }
  }, [index])

  const handleVideoReady = useCallback(() => {
    if (phase !== 'playing') return
    void audioRef.current?.play().catch(() => {
      // autoplay bloqueado — el usuario deberá pulsar Play
    })
  }, [phase])

  const handleAudioEnded = useCallback(() => {
    if (index + 1 < recordings.length) {
      setIndex((i) => i + 1)
      setPhase('intro')
    } else {
      setPhase('done')
      getSocket().emit(GAME_EVENTS.PHASE_CHANGE, { roomCode: room.code, phase: 'vote' })
    }
  }, [index, recordings.length, room.code])

  const startCurrent = () => setPhase('playing')

  if (!current) return null

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      {/* Cabecera */}
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold sm:text-xl">
          🎙️ Doblaje {index + 1} de {recordings.length}
        </h1>
        <span className="text-sm text-muted-foreground">{clip.title}</span>
      </header>

      {/* Vídeo — key={index} fuerza reinicio del player en cada grabación */}
      <VideoPlayer
        key={index}
        clip={clip}
        muted
        onReady={handleVideoReady}
      />

      {/* Audio oculto */}
      <audio
        ref={audioRef}
        src={current.audioUrl}
        onEnded={handleAudioEnded}
      />

      <Card className="border-border/70 bg-card/80 backdrop-blur">
        <CardContent className="flex flex-col items-center gap-4 p-6">
          {phase === 'intro' && (
            <>
              <p className="text-center text-muted-foreground text-sm">
                A continuación escucharás el doblaje de…
              </p>
              <p className="text-2xl font-bold">🎭 ???</p>
              <Button onClick={startCurrent} size="lg" className="gap-2">
                <Play className="size-4" />
                Reproducir
              </Button>
            </>
          )}

          {phase === 'playing' && (
            <>
              <p className="text-center text-sm text-muted-foreground">
                Escuchando doblaje {index + 1}…
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleAudioEnded}
                >
                  <SkipForward className="size-3.5" />
                  Saltar
                </Button>
              </div>
            </>
          )}

          {phase === 'done' && (
            <p className="text-center font-medium">
              ✅ Todos los doblajes reproducidos. Pasando a votación…
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

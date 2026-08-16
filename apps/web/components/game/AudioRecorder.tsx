'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, LoaderCircle, Mic, Play, RotateCcw, Send, Square } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ErrorMessage } from '@/components/game/ErrorMessage'
import { useMediaRecorder } from '@/hooks/useMediaRecorder'
import { cn } from '@/lib/utils'

interface AudioRecorderProps {
  /** Segundos de la fase de grabación (los manda el servidor en `game:start`). */
  duration: number
  /** Se llama con la grabación final. Puede ser asíncrona (subida). */
  onComplete: (blob: Blob) => void | Promise<void>
  /**
   * Momento en que arrancó la fase en el servidor (epoch ms). Sirve para que
   * el countdown vaya sincronizado aunque el jugador entre un poco más tarde.
   */
  startedAt?: number
}

type SendState = 'pending' | 'sending' | 'sent' | 'failed'

function formatSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.ceil(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function AudioRecorder({
  duration,
  onComplete,
  startedAt,
}: AudioRecorderProps) {
  const {
    state,
    error,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    reset,
  } = useMediaRecorder()

  const phaseStart = useRef(startedAt ?? Date.now())
  const [remaining, setRemaining] = useState(duration)
  const [sendState, setSendState] = useState<SendState>('pending')
  const [sendError, setSendError] = useState<string | null>(null)

  // Una sola entrega por ronda: evita que el envío automático del final
  // duplique lo que el jugador ya ha enviado a mano.
  const deliveredRef = useRef(false)
  const audioBlobRef = useRef<Blob | null>(null)
  audioBlobRef.current = audioBlob

  const deliver = useCallback(
    async (blob: Blob) => {
      if (deliveredRef.current) return
      deliveredRef.current = true
      setSendState('sending')
      setSendError(null)
      try {
        await onComplete(blob)
        setSendState('sent')
      } catch (err) {
        deliveredRef.current = false
        setSendState('failed')
        setSendError(
          err instanceof Error
            ? err.message
            : 'No hemos podido enviar tu grabación.'
        )
      }
    },
    [onComplete]
  )

  // Countdown contra el reloj real: un intervalo que suma no se desvía menos,
  // así que calculamos siempre a partir del instante de inicio.
  useEffect(() => {
    const tick = () => {
      const elapsed = (Date.now() - phaseStart.current) / 1000
      setRemaining(Math.max(0, duration - elapsed))
    }
    tick()
    const id = setInterval(tick, 200)
    return () => clearInterval(id)
  }, [duration])

  // Al agotarse el tiempo: cerrar la grabación en curso y enviar lo que haya.
  const timeUp = remaining <= 0
  const stopRecordingRef = useRef(stopRecording)
  stopRecordingRef.current = stopRecording

  useEffect(() => {
    if (!timeUp || deliveredRef.current) return

    void (async () => {
      const blob = (await stopRecordingRef.current()) ?? audioBlobRef.current
      if (blob) await deliver(blob)
    })()
  }, [timeUp, deliver])

  const isRecording = state === 'recording'
  const isBusy = state === 'requesting' || sendState === 'sending'
  const progress = Math.min(100, Math.max(0, ((duration - remaining) / duration) * 100))

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Countdown */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {timeUp ? 'Tiempo agotado' : 'Tiempo restante'}
          </span>
          <span
            className={cn(
              'font-mono text-2xl font-bold tabular-nums',
              remaining <= 5 && !timeUp ? 'text-crimson' : 'text-foreground'
            )}
            role="timer"
            aria-live="off"
          >
            {formatSeconds(remaining)}
          </span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-secondary"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          aria-label="Progreso de la ronda"
        >
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-200 ease-linear',
              remaining <= 5 ? 'bg-crimson' : 'bg-primary'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Preview de la última toma */}
      {audioUrl && !isRecording ? (
        <audio
          src={audioUrl}
          controls
          className="w-full"
          aria-label="Escuchar tu grabación"
        />
      ) : null}

      {/* Controles */}
      {sendState === 'sent' ? (
        <p className="flex items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-3 text-sm font-semibold text-primary">
          <Check className="size-4" />
          ¡Doblaje enviado! Esperando al resto…
        </p>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          {isRecording ? (
            <Button
              size="lg"
              variant="destructive"
              className="h-14 w-full text-base"
              onClick={() => void stopRecording()}
            >
              <Square />
              Parar
            </Button>
          ) : (
            <Button
              size="lg"
              className="h-14 w-full animate-pulse-glow text-base"
              onClick={() => void startRecording()}
              disabled={isBusy || timeUp}
            >
              {state === 'requesting' ? (
                <LoaderCircle className="animate-spin" />
              ) : audioBlob ? (
                <RotateCcw />
              ) : (
                <Mic />
              )}
              {state === 'requesting'
                ? 'Pidiendo micrófono…'
                : audioBlob
                  ? 'Regrabar'
                  : 'Grabar'}
            </Button>
          )}

          {audioBlob && !isRecording ? (
            <Button
              size="lg"
              variant="secondary"
              className="h-14 w-full text-base"
              onClick={() => void deliver(audioBlob)}
              disabled={isBusy}
            >
              {sendState === 'sending' ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Send />
              )}
              {sendState === 'sending' ? 'Enviando…' : 'Enviar doblaje'}
            </Button>
          ) : null}
        </div>
      )}

      {/* Ayuda contextual */}
      {!audioBlob && !isRecording && sendState === 'pending' && !error ? (
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Play className="size-3" />
          Dale a grabar y pon voz a la escena antes de que acabe el tiempo.
        </p>
      ) : null}

      {error ? <ErrorMessage message={error} /> : null}
      {sendError ? <ErrorMessage message={sendError} /> : null}
    </div>
  )
}

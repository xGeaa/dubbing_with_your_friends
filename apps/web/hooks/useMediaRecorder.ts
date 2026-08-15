'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type RecorderState =
  | 'idle'
  | 'requesting'
  | 'recording'
  | 'stopped'
  | 'error'

/**
 * Formatos por orden de preferencia.
 * Safari (iOS incluido) no soporta webm y solo graba en mp4, así que hay que
 * negociar el contenedor en vez de asumir opus.
 */
const PREFERRED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
] as const

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  return PREFERRED_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type))
}

/** Traduce el error de getUserMedia a algo que el jugador entienda. */
function describeError(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'name' in err) {
    switch ((err as DOMException).name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return 'Has bloqueado el micrófono. Actívalo en los permisos del navegador y vuelve a intentarlo.'
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return 'No hemos encontrado ningún micrófono conectado.'
      case 'NotReadableError':
      case 'TrackStartError':
        return 'Otra aplicación está usando el micrófono. Ciérrala e inténtalo de nuevo.'
      case 'OverconstrainedError':
        return 'Tu micrófono no admite la configuración necesaria.'
      case 'SecurityError':
        return 'El navegador ha bloqueado el micrófono por seguridad. Hace falta una conexión HTTPS.'
      default:
        break
    }
  }
  return 'No hemos podido acceder al micrófono. Inténtalo de nuevo.'
}

export interface UseMediaRecorderReturn {
  state: RecorderState
  error: string | null
  /** Última grabación completada. */
  audioBlob: Blob | null
  /** Object URL de `audioBlob`, listo para un <audio src>. */
  audioUrl: string | null
  hasPermission: boolean
  requestPermission: () => Promise<boolean>
  startRecording: () => Promise<boolean>
  /** Para la grabación y resuelve con el blob (null si algo falló). */
  stopRecording: () => Promise<Blob | null>
  /** Descarta la grabación actual para volver a grabar. */
  reset: () => void
}

export function useMediaRecorder(): UseMediaRecorderReturn {
  const [state, setState] = useState<RecorderState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState(false)

  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const stopResolverRef = useRef<((blob: Blob | null) => void) | null>(null)

  // Libera micrófono y object URLs al desmontar.
  useEffect(() => {
    return () => {
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!audioUrl) return
    return () => URL.revokeObjectURL(audioUrl)
  }, [audioUrl])

  const getStream = useCallback(async (): Promise<MediaStream | null> => {
    if (streamRef.current?.active) return streamRef.current

    // En contextos no seguros (http:// que no sea localhost) el navegador ni
    // siquiera expone mediaDevices.
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError(
        'Tu navegador no permite grabar aquí. El micrófono solo funciona en HTTPS o en localhost.'
      )
      setState('error')
      return null
    }

    setState('requesting')
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      streamRef.current = stream
      setHasPermission(true)
      setState('idle')
      return stream
    } catch (err) {
      setError(describeError(err))
      setState('error')
      return null
    }
  }, [])

  const requestPermission = useCallback(async () => {
    return (await getStream()) !== null
  }, [getStream])

  const startRecording = useCallback(async () => {
    const stream = await getStream()
    if (!stream) return false

    const mimeType = pickMimeType()
    if (!mimeType) {
      setError('Tu navegador no permite grabar audio. Prueba con Chrome o Safari actualizado.')
      setState('error')
      return false
    }

    try {
      const recorder = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        chunksRef.current = []
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        setState('stopped')
        stopResolverRef.current?.(blob)
        stopResolverRef.current = null
      }

      recorder.onerror = () => {
        setError('La grabación se ha interrumpido. Inténtalo de nuevo.')
        setState('error')
        stopResolverRef.current?.(null)
        stopResolverRef.current = null
      }

      recorderRef.current = recorder
      recorder.start()
      setAudioBlob(null)
      setAudioUrl(null)
      setError(null)
      setState('recording')
      return true
    } catch {
      setError('No hemos podido iniciar la grabación. Inténtalo de nuevo.')
      setState('error')
      return false
    }
  }, [getStream])

  const stopRecording = useCallback(async () => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state !== 'recording') return audioBlob

    return new Promise<Blob | null>((resolve) => {
      stopResolverRef.current = resolve
      recorder.stop()
    })
  }, [audioBlob])

  const reset = useCallback(() => {
    setAudioBlob(null)
    setAudioUrl(null)
    setError(null)
    setState('idle')
  }, [])

  return {
    state,
    error,
    audioBlob,
    audioUrl,
    hasPermission,
    requestPermission,
    startRecording,
    stopRecording,
    reset,
  }
}

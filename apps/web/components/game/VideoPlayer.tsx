'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { Clip } from '@dub/shared-types'

// Tipos de la YouTube IFrame API
declare global {
  interface Window {
    YT: typeof YT
    onYouTubeIframeAPIReady: () => void
  }
}

interface VideoPlayerProps {
  clip: Clip
  muted?: boolean
  onReady?: () => void
  onEnded?: () => void
  onError?: () => void
}

export function VideoPlayer({ clip, muted = true, onReady, onEnded, onError }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YT.Player | null>(null)
  const readyRef = useRef(false)

  const initPlayer = useCallback(() => {
    if (!containerRef.current || playerRef.current) return

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId: clip.youtubeId,
      playerVars: {
        autoplay: 1,
        mute: muted ? 1 : 0,
        controls: 0,           // sin controles — el juego los gestiona
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,     // sin anotaciones
        modestbranding: 1,
        rel: 0,
        start: clip.startSec,
        end: clip.endSec,
        playsinline: 1,        // importante para móvil
      },
      events: {
        onReady: (event) => {
          readyRef.current = true
          event.target.seekTo(clip.startSec, true)
          event.target.playVideo()
          onReady?.()
        },
        onStateChange: (event) => {
          // YT.PlayerState.ENDED = 0
          if (event.data === 0) {
            onEnded?.()
          }
        },
        onError: () => {
          onError?.()
        },
      },
    })
  }, [clip, muted, onReady, onEnded, onError])

  useEffect(() => {
    // Si la API ya está cargada, init directo
    if (window.YT?.Player) {
      initPlayer()
      return
    }

    // Si ya hay un script cargándose, encola el callback
    if (document.getElementById('youtube-iframe-api')) {
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        prev?.()
        initPlayer()
      }
      return
    }

    // Primera vez — carga el script
    window.onYouTubeIframeAPIReady = initPlayer
    const script = document.createElement('script')
    script.id = 'youtube-iframe-api'
    script.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(script)

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
        readyRef.current = false
      }
    }
  }, [initPlayer])

  // Si el clip cambia, reinicia el player
  useEffect(() => {
    if (!readyRef.current || !playerRef.current) return
    playerRef.current.loadVideoById({
      videoId: clip.youtubeId,
      startSeconds: clip.startSec,
      endSeconds: clip.endSec,
    })
  }, [clip.youtubeId, clip.startSec, clip.endSec])

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      {/* Overlay para bloquear clics en el vídeo (evita que el usuario pause) */}
      <div className="absolute inset-0" />
    </div>
  )
}

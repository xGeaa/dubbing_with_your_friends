'use client'

import { useState, useEffect } from 'react'
import { Trophy } from 'lucide-react'
import { PLAYER_EVENTS, type Recording, type Room } from '@dub/shared-types'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getSocket } from '@/lib/socket'

interface VoteScreenProps {
  recordings: Recording[]
  room: Room
  localPlayerId: string | null
  /** Segundos para votar (por defecto 20, igual que el servidor) */
  timeoutSec?: number
}

/**
 * Fase `vote`: muestra todos los doblajes con botones de voto.
 * Un jugador no puede votarse a sí mismo. Solo puede votar una vez.
 */
export function VoteScreen({
  recordings,
  room,
  localPlayerId,
  timeoutSec = 20,
}: VoteScreenProps) {
  const [voted, setVoted] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(timeoutSec)

  // Countdown local — el servidor tiene el timer real
  useEffect(() => {
    if (secondsLeft <= 0) return
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [secondsLeft])

  function handleVote(targetPlayerId: string) {
    if (voted) return
    setVoted(true)
    getSocket().emit(PLAYER_EVENTS.VOTE, {
      roomCode: room.code,
      targetPlayerId,
    })
  }

  const urgentColor = secondsLeft <= 5 ? 'text-red-400' : 'text-muted-foreground'

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-primary" />
          <h1 className="text-lg font-bold sm:text-xl">¿Quién ha doblado mejor?</h1>
        </div>
        <span className={`text-sm font-mono font-medium ${urgentColor}`}>
          {secondsLeft}s
        </span>
      </header>

      <div className="flex flex-col gap-3">
        {recordings.map((rec, i) => {
          const isSelf = rec.playerId === localPlayerId
          const canVote = !voted && !isSelf

          return (
            <Card key={rec.playerId} className="border-border/70 bg-card/80 backdrop-blur">
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    Doblaje #{i + 1}
                  </span>
                  <span className="font-semibold">
                    {rec.playerNickname}
                    {isSelf && (
                      <span className="ml-2 text-xs text-muted-foreground">(tú)</span>
                    )}
                  </span>
                  {rec.character && (
                    <span className="text-xs text-primary">🎭 {rec.character}</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Votos recibidos (visibles para todos) */}
                  {rec.votesReceived > 0 && (
                    <span className="text-sm font-medium text-primary">
                      👍 {rec.votesReceived}
                    </span>
                  )}

                  <Button
                    disabled={!canVote}
                    variant={voted && !isSelf ? 'secondary' : 'default'}
                    size="sm"
                    onClick={() => handleVote(rec.playerId)}
                  >
                    {isSelf ? 'Tú' : voted ? 'Votado' : 'Votar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {voted && (
        <p className="text-center text-sm text-muted-foreground">
          Voto enviado. Esperando al resto de jugadores…
        </p>
      )}
    </div>
  )
}

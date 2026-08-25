'use client'

import { Trophy, RotateCcw } from 'lucide-react'
import { ROOM_EVENTS, type RoundScore, type Room } from '@dub/shared-types'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getSocket } from '@/lib/socket'

interface ResultsProps {
  scores: RoundScore[]
  room: Room
  localPlayerId: string | null
  isLastRound: boolean
}

const MEDALS = ['🥇', '🥈', '🥉']

/**
 * Fase `results`: muestra el ranking de la ronda.
 * Solo el host puede iniciar la siguiente ronda o terminar la partida.
 */
export function Results({ scores, room, localPlayerId, isLastRound }: ResultsProps) {
  const isHost = room.players.find((p) => p.id === localPlayerId)?.isHost ?? false

  const sorted = [...scores].sort((a, b) => b.pointsThisRound - a.pointsThisRound)

  function handleNextRound() {
    getSocket().emit(ROOM_EVENTS.START, { code: room.code })
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <header className="flex items-center gap-2">
        <Trophy className="size-6 text-yellow-400" />
        <h1 className="text-xl font-bold sm:text-2xl">
          {isLastRound ? '🏆 Resultados finales' : `Resultados — Ronda ${room.round}`}
        </h1>
      </header>

      <div className="flex flex-col gap-3">
        {sorted.map((score, i) => {
          const isSelf = score.playerId === localPlayerId
          const medal = MEDALS[i] ?? `${i + 1}.`

          return (
            <Card
              key={score.playerId}
              className={`border-border/70 bg-card/80 backdrop-blur transition-all ${
                i === 0 ? 'border-yellow-400/40 bg-yellow-400/5' : ''
              } ${isSelf ? 'ring-1 ring-primary/50' : ''}`}
            >
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl w-8 text-center">{medal}</span>
                  <div className="flex flex-col">
                    <span className="font-semibold">
                      {score.nickname}
                      {isSelf && (
                        <span className="ml-2 text-xs text-muted-foreground">(tú)</span>
                      )}
                    </span>
                    {score.character && (
                      <span className="text-xs text-muted-foreground">
                        🎭 {score.character}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xl font-bold text-primary">
                    +{score.pointsThisRound}
                  </p>
                  <p className="text-xs text-muted-foreground">pts esta ronda</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Acción del host */}
      {isHost && (
        <div className="pt-2 flex justify-center">
          {isLastRound ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-center text-muted-foreground text-sm">
                🎉 ¡Partida terminada!
              </p>
              <Button variant="secondary" onClick={() => getSocket().emit(ROOM_EVENTS.LEAVE)}>
                Volver al inicio
              </Button>
            </div>
          ) : (
            <Button size="lg" className="gap-2" onClick={handleNextRound}>
              <RotateCcw className="size-4" />
              Siguiente ronda
            </Button>
          )}
        </div>
      )}

      {!isHost && (
        <p className="text-center text-sm text-muted-foreground">
          Esperando al host para continuar…
        </p>
      )}
    </div>
  )
}

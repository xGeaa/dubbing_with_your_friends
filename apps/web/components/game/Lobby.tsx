'use client'

import { useEffect, useState } from 'react'
import { Check, Copy, Crown, LoaderCircle, Play, Users } from 'lucide-react'
import { ROOM_EVENTS, type Player, type Room } from '@dub/shared-types'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getSocket } from '@/lib/socket'
import { MIN_PLAYERS_TO_START, buildInviteUrl, copyToClipboard } from '@/lib/room'
import { cn } from '@/lib/utils'

interface LobbyProps {
  room: Room
  localPlayerId: string | null
}

export function Lobby({ room, localPlayerId }: LobbyProps) {
  const localPlayer = room.players.find((player) => player.id === localPlayerId)
  const isHost = localPlayer?.isHost ?? false
  const host = room.players.find((player) => player.isHost)
  const hasEnoughPlayers = room.players.length >= MIN_PLAYERS_TO_START
  const [starting, setStarting] = useState(false)

  // Si el servidor rechaza el start, el error llega por `room:error` a la
  // página y la fase no cambia: liberamos el botón para poder reintentar.
  useEffect(() => {
    const socket = getSocket()
    const release = () => setStarting(false)
    socket.on(ROOM_EVENTS.ERROR, release)
    return () => {
      socket.off(ROOM_EVENTS.ERROR, release)
    }
  }, [])

  const handleStart = () => {
    if (!isHost || !hasEnoughPlayers || starting) return
    setStarting(true)
    getSocket().emit(ROOM_EVENTS.START, { code: room.code })
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <RoomCodeCard code={room.code} />

      <Card className="border-border/70 bg-card/80 backdrop-blur">
        <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Users className="size-4" />
              Jugadores
            </h2>
            <Badge variant="secondary">{room.players.length}</Badge>
          </div>

          <ul className="grid gap-2 sm:grid-cols-2">
            {room.players.map((player) => (
              <PlayerRow
                key={player.id}
                player={player}
                isLocal={player.id === localPlayerId}
              />
            ))}
          </ul>

          {!hasEnoughPlayers ? (
            <p className="text-center text-sm text-muted-foreground">
              Comparte el código con tus amigos: hacen falta al menos{' '}
              {MIN_PLAYERS_TO_START} jugadores para empezar.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {isHost ? (
        <div className="flex flex-col items-center gap-2">
          <Button
            size="lg"
            className={cn(
              'h-14 w-full text-base sm:text-lg',
              hasEnoughPlayers && !starting && 'animate-pulse-glow'
            )}
            onClick={handleStart}
            disabled={!hasEnoughPlayers || starting}
          >
            {starting ? <LoaderCircle className="animate-spin" /> : <Play />}
            {starting ? 'Empezando…' : '¡Empezar partida!'}
          </Button>
          {!hasEnoughPlayers ? (
            <p className="text-xs text-muted-foreground">
              Esperando a más jugadores…
            </p>
          ) : null}
        </div>
      ) : (
        <p className="flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin text-primary" />
          Esperando a que {host?.nickname ?? 'el anfitrión'} empiece la partida…
        </p>
      )}
    </div>
  )
}

function RoomCodeCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const ok = await copyToClipboard(buildInviteUrl(code))
    if (!ok) return
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="border-primary/30 bg-card/80 backdrop-blur">
      <CardContent className="flex flex-col items-center gap-3 p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Código de la sala
        </p>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copiar enlace de invitación"
          className="group flex items-center gap-3 rounded-xl px-3 py-1 transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="text-gradient-party font-mono text-5xl font-black tracking-[0.2em] sm:text-7xl">
            {code}
          </span>
          {copied ? (
            <Check className="size-6 text-primary" />
          ) : (
            <Copy className="size-6 text-muted-foreground transition-colors group-hover:text-primary" />
          )}
        </button>
        <p
          className="text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          {copied
            ? '¡Enlace de invitación copiado!'
            : 'Toca el código para copiar el enlace de invitación'}
        </p>
      </CardContent>
    </Card>
  )
}

function PlayerRow({ player, isLocal }: { player: Player; isLocal: boolean }) {
  return (
    <li
      className={cn(
        'flex animate-fade-in-up items-center gap-3 rounded-lg border border-border/70 bg-background/40 px-3 py-2.5',
        isLocal && 'border-primary/50 bg-primary/5'
      )}
    >
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full font-bold',
          player.isHost
            ? 'bg-crimson/15 text-crimson'
            : 'bg-secondary text-secondary-foreground'
        )}
        aria-hidden
      >
        {player.nickname.charAt(0).toUpperCase()}
      </span>

      <span className="min-w-0 flex-1 truncate font-semibold">
        {player.nickname}
      </span>

      {isLocal ? <Badge variant="outline">Tú</Badge> : null}
      {player.isHost ? (
        <Badge variant="crimson" title="Anfitrión de la sala">
          <Crown className="size-3" />
          Host
        </Badge>
      ) : null}
    </li>
  )
}

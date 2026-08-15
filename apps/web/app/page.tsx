'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { Clapperboard, LoaderCircle, LogIn, Mic, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ErrorMessage } from '@/components/game/ErrorMessage'
import { NicknameField } from '@/components/game/NicknameField'
import { RoomCodeInput } from '@/components/game/RoomCodeInput'
import { useRoomActions } from '@/hooks/useRoomActions'
import { isValidRoomCode } from '@/lib/room'

export default function HomePage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [code, setCode] = useState('')
  const { createRoom, pending, isPending, error } = useRoomActions()

  const canJoin = isValidRoomCode(code)

  const handleJoin = () => {
    if (!canJoin) return
    // `typedRoutes` no infiere rutas con query dinámica: casteamos a Route.
    router.push(`/join?code=${code}` as Route)
  }

  return (
    <main className="bg-stage flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-10 sm:py-16">
      <header className="flex animate-fade-in-up flex-col items-center gap-4 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          <Clapperboard className="size-3.5" />
          Party game de doblaje
        </span>
        <h1 className="text-gradient-party max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
          Dubbing With Your Friends
        </h1>
        <p className="max-w-md text-balance text-base text-muted-foreground sm:text-lg">
          Mira un clip. Dóblalo con tu voz. Vota el mejor doblaje.
        </p>
      </header>

      <Card className="w-full max-w-md animate-fade-in-up border-border/70 bg-card/80 shadow-xl backdrop-blur">
        <CardContent className="flex flex-col gap-6 p-6">
          <NicknameField
            value={nickname}
            onValueChange={setNickname}
            disabled={isPending}
          />

          <Button
            size="lg"
            className="h-14 w-full animate-pulse-glow text-base sm:text-lg"
            onClick={() => createRoom(nickname)}
            disabled={isPending}
          >
            {pending === 'create' ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Mic />
            )}
            {pending === 'create' ? 'Creando sala…' : 'Crear sala'}
          </Button>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              o únete con un código
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              handleJoin()
            }}
          >
            <RoomCodeInput
              value={code}
              onValueChange={setCode}
              disabled={isPending}
            />
            <Button
              type="submit"
              size="lg"
              variant="secondary"
              className="h-12 w-full"
              disabled={!canJoin || isPending}
            >
              <LogIn />
              Unirme
            </Button>
          </form>

          {error ? <ErrorMessage message={error} /> : null}
        </CardContent>
      </Card>

      <footer className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-3.5" /> A partir de 2 jugadores
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Mic className="size-3.5" /> Necesitas micrófono
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clapperboard className="size-3.5" /> 3 rondas por partida
        </span>
      </footer>
    </main>
  )
}

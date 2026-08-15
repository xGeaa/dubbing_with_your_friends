'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, LoaderCircle, LogIn } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ErrorMessage } from '@/components/game/ErrorMessage'
import { NicknameField } from '@/components/game/NicknameField'
import { RoomCodeInput } from '@/components/game/RoomCodeInput'
import { useRoomActions } from '@/hooks/useRoomActions'
import { isValidRoomCode, normalizeRoomCode } from '@/lib/room'

function JoinForm() {
  const searchParams = useSearchParams()
  const [code, setCode] = useState('')
  const [nickname, setNickname] = useState('')
  const { joinRoom, pending, isPending, error } = useRoomActions()

  // Prellena el código si venimos de la Home con `/join?code=XXXX`.
  useEffect(() => {
    const fromQuery = normalizeRoomCode(searchParams.get('code') ?? '')
    if (fromQuery) setCode(fromQuery)
  }, [searchParams])

  const canSubmit = isValidRoomCode(code) && !isPending

  return (
    <Card className="w-full max-w-md animate-fade-in-up border-border/70 bg-card/80 shadow-xl backdrop-blur">
      <CardHeader>
        <CardTitle className="text-2xl">Unirse a una sala</CardTitle>
        <CardDescription>
          Pide a tu amigo el código de 4 caracteres que aparece en su pantalla.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault()
            if (!canSubmit) return
            joinRoom(code, nickname)
          }}
        >
          <div className="flex flex-col gap-2">
            <label
              htmlFor="room-code"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Código de sala
            </label>
            <RoomCodeInput
              id="room-code"
              value={code}
              onValueChange={setCode}
              disabled={isPending}
              autoFocus
            />
          </div>

          <NicknameField
            value={nickname}
            onValueChange={setNickname}
            disabled={isPending}
          />

          <Button
            type="submit"
            size="lg"
            className="h-14 w-full text-base"
            disabled={!canSubmit}
          >
            {pending === 'join' ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <LogIn />
            )}
            {pending === 'join' ? 'Entrando…' : 'Entrar en la sala'}
          </Button>

          {error ? <ErrorMessage message={error} /> : null}
        </form>
      </CardContent>
    </Card>
  )
}

export default function JoinPage() {
  return (
    <main className="bg-stage flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10">
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <LoaderCircle className="size-8 animate-spin text-primary" />
          </div>
        }
      >
        <JoinForm />
      </Suspense>

      <Button variant="ghost" size="sm" asChild>
        <Link href="/">
          <ArrowLeft />
          Volver al inicio
        </Link>
      </Button>
    </main>
  )
}

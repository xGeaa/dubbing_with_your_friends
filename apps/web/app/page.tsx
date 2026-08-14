import { Mic, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-4 sm:p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          🎙️ Dubbing With Your Friends
        </h1>
        <p className="max-w-md text-muted-foreground">
          Mira un clip. Dóblalo. Vota el mejor doblaje.
        </p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Empieza a jugar</CardTitle>
          <CardDescription>
            Crea una sala nueva o únete con el código de tus amigos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Necesitas al menos 2 jugadores y un micrófono en cada dispositivo.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" className="w-full">
            <Mic />
            Crear sala
          </Button>
          <Button size="lg" variant="secondary" className="w-full">
            <Users />
            Unirse a sala
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}

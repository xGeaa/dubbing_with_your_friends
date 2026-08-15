import { Clapperboard } from 'lucide-react'
import type { GamePhase } from '@dub/shared-types'

import { Card, CardContent } from '@/components/ui/card'

const PHASE_LABELS: Record<GamePhase, string> = {
  lobby: 'Sala de espera',
  record: 'Grabación del doblaje',
  playback: 'Reproducción de los doblajes',
  vote: 'Votación',
  results: 'Resultados',
}

/**
 * Fases todavía no implementadas (ISSUE-012 en adelante).
 * El lobby ya deja la partida en `record`, así que mostramos un aviso claro
 * en lugar de una pantalla en blanco.
 */
export function PhasePlaceholder({ phase }: { phase: GamePhase }) {
  return (
    <Card className="w-full max-w-md border-border/70 bg-card/80 backdrop-blur">
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
        <Clapperboard className="size-10 text-primary" />
        <h2 className="text-xl font-bold">{PHASE_LABELS[phase]}</h2>
        <p className="text-sm text-muted-foreground">
          Esta fase todavía está en construcción. ¡Vuelve pronto!
        </p>
      </CardContent>
    </Card>
  )
}

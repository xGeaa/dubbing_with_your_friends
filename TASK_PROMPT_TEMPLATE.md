# Plantilla de Prompt de Tarea para IA

> Copia este template, rellena las secciones marcadas con `[...]` y pégalo al inicio de una conversación nueva con Claude u otra IA.  
> El objetivo es que la IA tenga todo el contexto sin que tengas que repetirlo cada vez.

---

```
=== CONTEXTO DEL PROYECTO ===

Proyecto: Dubbing With Your Friends
Tipo: Party Game web en tiempo real (como Jackbox/Gartic Phone)
Concepto: Jugadores se unen por código de sala, ven clips de vídeo sin audio, graban su doblaje y votan el mejor.

--- TECH STACK ---
- Frontend: Next.js 14 (App Router), TypeScript strict, Tailwind CSS, shadcn/ui, Zustand
- Backend: Node.js + Express + Socket.io (TypeScript)
- Storage: Supabase Storage (audio .webm)
- DB: Supabase PostgreSQL
- Vídeo: YouTube IFrame API (clips curados en tabla `clips`)
- Audio: MediaRecorder API (browser native)
- Monorepo: Turborepo + pnpm workspaces
- Deploy: Vercel (frontend) + Render (backend)

--- ESTRUCTURA DEL REPO ---
dub-with-friends/
├── apps/web/          → Next.js frontend
│   ├── app/           → App Router (pages)
│   ├── components/game/  → Lobby, VideoPlayer, AudioRecorder, Playback, VoteScreen, Results
│   ├── hooks/         → useSocket, useMediaRecorder, useGameState
│   ├── store/         → gameStore.ts (Zustand)
│   └── lib/           → socket.ts, supabase.ts, youtube.ts
├── apps/server/       → Node.js backend
│   └── src/
│       ├── socket/handlers/   → roomHandlers, gameHandlers, voteHandlers
│       ├── rooms/             → RoomManager.ts, GameStateMachine.ts
│       ├── routes/            → audio.ts, clips.ts
│       └── services/          → supabase.ts (admin client)
└── packages/shared-types/    → Tipos TypeScript compartidos (Room, Player, Clip, GamePhase, eventos Socket)

--- CONVENCIONES ---
- Commits: Conventional Commits (feat/fix/chore/docs/refactor)
- Ramas: feature/<nombre>, fix/<nombre>; PRs siempre a `develop`
- Sin `any` en TypeScript (a menos que sea inevitable, comentar por qué)
- Todos los eventos Socket.io deben usar el enum de `packages/shared-types/src/events.ts`
- Server Components por defecto en Next.js; `'use client'` solo cuando sea necesario
- No hay autenticación en el MVP; los jugadores son efímeros (nickname + socket ID)

--- FASE ACTUAL ---
[Indica aquí: MVP Fase 1 / Polish Fase 2 / Monetización Fase 3]

--- ESTADO ACTUAL DEL REPO ---
[Describe brevemente qué está implementado y qué no. Ej:
- RoomManager ✅, Socket events de lobby ✅, VideoPlayer ❌, AudioRecorder ❌]

=== TAREA A REALIZAR ===

Issue: [ISSUE-NNN: Título de la issue de GitHub]
Rama de trabajo: [feature/nombre-rama]

Descripción:
[Pega aquí la descripción completa de la issue de GITHUB_ISSUES_KANBAN.md]

Criterios de aceptación:
[Pega o escribe los acceptance criteria de la issue]

Archivos relevantes que ya existen (léelos antes de empezar):
- [ruta/al/archivo1.ts] — [qué hace]
- [ruta/al/archivo2.ts] — [qué hace]

Archivos que debes crear o modificar:
- [ruta/nuevo/archivo.ts] — [qué debe hacer]
- [ruta/existente/archivo.ts] — [qué cambios necesita]

=== INSTRUCCIONES PARA LA IA ===

1. Lee primero los archivos existentes que te indico antes de escribir código.
2. Mantén el estilo y convenciones del proyecto (TypeScript strict, imports nombrados, no default exports en utils).
3. Si necesitas instalar una nueva dependencia, indícamelo antes de proceder y justifica por qué.
4. Cuando termines, dame un resumen de:
   - Archivos creados o modificados
   - Decisiones de diseño tomadas (y alternativas descartadas)
   - Qué queda pendiente o qué deberías testear manualmente
5. No generes tests unitarios a menos que te lo pida explícitamente.
6. Si la tarea es ambigua en algún punto, haz una suposición razonable, impleméntala y documenta la suposición en un comentario `// NOTE:`.

Empieza leyendo los archivos relevantes y confirmando que entiendes la tarea antes de escribir código.
```

---

## Ejemplo de prompt relleno (ISSUE-014)

```
=== CONTEXTO DEL PROYECTO ===

Proyecto: Dubbing With Your Friends
[... contexto completo como arriba ...]

--- FASE ACTUAL ---
MVP Fase 1

--- ESTADO ACTUAL DEL REPO ---
- RoomManager ✅
- Socket.io sala (join/leave/lobby) ✅
- Zustand gameStore con Room y Player ✅
- VideoPlayer ✅ (YouTube IFrame, sincronizado)
- useMediaRecorder ❌ (esto es lo que vamos a construir)
- AudioRecorder component ❌

=== TAREA A REALIZAR ===

Issue: ISSUE-014: Frontend — useMediaRecorder hook
Rama de trabajo: feature/audio-recorder

Descripción:
Hook `useMediaRecorder` en `apps/web/hooks/useMediaRecorder.ts`:
- `requestPermission()` → `getUserMedia({ audio: true })` con manejo de errores
- `startRecording()` → inicia `MediaRecorder` en formato `audio/webm;codecs=opus`
- `stopRecording()` → devuelve `Blob` de audio
- Estado: `idle | requesting | recording | stopped | error`
- `errorMessage` descriptivo según el tipo de error (NotAllowedError, NotFoundError, etc.)

Criterios de aceptación:
- El hook funciona en Chrome y Firefox
- Si el usuario deniega el micro, el estado pasa a `error` con mensaje legible
- `stopRecording()` siempre devuelve un Blob aunque no haya audio

Archivos relevantes que ya existen (léelos antes de empezar):
- apps/web/hooks/useSocket.ts — patrón de hook singleton que estamos usando
- packages/shared-types/src/game.ts — tipos Player, Room, GamePhase

Archivos que debes crear o modificar:
- apps/web/hooks/useMediaRecorder.ts — crear desde cero

=== INSTRUCCIONES PARA LA IA ===
[... instrucciones estándar ...]
```

---

## Tips para usar bien este template

- **Una tarea = una conversación nueva.** No acumules tareas en el mismo contexto.
- **Actualiza el "Estado actual del repo"** antes de cada prompt para que la IA no asuma cosas incorrectas.
- **Si la tarea tiene dependencias** (ej: ISSUE-015 necesita ISSUE-014 completada), espera a terminar la primera antes de empezar la segunda.
- **Guarda los resúmenes** que te da la IA al final de cada tarea y actualiza el estado del repo en este template.

# GitHub Issues — Tablero Kanban Inicial

> Copia estas issues en GitHub Projects (vista Kanban) con las columnas:
> **Backlog → In Progress → In Review → Done**
>
> Labels sugeridos: `phase-1`, `phase-2`, `frontend`, `backend`, `infra`, `design`, `bug`, `content`

---

## 🟣 EPIC 0 — Setup & Fundamentos

### ISSUE-001: Inicializar monorepo con Turborepo y pnpm workspaces
**Labels:** `phase-1` `infra`
**Estimate:** 2h

Crear la estructura base del repositorio:
- Root `package.json` con `workspaces: ["apps/*", "packages/*"]`
- `turbo.json` con pipeline: `build → lint → typecheck → test`
- `apps/web` (Next.js 14) con TypeScript strict
- `apps/server` (Node.js + Express) con TypeScript strict
- `packages/shared-types` vacío pero referenciable

**Acceptance criteria:**
- `pnpm install` funciona desde la raíz
- `pnpm dev` arranca ambas apps sin error
- `pnpm typecheck` no reporta errores

---

### ISSUE-002: Configurar Tailwind CSS + shadcn/ui en apps/web
**Labels:** `phase-1` `frontend`
**Estimate:** 1h

- Instalar y configurar Tailwind CSS con el preset del proyecto
- Inicializar shadcn/ui con tema oscuro (por defecto para party games)
- Crear componente `<Button>` y `<Card>` de prueba en una página demo

---

### ISSUE-003: Configurar proyecto Supabase y ejecutar migraciones iniciales
**Labels:** `phase-1` `infra`
**Estimate:** 1h

- Crear proyecto en Supabase (free tier)
- Ejecutar `supabase/migrations/001_initial_schema.sql` (tablas: `clips`, `game_sessions`, `recordings`)
- Crear bucket `audio-recordings` en Supabase Storage (público para lectura)
- Documentar variables de entorno en `.env.example` de ambas apps

---

### ISSUE-004: Deploy inicial vacío en Vercel y Render
**Labels:** `phase-1` `infra`
**Estimate:** 1h

- Conectar repo a Vercel → deploy de `apps/web`
- Conectar repo a Render → deploy de `apps/server`
- Configurar variables de entorno en ambas plataformas
- Verificar que ambas URLs son accesibles

---

### ISSUE-005: Configurar GitHub Actions (CI pipeline)
**Labels:** `phase-1` `infra`
**Estimate:** 1h

Crear `.github/workflows/ci.yml`:
- Trigger: push a cualquier rama + PR a `develop` o `main`
- Jobs: install → lint → typecheck
- Opcional: ejecutar tests unitarios

---

## 🔵 EPIC 1A — Salas y Lobby

### ISSUE-006: Backend — RoomManager: crear y unirse a salas
**Labels:** `phase-1` `backend`
**Estimate:** 4h

Implementar `RoomManager` en `apps/server/src/rooms/RoomManager.ts`:
- `createRoom()` → genera código de 4 letras aleatorio único (evitar colisiones)
- `joinRoom(code, player)` → añade jugador a la sala
- `leaveRoom(code, playerId)` → limpia jugador; destruye sala si queda vacía
- `getRoom(code)` → devuelve estado completo
- Expiración automática de salas inactivas tras 2h (usar `setTimeout`)
- Datos en memoria (Map); no se persiste en DB para el MVP

**Types needed (`shared-types`):**
```typescript
type GamePhase = 'lobby' | 'record' | 'playback' | 'vote' | 'results'
interface Player { id: string; nickname: string; isHost: boolean; isReady: boolean }
interface Room { code: string; players: Player[]; phase: GamePhase; round: number }
```

---

### ISSUE-007: Backend — Socket.io: eventos de sala (join/leave/lobby)
**Labels:** `phase-1` `backend`
**Estimate:** 3h

Implementar handlers de Socket.io en `apps/server/src/socket/handlers/roomHandlers.ts`:
- `room:create` → devuelve `{ code }` al creador; crea sala en RoomManager
- `room:join` `{ code, nickname }` → añade jugador; broadcast `room:updated` con lista
- `room:leave` → limpia jugador; broadcast `room:updated`
- `room:start` (solo host) → cambia fase a `record`; emite `game:start`
- Todos los eventos deben estar tipados usando enums de `shared-types/events.ts`

---

### ISSUE-008: Frontend — Página Home: crear sala y unirse con código
**Labels:** `phase-1` `frontend`
**Estimate:** 3h

Página `/` (Home):
- Botón grande "Crear sala" → llama a socket `room:create` → redirige a `/room/[code]`
- Campo de texto (4 letras, auto-uppercase) + botón "Unirme" → emite `room:join`
- Campo de nickname opcional (si vacío → generar aleatorio tipo "BoldFox")

---

### ISSUE-009: Frontend — Página /room/[code]: Lobby en tiempo real
**Labels:** `phase-1` `frontend`
**Estimate:** 4h

Componente `<Lobby>`:
- Muestra código de sala en grande (con botón copiar al portapapeles)
- Lista de jugadores conectados (actualiza en tiempo real via `room:updated`)
- Indicador de host (corona o badge)
- Botón "¡Empezar!" visible solo para el host (deshabilitado si < 2 jugadores)
- Estado global en Zustand: `useGameStore` con `room`, `localPlayer`, `phase`

---

### ISSUE-010: Frontend — useSocket hook: gestión de conexión y reconexión
**Labels:** `phase-1` `frontend`
**Estimate:** 2h

Hook `useSocket` en `apps/web/hooks/useSocket.ts`:
- Singleton del cliente Socket.io (evitar múltiples conexiones)
- Reconexión automática con backoff exponencial
- Estado: `connected | disconnected | reconnecting`
- Toast de aviso cuando el jugador se desconecta o reconecta

---

## 🟢 EPIC 1B — Clips de Vídeo

### ISSUE-011: Backend — API GET /clips/random
**Labels:** `phase-1` `backend`
**Estimate:** 2h

Endpoint REST `GET /clips/random?exclude=id1,id2`:
- Devuelve un clip aleatorio de la tabla `clips` no incluido en `exclude`
- Si no quedan clips disponibles, devuelve el menos usado recientemente
- Response: `{ id, youtubeId, startSec, endSec, title, category }`

---

### ISSUE-012: Contenido — Seed inicial de 20 clips de vídeo (dominio público)
**Labels:** `phase-1` `content`
**Estimate:** 3h

Poblar `supabase/seed.sql` con 20 clips curados:
- Charlie Chaplin (archivo público)
- Clips de NASA (CC)
- Animaciones clásicas Fleischer Studios (dominio público post-1928)
- Clips de Internet Archive (archive.org) con licencia CC0
- Formato: `(youtube_id, start_sec, end_sec, title, category)`

> Verificar que cada clip: tiene < 45s, no tiene audio relevante, es adecuado para todos los públicos

---

### ISSUE-013: Frontend — Componente VideoPlayer con YouTube IFrame API
**Labels:** `phase-1` `frontend`
**Estimate:** 4h

Componente `<VideoPlayer clip={clip} onEnded={cb} />`:
- Carga YouTube IFrame API de forma lazy (evitar bloqueo de render)
- Reproduce el segmento `[startSec, endSec]` en muted automáticamente
- Expone métodos: `play()`, `pause()`, `seekTo(sec)`
- Sincronización: todos los clientes reciben el clip via `game:start` y hacen `play()` al mismo tiempo
- Manejo de error si el vídeo no está disponible en la región del usuario

---

## 🟡 EPIC 1C — Grabación de Audio

### ISSUE-014: Frontend — useMediaRecorder hook
**Labels:** `phase-1` `frontend`
**Estimate:** 5h

Hook `useMediaRecorder` en `apps/web/hooks/useMediaRecorder.ts`:
- `requestPermission()` → `getUserMedia({ audio: true })` con manejo de errores
- `startRecording()` → inicia `MediaRecorder` en formato `audio/webm;codecs=opus`
- `stopRecording()` → devuelve `Blob` de audio
- Estado: `idle | requesting | recording | stopped | error`
- `errorMessage` descriptivo según el tipo de error (NotAllowedError, NotFoundError, etc.)

---

### ISSUE-015: Frontend — Componente AudioRecorder con countdown
**Labels:** `phase-1` `frontend`
**Estimate:** 4h

Componente `<AudioRecorder duration={clipDuration} onComplete={uploadFn} />`:
- Botón "Grabar" (pide permiso de micro si aún no lo tiene)
- Barra de progreso / countdown sincronizado con el servidor
- Preview de la grabación: botón play para escuchar antes de enviar
- Botón "Re-grabar" (disponible solo antes del timeout)
- Al acabar el tiempo → auto-envía la última grabación (o silencio si no grabó)

---

### ISSUE-016: Backend — POST /audio/upload: recibir y subir a Supabase Storage
**Labels:** `phase-1` `backend`
**Estimate:** 3h

Endpoint `POST /audio/upload`:
- Recibe `multipart/form-data` con: `audioBlob` (webm), `roomCode`, `playerId`, `sessionId`
- Valida tamaño máximo (< 5MB), tipo MIME (`audio/webm`)
- Sube a Supabase Storage en path `/{roomCode}/{sessionId}/{playerId}.webm`
- Devuelve `{ url }` (URL pública del archivo)
- Emite `player:audioReady` via Socket.io al resto de la sala

---

## 🟠 EPIC 1D — Reproducción y Votación

### ISSUE-017: Backend — GameStateMachine: ciclo lobby→record→playback→vote→results
**Labels:** `phase-1` `backend`
**Estimate:** 5h

Finite State Machine en `apps/server/src/rooms/GameStateMachine.ts`:
- Transiciones: `lobby` → `record` (al iniciar) → `playback` (todos listos o timeout) → `vote` → `results` → `record` (nueva ronda) o `lobby` (fin)
- Timers controlados por el servidor (no confiar en el cliente)
- Emite eventos Socket.io en cada transición: `game:phaseChange { phase, data }`
- Configuración por sala: `{ roundDuration, maxRounds, voteTimeoutSec }`

---

### ISSUE-018: Frontend — Componente Playback: reproducir vídeo + audio de cada jugador
**Labels:** `phase-1` `frontend`
**Estimate:** 4h

Componente `<Playback recordings={recordings} clip={clip} />`:
- Reproduce vídeo (muted) sincronizado con el audio de cada jugador
- Indica "Doblaje #1 de #N" (sin revelar el nombre aún)
- Botón siguiente manual o avance automático entre grabaciones
- [SLOT ADS]: placeholder para anuncio entre cada reproducción

---

### ISSUE-019: Frontend — Componente VoteScreen: votar la mejor actuación
**Labels:** `phase-1` `frontend`
**Estimate:** 3h

Componente `<VoteScreen recordings={recordings} localPlayerId={id} />`:
- Revela el nombre de cada jugador tras escuchar su doblaje
- Botón de voto por cada grabación (no puede votarse a sí mismo)
- Un voto por jugador (los demás botones se deshabilitan al votar)
- Countdown: si el timer expira sin votar → voto omitido
- Backend: `POST vote` → cuando todos votan o timeout → emite `game:results`

---

### ISSUE-020: Frontend — Pantalla de Resultados
**Labels:** `phase-1` `frontend`
**Estimate:** 3h

Componente `<Results roundScores={[]} totalScores={[]} isLastRound={bool} />`:
- Ranking de la ronda actual con puntos ganados
- Ranking acumulado de la partida
- Animación de ganador (confetti o similar)
- Botón "Siguiente ronda" (host) o "Fin de partida" (host)
- [SLOT ADS]: placeholder para anuncio en pantalla de resultados

---

## 🔴 EPIC 2 — Polish (Fase 2, post-MVP)

### ISSUE-021: Animaciones con Framer Motion en transiciones de fase
**Labels:** `phase-2` `frontend`
**Estimate:** 3h

### ISSUE-022: Efectos de sonido UI (ding, aplausos, countdown beep)
**Labels:** `phase-2` `frontend`
**Estimate:** 2h

### ISSUE-023: Avatares generados por nickname (color + emoji determinístico)
**Labels:** `phase-2` `frontend`
**Estimate:** 2h

### ISSUE-024: PWA — manifest + service worker para instalar en móvil
**Labels:** `phase-2` `infra`
**Estimate:** 3h

### ISSUE-025: Tests E2E con Playwright — flujo completo de partida
**Labels:** `phase-2` `infra`
**Estimate:** 5h

---

## Configuración del Tablero Kanban en GitHub Projects

**Columnas:**
1. **📋 Backlog** — Issues creadas pero no asignadas
2. **🎯 Sprint Actual** — Seleccionadas para el sprint activo
3. **🔨 In Progress** — Asignadas y en desarrollo
4. **👀 In Review** — PR abierta, esperando revisión
5. **✅ Done** — Merged a `develop`

**Views recomendadas:**
- Vista principal: Kanban por columna
- Vista secundaria: Tabla filtrada por label (`phase-1` primero)
- Milestones: `MVP v0.1`, `Polish v0.2`, `Monetización v1.0`

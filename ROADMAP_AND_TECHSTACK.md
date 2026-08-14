# 🎙️ Dubbing With Your Friends — Roadmap & Tech Stack

> Documento de arquitectura técnica y planificación del proyecto.  
> Última actualización: 2026-08-14

---

## ✅ Visión Confirmada

**Dubbing With Your Friends** es un Party Game web en tiempo real donde un grupo de amigos:

1. Se une a una sala mediante un código de 4 letras (sin registro obligatorio)
2. Ve un clip de vídeo corto sin audio (animaciones, memes, dibujos animados)
3. Graba su propio doblaje usando el micrófono del dispositivo
4. Escucha los resultados de todos y vota al mejor doblaje
5. Repite con un nuevo clip hasta que acabe la partida

**Prioridades de negocio:** Low-Cost → Baja fricción → 0 copyright → Monetización con anuncios

---

## 🏗️ TECH STACK RECOMENDADO

### Por qué este stack y no otro

| Decisión | Elegido | Descartado | Razón |
|---|---|---|---|
| Frontend framework | **Next.js 14** | Vite+React, Vue, SvelteKit | SSR para SEO ads, App Router, deploy en Vercel gratis |
| Comunicación RT | **Socket.io** | WebRTC mesh, Pusher, Ably | WebRTC es complejo para salas grandes; Pusher cobra desde el inicio |
| Audio recording | **MediaRecorder API** (nativo) | WebRTC getUserMedia directo | MediaRecorder es más simple, graba blobs listos para subir |
| Backend runtime | **Node.js + Express** | Deno, Bun, Python | Ecosistema maduro, socket.io first-class, Render gratis |
| Storage audio | **Supabase Storage** | AWS S3, GCP, Cloudflare R2 | Free tier 1 GB, SDK sencillo, misma plataforma que la DB |
| Base de datos | **Supabase PostgreSQL** | Firebase, MongoDB, PlanetScale | Free tier generoso, SQL real, Realtime integrado |
| Video clips | **YouTube IFrame API** | Subir vídeos propios, Cloudinary | 0 costes de almacenamiento, sin copyright, millones de clips |
| Deploy frontend | **Vercel** | Netlify, Cloudflare Pages | Integración nativa con Next.js, dominio gratis, analytics |
| Deploy backend | **Render** | Railway, Fly.io, Heroku | Free tier con WebSockets, sin tarjeta de crédito al inicio |
| Estilos | **Tailwind CSS + shadcn/ui** | Material UI, Chakra | Velocidad de desarrollo, sin overhead de runtime CSS |
| Estado global | **Zustand** | Redux, Jotai, Context API | Minimal boilerplate, perfecto para estado de sala de juego |

---

## 📦 ARQUITECTURA DE SISTEMA

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                     │
│                                                              │
│  Next.js 14 App (Vercel)                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Lobby /     │  │  Game Room   │  │  Results &        │  │
│  │  Join Room   │  │  (Recording) │  │  Voting Screen    │  │
│  └──────────────┘  └──────────────┘  └───────────────────┘  │
│         │                  │                    │            │
│  MediaRecorder API    YouTube IFrame       Socket.io Client  │
└─────────────────────────────────────────────────────────────┘
                             │ Socket.io
                             │ HTTP REST
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (Render Free Tier)                   │
│                                                              │
│  Node.js + Express + Socket.io                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Room Manager (en memoria)                             │  │
│  │  - Crea/destruye salas efímeras                        │  │
│  │  - Estado de partida (fase, ronda, votos)              │  │
│  │  - Timer de grabación sincronizado                     │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  API REST                                              │  │
│  │  POST /rooms         → crea sala, devuelve código      │  │
│  │  POST /audio/upload  → recibe blob, sube a Supabase    │  │
│  │  GET  /clips         → devuelve clips curados          │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │   Supabase   │ │   Supabase   │ │  YouTube     │
     │  PostgreSQL  │ │   Storage    │ │  IFrame API  │
     │  (Partidas   │ │  (Audios .   │ │  (Clips sin  │
     │   y scores)  │ │   webm/mp3)  │ │   copyright) │
     └──────────────┘ └──────────────┘ └──────────────┘
```

### Flujo de una partida (Happy Path)

```
Host abre /create
  → Backend genera código sala (ej: KRTX)
  → Host entra a /room/KRTX
  → Socket.io: evento "host:connected"

Jugadores abren /join → teclean KRTX
  → Socket.io: evento "player:joined" (nickname aleatorio o elegido)
  → Lobby muestra lista de jugadores en tiempo real

Host pulsa "¡Empezar!"
  → Socket.io broadcast: "game:start" { clip: { youtubeId, startSec, endSec, duration } }
  → Todos los clientes cargan el mismo clip de YouTube (sincronizado)
  → Clip se reproduce en silencio (muted IFrame)

Fase RECORD (30s)
  → MediaRecorder graba audio del micro
  → Timer cuenta atrás sincronizado (servidor)
  → Al acabar: cliente hace POST /audio/upload con el blob
  → Backend devuelve URL de Supabase Storage
  → Socket.io: jugador emite "player:audioReady"

Fase PLAYBACK (todos listos o timeout)
  → Backend emite orden de audios (aleatorio)
  → Cada cliente reproduce: vídeo + audio de Supabase URL
  → [AQUÍ: slot para anuncio entre reproducciones]

Fase VOTE
  → Cada jugador vota (no puede votarse a sí mismo)
  → Backend recoge votos, calcula puntos
  → Socket.io broadcast: "game:results" { scores, winner }
  → [AQUÍ: pantalla de resultados = slot para anuncio]

¿Otra ronda?
  → Repite desde Fase RECORD con nuevo clip
```

---

## 🗺️ ROADMAP DE DESARROLLO

### FASE 0 — Setup & Fundamentos (Semana 1)
*Objetivo: repo listo, entorno local funcionando, deploy vacío en producción*

- [ ] Inicializar monorepo (`apps/web` + `apps/server`)
- [ ] Configurar Next.js 14, Tailwind, shadcn/ui
- [ ] Configurar Node.js + Express + Socket.io
- [ ] Crear proyecto en Supabase (DB + Storage bucket `audio-recordings`)
- [ ] Deploy inicial en Vercel (frontend) y Render (backend)
- [ ] Variables de entorno documentadas en `.env.example`
- [ ] GitHub Actions: lint + type-check en cada PR

---

### FASE 1 — MVP Funcional (Semanas 2–5)
*Objetivo: partida completa jugable de principio a fin, aunque sea fea*

#### 1A — Salas y Lobby (Semana 2)
- [ ] Página `/` con botones "Crear sala" y "Unirme con código"
- [ ] Página `/room/[code]` — sala dinámica
- [ ] Backend: `RoomManager` en memoria (Map de salas)
  - Generación de código de 4 letras
  - Join/leave con Socket.io
  - Expira sala tras 2h de inactividad
- [ ] Lobby en tiempo real: lista de jugadores conectados
- [ ] Sistema de nickname: aleatorio (adj+animal) o personalizable
- [ ] Estado: sólo host puede iniciar partida

#### 1B — Reproductor de Clips (Semana 3)
- [ ] Integrar YouTube IFrame API en modo muted
- [ ] Base de datos de clips curados (tabla `clips` en Supabase)
  - Campos: `youtube_id`, `start_sec`, `end_sec`, `title`, `category`
  - Seed inicial: 20 clips de dominio público o CC (Chaplin, archivos NASA, etc.)
- [ ] API `GET /clips/random` → devuelve clip sin repetir en la sesión
- [ ] Sincronización: todos los jugadores reproducen el mismo segmento

#### 1C — Grabación de Audio (Semana 3–4)
- [ ] Botón "Grabar" → solicita permiso de micro (`getUserMedia`)
- [ ] `MediaRecorder` graba mientras se reproduce el vídeo
- [ ] Timer visual countdown sincronizado con el servidor
- [ ] Grabación se detiene automáticamente al acabar el clip
- [ ] Preview: jugador puede escuchar su grabación antes de confirmar
- [ ] `POST /audio/upload` → sube `.webm` a Supabase Storage
- [ ] Manejo de errores: micro denegado, timeout, reconexión

#### 1D — Reproducción y Votación (Semana 4–5)
- [ ] Fase Playback: reproduce vídeo + audio de cada jugador en orden
- [ ] Indicador "Doblado por: [Nickname]" (revelado después)
- [ ] Fase Vote: botones para votar (thumb up, 1 voto por jugador)
- [ ] Pantalla de resultados con ranking y puntuación
- [ ] Botón "Siguiente ronda" (host) — nuevo clip
- [ ] Botón "Fin de partida" → pantalla de ganador final

#### 1E — Polish mínimo de UI (Semana 5)
- [ ] Diseño responsive (mobile-first)
- [ ] Estados de carga (skeleton screens)
- [ ] Feedback de errores (toast notifications)
- [ ] Animaciones básicas con Framer Motion (fade in/out de fases)

**Entregable de Fase 1:** URL pública funcional, 4+ personas pueden jugar una partida completa

---

### FASE 2 — Polish, UX & Contenido (Semanas 6–9)
*Objetivo: que sea divertido de verdad y fácil de compartir*

- [ ] Pantalla de espera con música de fondo (loops libres de copyright)
- [ ] Efectos de sonido UI (ding de votación, aplausos, etc.)
- [ ] Animaciones de entrada al lobby (avatares pixelados generados)
- [ ] Sistema de "Reacciones" durante el playback (emojis animados)
- [ ] Historial de partidas (tabla `game_sessions` en Supabase)
- [ ] Perfil ligero: guardar nickname en localStorage, historial de partidas propias
- [ ] Ampliar librería de clips a 100+ (curados a mano + categorías: acción, comedia, drama)
- [ ] Modo espectador (unirse a sala sin grabar)
- [ ] Compartir resultado a redes (imagen generada con OG tags)
- [ ] PWA: instalar en móvil como app (manifest + service worker básico)
- [ ] Tests E2E con Playwright (flujo completo de partida)

---

### FASE 3 — Monetización & Escalabilidad (Semanas 10–14)
*Objetivo: generar ingresos, aguantar picos de tráfico*

#### Monetización
- [ ] Integrar Google AdSense (aprobación previa necesaria)
  - Slot 1: pantalla de carga inicial (antes de entrar a sala)
  - Slot 2: entre reproducción de doblajes
  - Slot 3: pantalla de resultados finales
- [ ] Interstitial ads respetan Game Loop (no cortan la experiencia)
- [ ] Plan premium (opcional): sala privada sin anuncios, clips extra, avatares custom
- [ ] Stripe para pagos (si se añade premium)

#### Escalabilidad
- [ ] Migrar Socket.io a modo cluster con `socket.io-redis` adapter
- [ ] Redis para estado de salas (en lugar de in-memory) → salas sobreviven restart
- [ ] CDN para archivos de audio (Cloudflare R2 o Supabase con CDN activado)
- [ ] Rate limiting en API de uploads (evitar abuso)
- [ ] Monitoreo: Sentry (errores) + Posthog (analytics de producto, free)
- [ ] Tests de carga con k6 (simular 50 salas simultáneas)

---

## 📁 ESTRUCTURA DEL REPOSITORIO (Monorepo)

```
dub-with-friends/
├── apps/
│   ├── web/                          # Next.js 14 (frontend)
│   │   ├── app/
│   │   │   ├── (game)/
│   │   │   │   ├── room/[code]/
│   │   │   │   │   ├── page.tsx      # Sala de juego
│   │   │   │   │   └── layout.tsx
│   │   │   │   └── join/page.tsx     # Formulario unirse
│   │   │   ├── page.tsx              # Home / landing
│   │   │   ├── layout.tsx            # Root layout (fonts, providers)
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── game/
│   │   │   │   ├── Lobby.tsx
│   │   │   │   ├── VideoPlayer.tsx
│   │   │   │   ├── AudioRecorder.tsx
│   │   │   │   ├── Playback.tsx
│   │   │   │   ├── VoteScreen.tsx
│   │   │   │   └── Results.tsx
│   │   │   └── ui/                   # shadcn/ui components
│   │   ├── hooks/
│   │   │   ├── useSocket.ts
│   │   │   ├── useMediaRecorder.ts
│   │   │   └── useGameState.ts
│   │   ├── lib/
│   │   │   ├── socket.ts             # Socket.io client singleton
│   │   │   ├── supabase.ts           # Supabase client
│   │   │   └── youtube.ts            # IFrame API helpers
│   │   ├── store/
│   │   │   └── gameStore.ts          # Zustand global state
│   │   ├── types/
│   │   │   └── game.ts               # Tipos compartidos (Room, Player, Clip…)
│   │   ├── public/
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── server/                       # Node.js + Express + Socket.io
│       ├── src/
│       │   ├── index.ts              # Entry point
│       │   ├── socket/
│       │   │   ├── index.ts          # Socket.io setup
│       │   │   ├── handlers/
│       │   │   │   ├── roomHandlers.ts
│       │   │   │   ├── gameHandlers.ts
│       │   │   │   └── voteHandlers.ts
│       │   │   └── events.ts         # Enum de eventos (evita strings mágicos)
│       │   ├── rooms/
│       │   │   ├── RoomManager.ts    # Lógica de salas en memoria
│       │   │   └── GameStateMachine.ts # FSM: lobby→record→playback→vote→results
│       │   ├── routes/
│       │   │   ├── audio.ts          # POST /audio/upload
│       │   │   └── clips.ts          # GET /clips/random
│       │   ├── services/
│       │   │   └── supabase.ts       # Supabase admin client
│       │   └── types/
│       │       └── game.ts           # Tipos compartidos (importados del package)
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   └── shared-types/                 # Tipos TypeScript compartidos
│       ├── src/
│       │   ├── game.ts               # Room, Player, Clip, GamePhase, etc.
│       │   └── events.ts             # Socket event payloads tipados
│       └── package.json
│
├── supabase/
│   ├── migrations/                   # SQL migrations
│   │   └── 001_initial_schema.sql
│   └── seed.sql                      # Clips iniciales de ejemplo
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Lint + typecheck en PRs
│   │   └── deploy.yml                # Deploy a Vercel/Render en merge a main
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── pull_request_template.md
│
├── .env.example                      # Variables de entorno documentadas
├── .gitignore
├── README.md
├── CONTRIBUTING.md
├── turbo.json                        # Turborepo config (build pipeline)
└── package.json                      # Root package.json (workspaces)
```

---

## 💰 ESTIMACIÓN DE COSTES MENSUALES (MVP → Escala)

| Servicio | Tier gratuito | Coste escala media |
|---|---|---|
| Vercel (frontend) | ✅ Free (hobby) | $20/mes (Pro) |
| Render (backend) | ✅ Free (spin-down) | $7/mes (Starter) |
| Supabase (DB + Storage) | ✅ Free (500MB DB, 1GB storage) | $25/mes (Pro) |
| YouTube IFrame API | ✅ Gratis | Gratis (siempre) |
| Dominio .com | — | ~$12/año |
| **TOTAL MVP** | **$0/mes** | **~$52/mes** |

> ⚠️ **Truco anti-cold-start de Render:** Usar UptimeRobot (gratis) para hacer ping al servidor cada 14 min y evitar que duerma en el free tier.

---

## 🔐 VARIABLES DE ENTORNO (`.env.example`)

```bash
# === FRONTEND (apps/web/.env.local) ===
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# === BACKEND (apps/server/.env) ===
PORT=3001
CLIENT_URL=http://localhost:3000
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
AUDIO_BUCKET_NAME=audio-recordings

# === PRODUCCIÓN (añadir en Vercel/Render dashboard) ===
NODE_ENV=production
```

---

## 📊 SCHEMA DE BASE DE DATOS (Supabase)

```sql
-- Clips de vídeo curados
CREATE TABLE clips (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id  TEXT NOT NULL,
  start_sec   INTEGER NOT NULL DEFAULT 0,
  end_sec     INTEGER NOT NULL,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL,  -- 'comedy', 'action', 'animation', 'classic'
  language    TEXT DEFAULT 'any',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Sesiones de juego (para analytics e historial)
CREATE TABLE game_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code   CHAR(4) NOT NULL,
  clip_id     UUID REFERENCES clips(id),
  started_at  TIMESTAMPTZ DEFAULT NOW(),
  ended_at    TIMESTAMPTZ,
  player_count INTEGER
);

-- Grabaciones de audio (metadatos; el archivo está en Storage)
CREATE TABLE recordings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id UUID REFERENCES game_sessions(id),
  player_nickname TEXT NOT NULL,
  storage_path    TEXT NOT NULL,  -- path en Supabase Storage
  votes_received  INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: solo el backend (service role) puede escribir
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
```

---

*Siguiente entrega: README.md · .gitignore · CONTRIBUTING.md · Issues iniciales · Plantilla de Prompt de Tarea*

#!/bin/bash
# =============================================================================
# Dubbing With Your Friends — Monorepo Scaffold
# Ejecuta desde la raíz del repo: bash setup.sh
# =============================================================================
set -e

echo "🎙️  Scaffolding Dubbing With Your Friends..."

# ── Directorios ───────────────────────────────────────────────────────────────
mkdir -p "apps/web/app/(game)/room/[code]"
mkdir -p "apps/web/app/(game)/join"
mkdir -p apps/web/components/{game,ui}
mkdir -p apps/web/{hooks,lib,store,types,public}
mkdir -p apps/server/src/socket/handlers
mkdir -p apps/server/src/{rooms,routes,services,types}
mkdir -p packages/shared-types/src
mkdir -p supabase/migrations
mkdir -p .github/workflows
mkdir -p .github/ISSUE_TEMPLATE

# ── Root ──────────────────────────────────────────────────────────────────────
cat > package.json << 'EOF'
{
  "name": "dubbing-with-your-friends",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "test": "turbo test"
  },
  "devDependencies": {
    "turbo": "^2.1.0",
    "typescript": "^5.4.5"
  },
  "engines": {
    "node": ">=20",
    "pnpm": ">=9"
  }
}
EOF

cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF

cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "!.next/cache/**"]
    },
    "dev": {
      "persistent": true,
      "cache": false
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
EOF

# ── packages/shared-types ─────────────────────────────────────────────────────
cat > packages/shared-types/package.json << 'EOF'
{
  "name": "@dub/shared-types",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  }
}
EOF

cat > packages/shared-types/src/game.ts << 'EOF'
export type GamePhase = 'lobby' | 'record' | 'playback' | 'vote' | 'results'

export interface Player {
  id: string
  nickname: string
  isHost: boolean
  isReady: boolean
}

export interface Clip {
  id: string
  youtubeId: string
  startSec: number
  endSec: number
  title: string
  category: string
}

export interface Recording {
  playerId: string
  playerNickname: string
  audioUrl: string
  votesReceived: number
}

export interface Room {
  code: string
  players: Player[]
  phase: GamePhase
  round: number
  maxRounds: number
  currentClip: Clip | null
  recordings: Recording[]
}

export interface RoundScore {
  playerId: string
  nickname: string
  pointsThisRound: number
  totalPoints: number
}
EOF

cat > packages/shared-types/src/events.ts << 'EOF'
// Socket.io event names — usar siempre estas constantes, nunca strings directos

export const ROOM_EVENTS = {
  CREATE: 'room:create',
  JOIN: 'room:join',
  LEAVE: 'room:leave',
  UPDATED: 'room:updated',
  START: 'room:start',
  ERROR: 'room:error',
} as const

export const GAME_EVENTS = {
  START: 'game:start',
  PHASE_CHANGE: 'game:phaseChange',
  RESULTS: 'game:results',
  NEXT_ROUND: 'game:nextRound',
  END: 'game:end',
} as const

export const PLAYER_EVENTS = {
  AUDIO_READY: 'player:audioReady',
  VOTE: 'player:vote',
} as const

// Payload types
export interface RoomCreatePayload { nickname: string }
export interface RoomJoinPayload { code: string; nickname: string }
export interface RoomUpdatedPayload { room: import('./game').Room }
export interface RoomErrorPayload { message: string }
export interface GameStartPayload { clip: import('./game').Clip; roundDurationSec: number }
export interface PhaseChangePayload { phase: import('./game').GamePhase; data?: unknown }
export interface PlayerAudioReadyPayload { playerId: string; audioUrl: string }
export interface PlayerVotePayload { targetPlayerId: string }
export interface GameResultsPayload { scores: import('./game').RoundScore[]; isLastRound: boolean }
EOF

cat > packages/shared-types/src/index.ts << 'EOF'
export * from './game'
export * from './events'
EOF

# ── apps/web ──────────────────────────────────────────────────────────────────
cat > apps/web/package.json << 'EOF'
{
  "name": "@dub/web",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@dub/shared-types": "workspace:*",
    "next": "^14.2.3",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "socket.io-client": "^4.7.5",
    "zustand": "^4.5.2",
    "@supabase/supabase-js": "^2.43.1"
  },
  "devDependencies": {
    "@types/node": "^20.12.12",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    "typescript": "^5.4.5"
  }
}
EOF

cat > apps/web/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

cat > apps/web/next.config.ts << 'EOF'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true,
  },
}

export default nextConfig
EOF

cat > apps/web/tailwind.config.ts << 'EOF'
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
EOF

cat > apps/web/postcss.config.mjs << 'EOF'
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

export default config
EOF

cat > apps/web/.env.example << 'EOF'
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EOF

cat > apps/web/app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #09090b;
  --foreground: #fafafa;
}

body {
  background: var(--background);
  color: var(--foreground);
}
EOF

cat > apps/web/app/layout.tsx << 'EOF'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dubbing With Your Friends',
  description: 'Watch a clip. Dub it. Vote for the best one.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-50 antialiased">
        {children}
      </body>
    </html>
  )
}
EOF

cat > apps/web/app/page.tsx << 'EOF'
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-4xl font-bold tracking-tight">
        🎙️ Dubbing With Your Friends
      </h1>
      <p className="text-zinc-400 text-center max-w-md">
        Watch a clip. Dub it. Vote for the best one.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button className="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold transition-colors">
          Create Room
        </button>
        <button className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-semibold transition-colors">
          Join Room
        </button>
      </div>
    </main>
  )
}
EOF

cat > apps/web/lib/socket.ts << 'EOF'
import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3001', {
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })
  }
  return socket
}
EOF

cat > apps/web/store/gameStore.ts << 'EOF'
import { create } from 'zustand'
import type { Room, Player, GamePhase } from '@dub/shared-types'

interface GameStore {
  room: Room | null
  localPlayer: Player | null
  phase: GamePhase
  setRoom: (room: Room) => void
  setLocalPlayer: (player: Player) => void
  setPhase: (phase: GamePhase) => void
  reset: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  room: null,
  localPlayer: null,
  phase: 'lobby',
  setRoom: (room) => set({ room, phase: room.phase }),
  setLocalPlayer: (localPlayer) => set({ localPlayer }),
  setPhase: (phase) => set({ phase }),
  reset: () => set({ room: null, localPlayer: null, phase: 'lobby' }),
}))
EOF

# ── apps/server ───────────────────────────────────────────────────────────────
cat > apps/server/package.json << 'EOF'
{
  "name": "@dub/server",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "echo 'no linter configured yet'",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@dub/shared-types": "workspace:*",
    "@supabase/supabase-js": "^2.43.1",
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "multer": "^1.4.5-lts.1",
    "socket.io": "^4.7.5"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.12.12",
    "tsx": "^4.11.0",
    "typescript": "^5.4.5"
  }
}
EOF

cat > apps/server/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "paths": {
      "@dub/shared-types": ["../../packages/shared-types/src/index.ts"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

cat > apps/server/.env.example << 'EOF'
PORT=3001
CLIENT_URL=http://localhost:3000
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
AUDIO_BUCKET_NAME=audio-recordings
EOF

cat > apps/server/src/index.ts << 'EOF'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL ?? 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

app.use(cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:3000' }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`)

  socket.on('disconnect', () => {
    console.log(`[socket] disconnected: ${socket.id}`)
  })
})

const PORT = process.env.PORT ?? 3001
httpServer.listen(PORT, () => {
  console.log(`🎙️  Server running on port ${PORT}`)
})
EOF

# ── Supabase ──────────────────────────────────────────────────────────────────
cat > supabase/migrations/001_initial_schema.sql << 'EOF'
-- Clips de vídeo curados
CREATE TABLE clips (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id  TEXT NOT NULL,
  start_sec   INTEGER NOT NULL DEFAULT 0,
  end_sec     INTEGER NOT NULL,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL,
  language    TEXT DEFAULT 'any',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Sesiones de juego
CREATE TABLE game_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code    CHAR(4) NOT NULL,
  clip_id      UUID REFERENCES clips(id),
  started_at   TIMESTAMPTZ DEFAULT NOW(),
  ended_at     TIMESTAMPTZ,
  player_count INTEGER
);

-- Grabaciones de audio
CREATE TABLE recordings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id  UUID REFERENCES game_sessions(id),
  player_nickname  TEXT NOT NULL,
  storage_path     TEXT NOT NULL,
  votes_received   INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
EOF

cat > supabase/seed.sql << 'EOF'
-- Seed inicial de clips (dominio público / CC)
-- Añade más clips siguiendo el mismo formato

INSERT INTO clips (youtube_id, start_sec, end_sec, title, category) VALUES
  ('_oHByo8ixxg', 0, 30, 'Chaplin — The Kid (1921)', 'classic'),
  ('HkCqKqFpNH4', 0, 25, 'Chaplin — Modern Times (1936)', 'classic');
-- TODO: añadir más clips en ISSUE-012
EOF

# ── GitHub Actions ────────────────────────────────────────────────────────────
cat > .github/workflows/ci.yml << 'EOF'
name: CI

on:
  push:
    branches: ['**']
  pull_request:
    branches: [main, develop]

jobs:
  ci:
    name: Lint & Typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - run: pnpm lint

      - run: pnpm typecheck
EOF

cat > .github/pull_request_template.md << 'EOF'
## Qué hace este PR

<!-- Describe brevemente los cambios -->

## Issue relacionada

Closes #

## Checklist

- [ ] `pnpm lint` sin errores
- [ ] `pnpm typecheck` sin errores
- [ ] Probado manualmente en local
- [ ] Tipos nuevos compartidos añadidos a `packages/shared-types`
EOF

# ── Fin ───────────────────────────────────────────────────────────────────────
echo ""
echo "✅  Scaffold completado. Estructura creada:"
find . -not -path '*/node_modules/*' -not -path '*/.git/*' -not -name '.DS_Store' | sort | head -60
echo ""
echo "Próximos pasos:"
echo "  1. pnpm install"
echo "  2. cp apps/web/.env.example apps/web/.env.local   → rellena las variables"
echo "  3. cp apps/server/.env.example apps/server/.env   → rellena las variables"
echo "  4. pnpm dev"
echo ""
echo "🎙️  ¡A dublar!"

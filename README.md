# 🎙️ Dubbing With Your Friends

> The party game where you dub video clips and your friends vote on the best performance.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)

---

## What is this?

**Dubbing With Your Friends** is a browser-based party game, no installation required. Here's how a round works:

1. **Create a room** — you get a 4-letter code (e.g. `KRTX`)
2. **Share the code** — friends join from their phone or PC
3. **Watch a clip** — a short video plays on everyone's screen, with no audio
4. **Dub it** — everyone records their own voice acting in real time
5. **Vote** — all recordings play back anonymously, and the group votes for the best one
6. **Repeat** — next round, new clip

No accounts needed. Just a code and a microphone.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, shadcn/ui |
| State | Zustand |
| Real-time | Socket.io |
| Audio | MediaRecorder API (browser native) |
| Backend | Node.js + Express + Socket.io |
| Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage |
| Video | YouTube IFrame API |
| Monorepo | Turborepo + pnpm workspaces |
| Deploy | Vercel (web) + Render (server) |

---

## Project Structure

```
dub-with-friends/
├── apps/
│   ├── web/       # Next.js frontend
│   └── server/    # Node.js + Socket.io backend
├── packages/
│   └── shared-types/  # TypeScript types shared across apps
└── supabase/      # DB migrations and seed data
```

---

## Local Development

### Prerequisites

- Node.js 20+
- pnpm 9+
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/dub-with-friends.git
cd dub-with-friends
pnpm install
```

### 2. Set up environment variables

```bash
# Frontend
cp apps/web/.env.example apps/web/.env.local

# Backend
cp apps/server/.env.example apps/server/.env
```

Fill in your Supabase URL, keys, and any other values listed in the `.env.example` files.

### 3. Set up the database

Run the migrations against your Supabase project:

```bash
# Using the Supabase CLI
supabase db push

# Or apply manually via the Supabase dashboard SQL editor:
# → Copy the contents of supabase/migrations/001_initial_schema.sql
```

Optionally seed some video clips:

```bash
supabase db seed  # runs supabase/seed.sql
```

### 4. Start the dev servers

```bash
pnpm dev
```

This starts both apps in parallel via Turborepo:

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:3001](http://localhost:3001)

---

## Running a game locally

1. Open [http://localhost:3000](http://localhost:3000) in one browser tab → click **Create Room**
2. Copy the 4-letter room code
3. Open a second tab (or browser) → click **Join Room** → enter the code
4. Back in the first tab, click **Start Game**
5. Grant microphone access when prompted and start dubbing

> **Tip:** Use Chrome for best MediaRecorder compatibility. Firefox works too.

---

## Deployment

### Frontend (Vercel)

```bash
# Connect your GitHub repo to Vercel and set env vars in the dashboard.
# Or deploy via CLI:
npx vercel --cwd apps/web
```

### Backend (Render)

1. Create a new **Web Service** on [Render](https://render.com)
2. Root directory: **leave empty** (the repository root)
3. Build command: `pnpm install --frozen-lockfile && pnpm build --filter @dub/server...`
4. Start command: `node apps/server/dist/index.js`
5. Add environment variables from `apps/server/.env.example`

> **Why the repository root and not `apps/server`?**
> `@dub/server` depends on `@dub/shared-types`, which is compiled to its own
> `dist/`. Building from inside `apps/server` skips that step and `tsc` fails to
> resolve the shared types. The trailing `...` in `--filter @dub/server...` tells
> Turborepo to build the package's dependencies first.

> After deploying the backend, update `NEXT_PUBLIC_SERVER_URL` in Vercel with the Render URL.

---

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

**Quick steps:**

```bash
# Create a feature branch
git checkout develop
git checkout -b feature/your-feature-name

# Make changes, then:
pnpm lint
pnpm typecheck

# Commit and push
git push origin feature/your-feature-name
# Open a PR against `develop`
```

---

## License

MIT © 2026 — See [LICENSE](./LICENSE)

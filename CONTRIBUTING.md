# Contributing to Dubbing With Your Friends

Thanks for your interest in contributing! This document explains how we work together as a team (human + AI, or multiple developers).

---

## Branch Strategy (Simple GitFlow)

We use three permanent branches and short-lived feature branches:

```
main          ← Production. Only merges from develop via reviewed PR.
  │
develop       ← Integration branch. All features merge here first.
  │
  ├── feature/lobby-ui
  ├── feature/audio-recorder
  ├── feature/vote-screen
  └── fix/socket-reconnect
```

### Branch naming

| Type | Pattern | Example |
|---|---|---|
| New feature | `feature/<short-description>` | `feature/audio-recorder` |
| Bug fix | `fix/<short-description>` | `fix/socket-reconnect-loop` |
| Chore / config | `chore/<short-description>` | `chore/update-dependencies` |
| Hotfix (prod) | `hotfix/<short-description>` | `hotfix/room-code-collision` |

---

## Workflow Step by Step

### Starting a new task

```bash
# Always branch off develop, never off main
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### During development

- Keep commits small and focused (one logical change per commit)
- Use the commit message format below
- Run checks before pushing:

```bash
pnpm lint        # ESLint
pnpm typecheck   # TypeScript
pnpm test        # Unit tests (if applicable)
```

### Commit message format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

# Examples:
feat(audio): add MediaRecorder hook with countdown timer
fix(socket): handle reconnection when player drops mid-game
chore(deps): upgrade socket.io to v4.7
docs(readme): add Render deployment instructions
refactor(rooms): extract RoomManager into its own class
```

**Types:** `feat` · `fix` · `chore` · `docs` · `refactor` · `test` · `style` · `perf`

### Opening a Pull Request

1. Push your branch: `git push origin feature/your-feature-name`
2. Open a PR against **`develop`** (never directly to `main`)
3. Fill in the PR template (auto-loaded from `.github/pull_request_template.md`)
4. Assign yourself and add relevant labels
5. Request at least one review before merging

### Merging to main (releases)

Only the project lead merges `develop → main`. This triggers the deploy workflow.

---

## Code Standards

### TypeScript

- Strict mode is enabled. No `any` unless absolutely unavoidable (add a comment explaining why)
- Prefer `interface` for object shapes, `type` for unions/aliases
- All Socket.io events must use the typed payloads from `packages/shared-types`

### React / Next.js

- Use Server Components by default; opt into Client Components only when needed (`'use client'`)
- Custom hooks go in `apps/web/hooks/`, named `use<Something>.ts`
- No direct `fetch` calls inside components — wrap in hooks or server actions

### Socket.io Events

- All event names must be defined as constants in `packages/shared-types/src/events.ts`
- Never use raw strings for event names (no `socket.on('some_event', ...)` inline)

---

## Working with an AI assistant (Claude / Copilot)

When delegating a coding task to an AI, use the **Task Prompt Template** in `TASK_PROMPT_TEMPLATE.md`. This ensures the AI has full context about the project stack, conventions, and constraints without you having to re-explain everything each time.

---

## Running the full dev environment

```bash
pnpm install
pnpm dev           # starts web (3000) + server (3001) in parallel
```

## Project scripts reference

```bash
pnpm dev           # start all apps in watch mode
pnpm build         # build all apps
pnpm lint          # lint all apps
pnpm typecheck     # typecheck all apps
pnpm test          # run unit tests
pnpm test:e2e      # run Playwright e2e tests
```

---

## Questions?

Open a [GitHub Discussion](../../discussions) or drop a message in the team chat. Don't open an Issue for questions — Issues are for trackable bugs and features.

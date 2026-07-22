# Vexio

Vexio is a real-time collaborative whiteboard — draw shapes with others, see their cursors and edits live, and pick up right where you left off after a refresh or a dropped connection.

## Key features

- Email/password and Google/GitHub OAuth login
- Create and open shared whiteboard rooms by slug
- Live collaborative drawing — shapes sync instantly across everyone in the room
- Live cursors and selection outlines for other collaborators
- Presence ("joined" / "left"), correct even across multiple tabs
- Undo / redo
- Automatic reconnect (with backoff) and an offline edit queue that replays on reconnect

## Tech stack

| Layer | Technology |
|---|---|
| Package manager / runtime | bun |
| Monorepo tooling | Turborepo |
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS |
| REST API | Express 5 on Bun |
| Real-time | raw `ws` WebSocket server on Bun |
| Auth | better-auth (email/password + OAuth + bearer tokens) |
| Database | PostgreSQL (Neon) via Prisma 7 |
| Email | nodemailer over SMTP |

Full breakdown in [docs/02-architecture.md](./docs/02-architecture.md).

## Quick start

> The toolchain (bun, next) runs on **Windows**, not WSL. If you're on WSL, run commands via PowerShell:
> `powershell.exe -Command "cd A:\Codebase\Vexio; bun run dev"`

```powershell
bun install
bun run dev   # starts web (3001), http-server (8000), ws-server (8080)
```

You'll also need a `.env` file (copy from `.env.example`) with a Postgres connection string and auth secrets — see [docs/03-getting-started.md](./docs/03-getting-started.md) for the full setup, including every environment variable explained.

## Documentation

- [docs/README.md](./docs/README.md) — full documentation index (architecture, data model, HTTP API, WebSocket protocol, roadmap)
- [CLAUDE.md](./CLAUDE.md) — deep implementation notes and known sharp edges, for contributors and AI coding agents

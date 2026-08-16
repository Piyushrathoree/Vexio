# Getting Started

## IMPORTANT: run commands via PowerShell, not WSL bash

The toolchain (bun, next) is installed on **Windows**, not inside WSL. WSL bash **cannot** run `bun install`, `next dev`, `next build`, etc. Run them via PowerShell against the Windows path instead:

```
powershell.exe -Command "cd A:\Codebase\Vexio; bun run dev"
```

`/mnt/a/Codebase/Vexio` (WSL) and `A:\Codebase\Vexio` (Windows) are the same repo on the same disk — reading/editing files from WSL is fine, but *executing* build/dev/install commands is not.

## Prerequisites

- **bun** `1.3.4` (see root `package.json` → `packageManager`)
- A **Postgres database** — the project is built against [Neon](https://neon.tech) serverless Postgres
- (Optional) A **Google** and/or **GitHub** OAuth app, if you want social login
- (Optional) A **Gmail App Password** for sending verification/reset emails through Nodemailer

## Environment variables

Copy `.env.example` to `.env` at the repo root (`loadRootEnv()` always loads the monorepo root `.env`, regardless of which package starts the process):

| Variable | Description |
|---|---|
| `DATABASE_URL` | Pooled Neon connection string (kept for reference; app currently reads this) |
| `DIRECT_URL` | Direct (non-pooled) Neon connection string |
| `BETTER_AUTH_SECRET` | Secret for better-auth sessions — min 32 chars, e.g. `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Base URL of the auth server (`apps/http-server`), e.g. `http://localhost:8000` |
| `WEB_URL` | Base URL of the frontend, used for CORS + auth trusted origins |
| `NEXT_PUBLIC_AUTH_URL` | Frontend → REST base URL (points at `apps/http-server`) |
| `NEXT_PUBLIC_WS_URL` | Frontend → WebSocket base URL (points at `apps/ws-server`) |
| `PORT` | `apps/http-server` listen port (default `8000`) |
| `WS_PORT` | `apps/ws-server` listen port (default `8080`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth — only registered if **both** are set |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth — only registered if **both** are set |
| `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Gmail + Google App Password configuration for Nodemailer email delivery |

Email is sent through Gmail's SMTP service using Nodemailer. `SMTP_USER` is the Gmail address and `SMTP_PASS` must be a Google App Password, not the normal account password. `SMTP_FROM` is optional and defaults to `SMTP_USER`.

**Email verification is off by default** (`requireEmailVerification: false` in `packages/auth/auth.ts`) so local sign-in works without SMTP configured. Don't flip it on without working SMTP — see [07-roadmap.md](./07-roadmap.md).

## Install & run

From the repo root (via PowerShell, per above):

```powershell
bun install        # install all workspace dependencies
bun run dev         # turbo run dev — starts web, http-server, ws-server together
```

Other root scripts:

```powershell
bun run build        # turbo run build
bun run lint         # turbo run lint
bun run check-types   # turbo run check-types
bun run format        # prettier --write "**/*.{ts,tsx,md}"
```

Run a single app instead of everything:

```powershell
bunx turbo run dev --filter=web
# or
cd apps/web; bun run dev
```

## Database (packages/db)

Prisma 7 + `@prisma/adapter-neon`. Run these from `packages/db` (or via `bunx turbo run <script> --filter=@repo/db`):

```powershell
bun run generate     # bunx prisma generate
bun run migrate      # bunx prisma migrate dev
bun run reset        # bunx prisma migrate reset
bun run db:deploy    # bunx prisma migrate deploy && bun run generate
```

> `turbo.json` declares `db:generate` / `db:push` task shapes, but **no package implements scripts with those exact names** — those turbo tasks are dead. Use the real script names above.

There are currently no test scripts defined anywhere in the repo.

## Ports (dev, hardcoded per app)

| App | Port | Command |
|---|---|---|
| `apps/web` | 3001 | `next dev --port 3001` |
| `apps/http-server` | 8000 (or `PORT`) | `bun --hot index.ts` |
| `apps/ws-server` | 8080 (or `WS_PORT`) | `bun --hot index.ts` |

Once all three are running and `.env` is filled in, visit `http://localhost:3001`, sign up, create a room, and open it — real-time collaboration works as soon as you can log in.

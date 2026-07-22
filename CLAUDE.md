# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Vexio is a real-time collaborative whiteboard app (Excalidraw-style). It's a Turborepo monorepo
managed with **bun workspaces**, split into three runnable apps and shared packages.

## CRITICAL: run everything through PowerShell, not WSL bash

The toolchain (bun, next) is installed on **Windows**, not inside WSL. WSL bash **cannot** run
`bun install`, `next dev`, `next build`, etc. — those commands must be run via PowerShell against
the Windows path:

```
powershell.exe -Command "cd A:\Codebase\Vexio; bun run dev"
```

`/mnt/a/Codebase/Vexio` (WSL) and `A:\Codebase\Vexio` (Windows) are the same repo on the same disk.
Reading/editing files from WSL is fine; *executing* build/dev/install commands is not.

## Commands

Package manager is **bun** (`bun@1.3.4`, see root `package.json` `packageManager`). Root scripts
fan out via turbo to every workspace:

```
bun run dev          # turbo run dev          (all apps, persistent, uncached)
bun run build        # turbo run build
bun run lint         # turbo run lint
bun run check-types  # turbo run check-types
bun run format       # prettier --write "**/*.{ts,tsx,md}"
```

Run a single app instead of everything with turbo's `--filter`, e.g.
`bunx turbo run dev --filter=web` or just `cd apps/web && bun run dev`.

Per-app dev ports (hardcoded in each app, not just env defaults):
- `apps/web` → `next dev --port 3001`
- `apps/http-server` → `bun --hot index.ts`, listens on `PORT` (default 8000)
- `apps/ws-server` → `bun --hot index.ts`, listens on `WS_PORT` (default 8080)

### Database (packages/db, Prisma 7 + @prisma/adapter-neon)

There is **no `db:generate` / `db:push` script** anywhere despite `turbo.json` declaring task
shapes for them — those turbo tasks are currently dead (no package implements a script with that
exact name), so `turbo run db:generate` is a no-op. Use the real scripts directly, from
`packages/db` (or `bunx turbo run <script> --filter=@repo/db`):

```
bun run generate     # bunx prisma generate
bun run migrate      # bunx prisma migrate dev
bun run reset        # bunx prisma migrate reset
bun run db:deploy    # bunx prisma migrate deploy && bun run generate
```

### Tests

`bun test` (Bun's built-in runner). From the repo root:

```
bun run test:unit          # pure unit tests — no DB, no servers, zero setup
bun run test:integration   # HTTP + WS end-to-end — needs live servers, see below
bun run test               # both
```

`tests/` is **not** a workspace, so it resolves `@repo/*` out of the root
`node_modules` — the root `package.json` carries `@repo/common` and `@repo/ws-schema` as
devDependencies purely to make that resolution work. Drop them and `tests/unit` silently
fails to import.

`tests/integration/room-lifecycle.test.ts` is double-gated: it needs `TEST_INTEGRATION=1`
**and** a successful reachability probe against the http-server, otherwise the whole
describe block skips with a console note. It talks to real services (http-server :8000,
ws-server :8080, a migrated database) and never mocks the network. See `tests/README.md`.

## Architecture

Three deployable processes, three-plus shared packages:

```
apps/web          Next.js 16 App Router / React 19 client — the whiteboard UI
apps/http-server  Express 5 on Bun — REST API + better-auth mount
apps/ws-server     raw `ws` WebSocketServer on Bun — real-time whiteboard sync

packages/db       Prisma 7 client + adapter-neon, models, service functions
packages/auth     better-auth server config (shared by http-server & ws-server)
packages/common   ApiError / ApiResponse / loadRootEnv
packages/ui       unmodified create-turbo starter stub — NOT used for real UI
```

`apps/web` talks to the backend over two separate channels, both env-configured:
- `NEXT_PUBLIC_AUTH_URL` → REST calls to `apps/http-server` (auth + room CRUD)
- `NEXT_PUBLIC_WS_URL` → the live socket to `apps/ws-server`

### apps/web

- Routes: `/` (landing), `/login`, `/signup`, `/forgot-password`, `/reset-password`,
  `/invite/[token]`, `/profile`, `/rooms` — **the one boards dashboard** — and
  `/whiteboard/[slug]`, the collaborative canvas, a ~3300-line client component
  (`apps/web/app/whiteboard/[slug]/page.tsx`). `/whiteboard` (no slug) is now just a
  `redirect("/rooms")`; it used to be a second, near-duplicate dashboard.
- `apps/web/app/globals.css` holds the design system (dark canvas, dot grid, five accents,
  Bricolage/Inter/Kalam/JetBrains Mono) and the component primitives `.card` / `.artboard` /
  `.btn-*` / `.input` / `.segmented` / `.coord` / `.chip` / `.avatar` / `.title-block`.
  **Those live in `@layer components` and must stay there** — unlayered they outrank every
  Tailwind utility, which silently killed things like `card hover:bg-*`, `.input h-8`, and
  `.avatar h-7` at call sites across the app. The global `:focus-visible` outline and the
  `prefers-reduced-motion` block are deliberately left *unlayered* so they keep winning.
- Client libs (`apps/web/lib/`):
  - `api.ts` — REST calls to http-server
  - `auth-client.ts` — better-auth client + bearer token storage/retrieval (`getBearerToken`)
  - `whiteboard-socket.ts` — WS client message contract, socket URL builder, `WS_CLOSE_UNAUTHORIZED`
    constant, `safeSend` helper
  - `use-whiteboard-store.ts` — the socket lifecycle hook: connect/reconnect (exponential backoff
    with jitter), heartbeat handling, throttled outgoing element updates (~30/sec, trailing edge),
    outbox flush/reconcile on reconnect, remote cursor/selection state
  - `whiteboard-outbox.ts` — localStorage-backed queue of edits made while disconnected; replayed
    on top of the server snapshot on reconnect
- `next.config.ts` sets `typescript.ignoreBuildErrors: true` — type errors will NOT fail `next build`.

### apps/http-server

Express 5 running under Bun. `index.ts` mounts, in order: CORS (origin = `WEB_URL`, credentials on,
exposes `set-auth-token`) → morgan logging → **better-auth at `/api/auth/*splat`** (must come before
`express.json()`, since better-auth needs the raw body) → JSON/urlencoded parsers → `/api/v1/*` →
404 handler → central error handler (maps `ApiError` to `{success:false,message}`, everything else
to 500).

`/api/v1` routes (`apps/http-server/routes/route.ts`), all behind `isAuthenticated`
(`apps/http-server/middleware/middleware.ts`):
- `POST /room` — create room (slug normalized to lowercase then validated against
  `a-z0-9-`, 3–64 chars; 409 on dupe slug). Note `normalizeSlug` **lowercases before** the
  charset check, so `MyRoom` is accepted and stored as `myroom`.
- `GET /rooms` — every room the user can reach (owned **or** joined), each enriched with the
  caller's `role`, `memberCount`, `elementCount`, and a capped `preview` for dashboard
  thumbnails. The raw `snapshot` is deliberately stripped — see packages/db below.
- `GET /room/:slug` — fetch one room + the caller's `role`; 403 for non-members
- `POST /room/:slug/join` — **open-by-link enrolment**, idempotent; 404 for an unknown slug
- `PATCH /room/:slug` — rename (admin only) · `DELETE /room/:slug` — delete (admin only)
- `POST /room/:slug/leave` — leave a room
- `GET|PATCH|DELETE /room/:slug/members[/:userId]` — list members, change a role, remove
- `POST /room/:slug/invite` — mint an invite link (admin only)
- `POST /invite/:token/accept` — redeem one

`GET /api/me` (outside `/api/v1`) returns the current better-auth session or 401.

### apps/ws-server

Raw `ws` `WebSocketServer` (no framework), auth via bearer token in the query string
(`?token=...`), verified in `apps/ws-server/middleware/verify.ts`. Rejects with **close code 4001**
on a bad/missing/expired token — the client (`use-whiteboard-store.ts`) treats 4001 as terminal and
stops retrying rather than burning reconnect attempts against a dead session.

**Membership & roles**: `handleJoinRoom` calls `ensureMember` — mirroring
`POST /api/v1/room/:slug/join` — so opening a board over WS enrols you as an `EDITOR`
(idempotent; never downgrades an existing `ADMIN`/`VIEWER`). The resolved role is cached on
the connection's `RoomSession`, so the write path stays synchronous. `element_add`/`update`/
`delete` from a `VIEWER` are refused with an `error`; `cursor`/`selection` stay allowed.

Room state lives in-memory (`Map`s in `index.ts`: `roomState`, `roomIds`, `saveTimers`), hydrated
lazily from `Room.snapshot` (Prisma `Json?`) on first join, and persisted back via a **debounced**
save (`scheduleSave` in `middleware/helper.ts`); the empty-room eviction path clears the pending
timer first so it can't double-write or drop the final state.

Message contract (`apps/ws-server/types.ts`, mirrored — NOT imported/shared — in
`apps/web/lib/whiteboard-socket.ts`; keep both files in sync by hand when changing message shapes):
- Client → server: `join_room`, `leave_room`, `element_add`, `element_update`, `element_delete`,
  `cursor`, `selection`
- Server → client: `room_state`, `element_add/update/delete` (echoed with `userId`), `presence`
  (`joined`/`left`), `cursor`, `selection`, `error`
- `cursor` and `selection` are **ephemeral**: relayed to room peers, never persisted to the DB.

Other server behavior worth knowing before touching `index.ts`:
- **Presence is ref-counted per user per room** (not per connection) — "joined" fires only on a
  user's first connection into a room, "left" only when their last connection drops, so multi-tab
  use doesn't spam false leave/join events. All exit paths (explicit leave, tab close, dead-socket
  reap) funnel through one cleanup function.
- **Heartbeat**: server pings every connection every 30s (`HEARTBEAT_INTERVAL_MS`) and terminates
  any that didn't pong the previous round — reaps zombie connections that would otherwise block
  room eviction/save and leave stale presence for everyone else.
- **Limits**: 256KB soft / 512KB hard (`maxPayload`) per message, token-bucket rate limiting
  (tighter bucket for state-mutating messages, looser one for cursor/selection so pointer movement
  stays smooth), 10,000-element cap per room.

### packages/db

Prisma 7 with the `@prisma/adapter-neon` driver adapter (Neon serverless Postgres); client
generated to `packages/db/src/generated/prisma`. `packages/db/src/index.ts` builds the connection
string from `DATABASE_URL` (auto-adds `connect_timeout`, `pool_timeout`, `sslmode=require` if
missing) and caches the client on `globalThis` outside production (hot-reload safe). Service
functions live in `packages/db/src/services/{auth,room,chat}.ts`.

Schema (`packages/db/prisma/schema.prisma`) models:
- `User`, `Session`, `Account`, `Verification` — better-auth's required shape (`@@map`'d to
  lowercase table names)
- `Room` — `slug` (unique), `adminId` (owner), `snapshot` (`Json?`, the persisted whiteboard
  elements). No `updatedAt`.
- `RoomMember` — `(roomId, userId)` unique, `role` (`RoomRole` enum: `ADMIN`/`EDITOR`/`VIEWER`).
  **All authorization resolves through this table, never through `Room.adminId`** — a room
  with no `RoomMember` row for its owner locks that owner out of their own room.
- `RoomInvite` — `token` (unique), `role`, `createdBy`, optional `expiresAt`

`getRoomsForUser` also builds the dashboard `preview`: rooms can hold up to 10,000 elements,
so the snapshot is capped (~80 elements, pen strokes decimated) and stripped to bare geometry
**server-side** before serializing. Never ship whole snapshots to the boards list. Note it
still reads the full snapshot column out of the DB before trimming — fine at current scale,
but the eventual fix is a denormalized preview column written on save.
- `Chat` — `messages: String`, has DB service functions (`services/chat.ts`) but is **not wired**
  into any route or the ws-server — dead at the application layer.

### packages/auth

better-auth config (`packages/auth/auth.ts`), shared by http-server and ws-server. Email/password
+ optional Google/GitHub OAuth (only registered if the corresponding env vars are set) + the
`bearer()` plugin (issues the `set-auth-token` header the WS client uses). `packages/auth/email.ts`
sends via nodemailer SMTP.

**`requireEmailVerification` is currently `false`, deliberately, for local dev** — see the comment
at `packages/auth/auth.ts` next to it and `WEBSOCKET_FIXES.md` §0 for why: if it's flipped back on
without working SMTP, verification emails silently fail to send, users can never verify, sign-in
never issues a bearer token, and the WS connection gets rejected with close code 4001 for
*everyone*. Don't flip it without confirming SMTP works first.

### packages/common

`ApiError` / `ApiResponse` (used by http-server's controllers/error handler) and `loadRootEnv()`,
which resolves and loads the **monorepo root** `.env` (not a per-package one) via dotenv —
imported for its side effect by both `packages/db` (`import "@repo/common/env.ts"`) and
`packages/auth`/`apps/http-server` (`import "@repo/common"`).

### packages/ui

A **CSS-only package** now: the `create-turbo` starter components (`card.tsx`, `gradient.tsx`,
`turborepo-logo.tsx`) were deleted, leaving `src/styles.css` (consumed by apps/web) and an
`src/index.ts` that exports nothing but keeps the package a valid TS project so `tsc --noEmit`
has an input. Real UI components live in `apps/web/components/` (`Navbar`, `Hero`, `AuthGuard`,
`components/rooms/*`, etc.) — don't look in `packages/ui` for them.

## Environment variables

Root `.env` (loaded by `loadRootEnv()`; see `.env.example` for the full annotated template):

| Var | Used by |
|---|---|
| `DATABASE_URL`, `DIRECT_URL` | packages/db (app currently reads `DATABASE_URL`) |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | packages/auth |
| `WEB_URL` | packages/auth (`trustedOrigins`), http-server (CORS origin) |
| `NEXT_PUBLIC_AUTH_URL` | apps/web → REST base URL |
| `NEXT_PUBLIC_WS_URL` | apps/web → WS base URL |
| `PORT` | apps/http-server |
| `WS_PORT` | apps/ws-server |
| `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET` | packages/auth OAuth (optional; only registered if both are set per provider) |
| `SMTP_HOST/PORT/SECURE/USER/PASS/FROM` | packages/auth/email.ts (nodemailer) |

**Known mismatch**: the actual `.env` file currently has `RESEND_API_KEY` / `RESEND_FROM_EMAIL`
set, but no code in the repo reads those — `packages/auth/email.ts` reads `SMTP_*` exclusively.
Email sending will throw ("SMTP_USER and SMTP_PASS are not configured") unless `SMTP_*` is filled
in, regardless of the Resend vars being present.

## Known gaps / sharp edges

- **WS message contract is duplicated, not shared**: `apps/ws-server/types.ts` and
  `apps/web/lib/whiteboard-socket.ts` define the same `ClientMessage`/`ServerMessage` unions by
  hand in two places. Changing one without the other silently breaks the wire protocol.
  `packages/ws-schema` exists as the intended single source of truth (zod schemas + inferred
  types) but **neither app imports it yet** — treat it as target state, not live behaviour.
- **Boards are open-by-link**: any signed-in user who opens a slug is auto-enrolled as an
  `EDITOR`, over HTTP *and* WS. Boards are unlisted-but-open, not private. Invites exist to
  grant `VIEWER` or `ADMIN` specifically.
- **`Room` has no `updatedAt`** — only `createdAt`. The dashboard's board cards want a
  "last edited" timestamp and currently can't have one; adding it needs a migration plus a
  touch on the snapshot-save path.
- **`Chat` model + services exist but are unwired** — no route or ws-server handler uses them.
- **`.env` email vars mismatch** — see above.
- **`next.config.ts` sets `typescript.ignoreBuildErrors: true`** in apps/web — `next build` will
  succeed even with type errors; rely on `bun run check-types` to actually catch them.
- **`turbo.json` declares `db:generate`/`db:push` task configs that nothing implements** — see
  Commands section above for the real script names in `packages/db`.

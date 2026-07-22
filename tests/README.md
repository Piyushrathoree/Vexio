# Vexio test suite

Uses `bun test` (Bun's built-in Jest-like runner — `import { test, expect, describe } from "bun:test"`).
No new test framework was added; the root `package.json` only gained a `test`
script and an `@types/bun` devDependency.

```
tests/
  unit/         pure unit tests — no DB, no running server, zero setup
  integration/  HTTP + WS end-to-end tests — need the DB pushed + both
                servers running + an explicit opt-in flag
  support/      shared helpers used by tests/integration/*
```

## Unit tests — run these anytime, zero setup

```powershell
bun test tests/unit
# or
bun run test:unit
```

These import real exported code and require no database or running
process:

- `tests/unit/ws-schema.test.ts` — the WS message contract exported by
  `@repo/ws-schema` (`packages/ws-schema/src/*.ts`): valid/invalid
  `ClientMessage`/`ServerMessage`/`DrawingElement` payloads, using the
  actual `parseClientMessage`/`parseServerMessage`/discriminated-union
  schemas apps/ws-server and apps/web are meant to agree on.
- `tests/unit/api-error-response.test.ts` — `@repo/common`'s `ApiError` /
  `ApiResponse` envelope that every `apps/http-server/controllers/index.ts`
  handler throws/returns.
- `tests/unit/slug-validation.test.ts` — table-driven valid/invalid slugs
  for the room-slug rules (3–64 chars, `^[a-z0-9-]+$`). `normalizeSlug` and
  `requireSlugParam` are declared inline (not exported) in
  `apps/http-server/controllers/index.ts`, and this test suite is not
  allowed to touch application source, so this file keeps a **behavioral
  mirror** of that logic and exercises it as living documentation. If you
  change the real `normalizeSlug`, update the mirror in this file to match —
  a diff here is meant to be a deliberate, visible signal that the slug
  contract moved.
- `tests/unit/invite-token.test.ts` — documents the invite-token contract:
  tokens are `crypto.randomUUID()` (from `packages/db/src/services/member.ts`'s
  `createInvite`), and `acceptRoomInvite` only guards on "non-empty string"
  (format/expiry validation happens in `consumeInvite`, at the DB layer —
  covered by the integration test, not here).

## Integration tests — need live services + an explicit flag

`tests/integration/room-lifecycle.test.ts` is adapted from the manual E2E
script at `/scratch-wstest.mjs`: sign up a throwaway admin, create a room,
confirm it shows up in `GET /api/v1/rooms`, confirm a second (non-member)
user gets `403` on `GET /api/v1/room/:slug`, create an invite as admin,
accept it as the second user, confirm the second user can now `GET` the
room, then open two WS clients and assert `room_state` on join, a `presence`
"joined" broadcast, and an `element_add` fan-out.

This test talks to **real** running services and a **real** database — it
is skipped by default and does not fail the suite when those aren't
available. It only runs when:

1. `TEST_INTEGRATION` is set to `1` or `true`, **and**
2. the http-server base URL responds to a quick reachability probe.

If either check fails, the whole file logs a one-line console note and
skips via `describe.skipIf`.

### Running it (PowerShell, from the repo root)

```powershell
# 1. Apply the Prisma schema to your dev database (once, or after schema
#    changes). Per CLAUDE.md, turbo.json's db:generate/db:push task configs
#    are not implemented by any package — use the real script, from
#    packages/db (or `bunx turbo run migrate --filter=@repo/db`):
cd packages\db
bun run migrate        # bunx prisma migrate dev
cd ..\..

# 2. Start all dev servers (web, http-server on :8000, ws-server on :8080)
bun run dev

# 3. In a second PowerShell window, opt in and run the integration test
$env:TEST_INTEGRATION = "1"
bun test tests/integration
# or just:
bun run test:integration
```

Base URLs default to `http://localhost:8000` (http-server) and
`ws://localhost:8080` (ws-server), matching `.env.example`. Override them if
your dev servers run elsewhere:

```powershell
$env:TEST_INTEGRATION = "1"
$env:HTTP_SERVER_URL = "http://localhost:8000"   # falls back to NEXT_PUBLIC_AUTH_URL, then this default
$env:WS_SERVER_URL   = "ws://localhost:8080"     # falls back to NEXT_PUBLIC_WS_URL, then this default
bun test tests/integration
```

Each test run creates two brand-new throwaway users (`vexio-it-admin-<ts>@example.com`,
`vexio-it-invitee-<ts>@example.com`) and one brand-new room
(`vexio-it-room-<ts>`) — nothing is cleaned up afterward, so re-running
against the same database just accumulates a few extra rows scoped to that
timestamp.

## Everything at once

```powershell
bun test          # root "test" script — runs unit + integration
                   # (integration self-skips unless TEST_INTEGRATION=1
                   # and the servers are reachable)
```

## A note on apps/ws-server churn

The WS server internals (`apps/ws-server/index.ts`, `middleware/helper.ts`)
are being actively reworked by the developer. The integration WS assertions
and `tests/unit/ws-schema.test.ts` are written against the CURRENT message
contract in `apps/ws-server/types.ts` and `packages/ws-schema/src/messages.ts`.
If either of those files change shape (new message types, renamed fields,
membership enforcement added to `join_room`, etc.), expect to need to update:

- `tests/support/ws-client.ts` (the generic WS test client)
- `tests/integration/room-lifecycle.test.ts` (the WS assertions at the end)
- `tests/unit/ws-schema.test.ts` (the fixtures/contract pins)

to match, rather than treating a failure here as a false alarm.

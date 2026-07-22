# @repo/ws-schema

Single source of truth for the Vexio whiteboard WebSocket message contract.

## Why this package exists

The WS message shapes used to be duplicated and hand-synced between:

- `apps/web/lib/whiteboard-socket.ts` — client-side `ClientMessage`/`ServerMessage` types
- `apps/ws-server/types.ts` — server-side copy of the same types

Keeping two hand-written unions in sync is error-prone — a field added on one
side and forgotten on the other fails silently at runtime. This package
defines the contract once, as [zod](https://zod.dev) schemas, so both sides
get:

- **Runtime validation** — `parseClientMessage`/`parseServerMessage` (or the
  `safeParse*` variants) reject malformed payloads instead of trusting
  `JSON.parse(...)` output typed as `unknown`.
- **A single set of inferred TypeScript types** (`ClientMessage`,
  `ServerMessage`, `DrawingElement`, etc.) via `z.infer`, so the compiler
  catches drift instead of the two apps silently diverging.

> **Status:** this package is the contract, but `apps/web` and
> `apps/ws-server` have not been switched over to it yet. They still define
> and hand-validate their own copies of these types. A later wave will
> refactor both apps to import from `@repo/ws-schema` instead. Until then,
> treat this package as the target state, not the live behavior.

## Usage (once apps are migrated)

```ts
import {
    ClientMessageSchema,
    ServerMessageSchema,
    parseClientMessage,
    safeParseServerMessage,
    type ClientMessage,
    type ServerMessage,
    type DrawingElement,
} from "@repo/ws-schema";

// Server: validate an incoming raw WS frame before touching it.
const msg: ClientMessage = parseClientMessage(JSON.parse(raw));

// Client: validate a frame from the server without throwing.
const result = safeParseServerMessage(JSON.parse(raw));
if (result.success) {
    handle(result.data);
}
```

## What's covered

### Client -> Server (`ClientMessageSchema`, discriminated union on `type`)

- `join_room` — `{ slug }`
- `leave_room` — `{ slug }`
- `element_add` — `{ slug, element }`
- `element_update` — `{ slug, element }`
- `element_delete` — `{ slug, elementId }`
- `cursor` — `{ slug, x, y }` (ephemeral, never persisted)
- `selection` — `{ slug, elementIds }` (ephemeral, never persisted)
- `chat_message` — `{ slug, text }` (**forward-looking**, see below)

### Server -> Client (`ServerMessageSchema`, discriminated union on `type`)

- `room_state` — `{ slug, elements }`
- `element_add` — `{ slug, element, userId }`
- `element_update` — `{ slug, element, userId }`
- `element_delete` — `{ slug, elementId, userId }`
- `presence` — `{ slug, userId, name, action: "joined" | "left", role? }`
  (`role` is **forward-looking**, see below)
- `cursor` — `{ slug, userId, name, x, y }` (ephemeral)
- `selection` — `{ slug, userId, name, elementIds }` (ephemeral)
- `error` — `{ message }`
- `chat` — `{ slug, userId, name, text, id?, createdAt? }` (**forward-looking**)

### Elements (`DrawingElementSchema`)

Mirrors `apps/web/lib/types.ts`'s `DrawingElement` union exactly — this is a
custom canvas whiteboard, not Excalidraw, so there is no `width/height`,
`angle`, `opacity`, `strokeWidth`, `roughness`, or split
`backgroundColor`/`fillStyle`. Every element has `id`, `type`, `color`,
`thickness`, and an optional `strokeStyle`. Variants:

- `ShapeElement` (`type`: `line | arrow | rect | ellipse | diamond | triangle | star`) —
  `x1, y1, x2, y2`, `fill: string | null`
- `PenElement` (`type: "pen"`) — `points: { x, y, t, pressure }[]`
- `TextElement` (`type: "text"`) — `x1, y1, x2, y2, text, fontFamily`, optional
  `fontWeight`, `fontStyle`, `textDecoration`
- `StickyElement` (`type: "sticky"`) — same box + `text`, `fill: string`
  (required, unlike `ShapeElement.fill`), `fontFamily`, and the same optional
  text-styling fields as `TextElement`

### Forward-looking / planned additions

Marked clearly in `src/chat.ts` and `src/presence.ts`. These are **additive
and non-breaking** — they add new discriminated-union members or new
*optional* fields, they never change an existing message's required shape:

- `chat_message` (client) / `chat` (server) — a WS transport for the
  `Chat` Prisma model (`packages/db/prisma/schema.prisma`), which currently
  has no live socket path.
- `presence.role` — an optional `"admin" | "member"` field on the `presence`
  server message, informed by `Room.adminId` in the Prisma schema. Not
  emitted by `apps/ws-server` today.

## Package layout

```
packages/ws-schema/
├── index.ts              # public entrypoint, re-exports src/messages.ts
├── package.json           # "@repo/ws-schema", consumed as raw .ts (no build step), like @repo/common
├── tsconfig.json
└── src/
    ├── elements.ts         # element/point schemas + DrawingElementSchema
    ├── presence.ts         # cursor/selection/presence-entry schemas
    ├── chat.ts             # forward-looking chat schemas
    └── messages.ts         # ClientMessageSchema/ServerMessageSchema + parsers
```

## Local dev

```bash
bun install
```

This package has no build step — like `@repo/common`, it's consumed directly
as TypeScript source via the `exports` map in `package.json`.

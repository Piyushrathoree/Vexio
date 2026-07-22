# WebSocket Implementation Guide

Practical guide for the next wave of `apps/ws-server` work: adopt the shared
`@repo/ws-schema` contract, enforce room ACLs, add chat, and lay scaling
seams. Written for someone who already knows the codebase — see
`docs/06-realtime-websocket.md` for the current-state overview and
`docs/design/SCALING.md` for the full multi-instance design (task 4 only
summarizes it).

## TL;DR checklist

- [ ] Add `"@repo/ws-schema": "*"` to `apps/ws-server/package.json` deps
- [ ] Replace `apps/ws-server/types.ts` unions with `@repo/ws-schema` imports
- [ ] Swap `isElementLike` ad-hoc checks for `safeParseClientMessage`
- [ ] (Optional, dev's call) migrate `apps/web/lib/whiteboard-socket.ts` too
- [ ] In `handleJoinRoom`: resolve room → `getMember(room.id, userId)` → reject if not a member
- [ ] Cache `{ roomId, role }` on the connection's `RoomSession` at join time
- [ ] In `element_add`/`element_update`/`element_delete`: reject `VIEWER` role
- [ ] Decide Chat schema shape (recommend: one row per message) + migration
- [ ] Add `chat_message` handler: validate → ACL → persist → broadcast `chat`
- [ ] Load recent chat history on join (`getChatsByRoomId`), send as `chat_history`
- [ ] Rate-limit chat through the existing `general` token bucket
- [ ] Extract `broadcastToRoom` calls behind a `Broadcaster` interface (Local-only for now)
- [ ] Smoke-test with `scratch-wstest.mjs` (join/broadcast, then extend for ACL/chat)

---

## 1. Adopt the shared contract (`@repo/ws-schema`)

**Goal:** stop hand-syncing `apps/ws-server/types.ts` and
`apps/web/lib/whiteboard-socket.ts`; validate every inbound frame with zod
instead of the manual `isElementLike` duck-type check.

**Files:**
- `apps/ws-server/package.json` — add the dep
- `apps/ws-server/types.ts` — replace the two unions
- `apps/ws-server/index.ts:39-47` (`isElementLike`), `:293-312` (parse +
  dispatch), and every `parsed.type === "..."` branch (`:331-573`)

### 1a. Add the dependency

`apps/ws-server/package.json`, in `dependencies` (same pattern as
`@repo/db`, `@repo/common`):

```json
"@repo/ws-schema": "*",
```

### 1b. Replace `types.ts`

```ts
// apps/ws-server/types.ts
export type {
    ClientMessage,
    ServerMessage,
    DrawingElement,
} from "@repo/ws-schema";

export type RoomSession = {
    roomId: number;
    slug: string;
    // added in Task 2 — see below
    role: "ADMIN" | "EDITOR" | "VIEWER";
};
```

`RoomSession` isn't part of the wire contract (it's server-local
per-connection state), so it stays hand-written here — only the message
unions move to `@repo/ws-schema`.

### 1c. Validate instead of hand-check

Before/after in `index.ts`'s `ws.on("message", ...)` handler:

**Before** (`index.ts:293-312`, loose parse, then per-branch manual checks
like `isElementLike` at `:381`, `:440`):

```ts
let parsed: Partial<ClientMessage> & { type?: string; slug?: string; /* ... */ };
try {
    parsed = JSON.parse(String(data));
} catch {
    send(ws, { type: "error", message: "invalid JSON" });
    return;
}
if (!parsed.type || typeof parsed.type !== "string") {
    send(ws, { type: "error", message: "message type is required" });
    return;
}
// ...later, per message type:
const element = parsed.element;
if (!isElementLike(element)) {
    send(ws, { type: "error", message: "invalid element" });
    return;
}
```

**After:**

```ts
import { safeParseClientMessage } from "@repo/ws-schema";

let json: unknown;
try {
    json = JSON.parse(String(data));
} catch {
    send(ws, { type: "error", message: "invalid JSON" });
    return;
}

const result = safeParseClientMessage(json);
if (!result.success) {
    send(ws, { type: "error", message: "invalid message" });
    return;
}
const parsed = result.data; // fully typed ClientMessage, elements validated
```

Everything downstream (`parsed.element`, `parsed.elementId`, `parsed.x`) is
now trusted-typed — delete `isElementLike` and every `typeof parsed.x ===
"number"` guard in the `cursor`/`selection` branches (`:522-529`,
`:553-558`).

### Gotchas

- `ClientMessageSchema` validates full `DrawingElement` shapes (not just
  `{ id: string }` like today's `isElementLike`) — **stricter**. A
  malformed element that used to slip through as an opaque blob now gets
  rejected with `invalid message`. Confirm `apps/web`'s element shapes
  actually match `packages/ws-schema/src/elements.ts` before flipping this
  on, or well-formed-but-slightly-off clients will start seeing errors.
- `safeParseClientMessage` returns one generic failure for the whole
  discriminated union — you lose today's per-field messages (`"slug is
  required"`, `"invalid elementId"`). If you want that granularity back,
  inspect `result.error.issues` and map the first issue's `path` to a
  friendlier message.
- `apps/web/lib/whiteboard-socket.ts:8-49` has its own hand-mirrored copy of
  these unions — not required for this task, but flagged in the package's
  own README as the intended next step. Migrating it gets you the same
  `safeParseServerMessage` validation on the client side and removes the
  last manual-sync risk. **Your call whether to do it in this pass.**
- The package ships as raw TS (`"module": "index.ts"`, no build step) — no
  extra build wiring needed, same as `@repo/common`/`@repo/db`.

---

## 2. Enforce room access control on join + edits

**Goal:** `join_room` should only succeed for actual room members; `VIEWER`s
should be able to join and see live state but not mutate it.

**Files:** `apps/ws-server/index.ts` — `handleJoinRoom` (`:155-216`) and the
three element handlers (`:368-509`).

**Recommendation: require membership to join.** Don't auto-join as EDITOR —
`createRoom` (`packages/db/src/services/room.ts:3-13`) already adds the
creator as `ADMIN`, and the invite flow (`createInvite`/`consumeInvite`,
`packages/db/src/services/member.ts:88-141`) is how other users become
members. A `join_room` from a non-member is a bug or an attacker, not a
"let them in as an editor" case.

### 2a. Check membership in `handleJoinRoom`

Insert right after the room lookup, before any `conn.rooms.set(...)`
(`index.ts:171-179`):

```ts
import { getMember } from "@repo/db";

// ... after `if (!room) { ... return; }` (index.ts:171-174)

const member = await getMember(room.id, conn.userId);
if (!member) {
    send(ws, { type: "error", message: "not a member of this room" });
    return;
}

conn.rooms.set(slug, { roomId: room.id, slug, role: member.role });
```

This is the **cache-the-role-per-connection** move called out in the
checklist — one `getMember` DB call per join, not per message. `RoomSession`
now carries `role` (Task 1's `types.ts` change), so every later handler
reads `conn.rooms.get(slug)!.role` instead of hitting the DB.

### 2b. Reject VIEWER writes

Add a small helper near `isElementLike` was (or wherever helpers live now)
and use it in `element_add`/`element_update`/`element_delete`:

```ts
const canEdit = (session: RoomSession) => session.role !== "VIEWER";
```

In each handler, right after the existing "joined this room?" check
(e.g. `element_add` at `index.ts:369-378`):

```ts
const session = conn?.rooms.get(slug);
if (!slug || !session) {
    send(ws, { type: "error", message: "join room first" });
    return;
}
if (!canEdit(session)) {
    send(ws, { type: "error", message: "read-only access" });
    return;
}
```

Do this in all three: `element_add` (`:368`), `element_update` (`:427`),
`element_delete` (`:471`). `cursor`/`selection` (`:515`, `:546`) stay
open to all roles — presence/cursors aren't room content, no reason to gate
them (a viewer moving their mouse isn't an edit).

### Gotchas

- `RoomRole` is `ADMIN | EDITOR | VIEWER` (Prisma enum,
  `packages/db/prisma/schema.prisma:94-98`) — note this does **not** match
  `@repo/ws-schema`'s forward-looking `PresenceRoleSchema` (`admin | member`,
  `packages/ws-schema/src/presence.ts:40`). If you want to emit `role` on
  the `presence` server message (the schema already supports it optionally),
  either extend `PresenceRoleSchema` to the three real roles or map
  `EDITOR`/`VIEWER` → `"member"` — don't silently conflate them.
- `getMember`/`getRoomMembers` etc. throw `ApiError` on DB failure (see
  `packages/db/src/services/member.ts`), not return `null` — wrap the
  `handleJoinRoom` membership check in the same `try/catch` pattern already
  used for `getRoomBySlug` (`index.ts:163-170`), don't let it escape
  unhandled into the `ws.on("message")` outer `catch`.
- Role is cached **at join time only**. If an admin changes someone's role
  mid-session (`updateMemberRole`), that connection's cached `role` is
  stale until they rejoin/reconnect. Acceptable for v1 — flag it as a known
  limitation rather than solving it now (would need a server-initiated
  "your role changed" push, out of scope here).
- Multi-tab: a user's two tabs each get their own `RoomSession` cache from
  their own `join_room`, so this is consistent per-connection already (no
  extra work needed beyond what `conn.rooms` already does).

---

## 3. Add chat over WebSocket

**Goal:** wire the already-defined `chat_message` (client→server) /
`chat` (server→room) schemas from `packages/ws-schema/src/chat.ts` into a
real handler: validate → ACL → persist → broadcast, plus history-on-join.

**Files:** `apps/ws-server/index.ts` (new `if (parsed.type === "chat_message")`
branch, alongside the element handlers), `packages/db/src/services/chat.ts`,
`packages/db/prisma/schema.prisma` (`Chat` model, `:85-92`).

### 3a. Schema decision (do this first)

Today's `Chat` model is **one row per user, single accumulating `String`**:

```prisma
model Chat {
  id       Int    @id @unique @default(autoincrement())
  messages String
  roomId   Int
  room     Room   @relation(fields: [roomId], references: [id])
  userId   String
  user     User   @relation(fields: [userId], references: [id])
}
```

`createChat`/`updateChat` (`packages/db/src/services/chat.ts:4-15`, `36-48`)
already hint this was meant to be mutated in place, not appended-to per
message — that doesn't work for a real chat feed (no ordering, no per-message
id, can't render a scrollback).

**Recommendation: switch to one row per message.**

```prisma
model Chat {
  id        Int      @id @unique @default(autoincrement())
  content   String
  roomId    Int
  room      Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@index([roomId, createdAt])
}
```

Rename `messages` → `content` (or keep the name and just change semantics —
your call, but `content` avoids confusion with "one row = many messages").
Add the `[roomId, createdAt]` index since `chat_history` load will always
filter+order by exactly that. Run a migration (`bun prisma migrate dev`
under `packages/db`); update `createChat`'s signature to
`(userId, roomId, content: string)` and `getChatsByRoomId` to
`orderBy: { createdAt: "asc" }, take: <N>` (cap history — don't return the
whole table).

If you'd rather not touch the schema right now, the JSON-blob alternative
(keep one row per user, `messages: Json` as an array) is a fallback, but
it doesn't scale (single row grows unbounded, no per-message id for
edit/delete later, harder to paginate) — only take it if a migration is
genuinely blocked this sprint.

### 3b. Handler

Add alongside the other message-type branches in `index.ts`
(e.g. right after `selection`, before the final `send(ws, { type: "error",
message: "unknown message type" })` at `:575`):

```ts
if (parsed.type === "chat_message") {
    const current = connections.get(connectionId);
    const slug = normalizeSlug(parsed.slug);
    const session = current?.rooms.get(slug);
    if (!current || !session) {
        send(ws, { type: "error", message: "join room first" });
        return;
    }
    if (!parsed.text.trim()) return; // silently drop empty sends

    const chat = await createChat(current.userId, session.roomId, parsed.text);

    broadcastToRoom(connections, slug, {
        type: "chat",
        slug,
        userId: current.userId,
        name: current.userName,
        text: parsed.text,
        id: chat.id,
        createdAt: chat.createdAt.toISOString(),
    }); // no excludeConnectionId — sender should see their own message echoed
}
```

Note: **no** `excludeConnectionId` here (unlike element/cursor broadcasts) —
the sender needs its own message echoed back to render it in their chat
pane, unless `apps/web` optimistically renders it locally first (then
exclude and dedupe client-side — pick one approach, don't do both or
messages double up).

### 3c. History on join

In `handleJoinRoom` (`index.ts:192-198`), right after sending `room_state`:

```ts
const history = await getChatsByRoomId(room.id); // capped/ordered per 3a
send(ws, {
    type: "chat_history", // new server message — add to ws-schema if you want it validated
    slug,
    messages: history.map((c) => ({
        id: c.id,
        userId: c.userId,
        text: c.content,
        createdAt: c.createdAt.toISOString(),
    })),
});
```

`chat_history` isn't in `ServerMessageSchema` yet — add it to
`packages/ws-schema/src/chat.ts` next to `ChatServerSchema` (same additive
pattern the file already uses) rather than inventing an unvalidated
one-off message shape. Alternative: skip a separate message type and stuff
recent chat into `room_state` itself — simpler wire protocol, but conflates
"whiteboard content" with "chat feed" in one payload; the guide's
recommendation is to keep them separate messages.

### Gotchas

- **Rate limit it.** `chat_message` isn't `cursor`/`selection`, so it
  should draw from `conn.general` (the strict bucket), not `conn.ephemeral`
  — add `"chat_message"` to the *non*-ephemeral path. Check
  `index.ts:318-319` (`isEphemeral` check) — chat should **not** be added to
  that list, it'll fall through to `conn.general` by default, which is
  correct, just confirm it explicitly rather than assuming.
- ACL: should `VIEWER`s be allowed to chat even though they can't edit the
  board? Recommend yes (chat is discussion, not board content) — don't
  reuse the `canEdit` gate from Task 2 for this handler.
- `createChat` throws `ApiError` on failure (same pattern as `getMember`) —
  wrap in `try/catch`, don't let a transient DB error crash the message
  handler (the outer `try/catch` at `index.ts:330/576` will catch it, but
  you lose the ability to give a chat-specific error message unless you
  catch locally).
- Cap `getChatsByRoomId`'s result (e.g. `take: 50`) — sending unbounded
  history on every join is the same unbounded-growth risk
  `MAX_ELEMENTS_PER_ROOM` was built to prevent for elements.

---

## 4. Scaling seams (make multi-instance-ready)

Full design: `docs/design/SCALING.md`. Don't re-derive it here — just do the
**one refactor** that makes the future Redis swap additive instead of
invasive:

Extract `broadcastToRoom` (`apps/ws-server/middleware/helper.ts:66-84`)
behind a `Broadcaster` interface with a `LocalBroadcaster` default:

```ts
// apps/ws-server/broadcast/types.ts
export interface Broadcaster {
  publish(slug: string, message: ServerMessage, excludeConnectionId?: string): Promise<void>;
  onRoomActivated(slug: string): Promise<void>;   // no-op for Local
  onRoomDeactivated(slug: string): Promise<void>; // no-op for Local
}
```

`LocalBroadcaster.publish` = today's `broadcastToRoom` body, unchanged
behavior. Replace every direct `broadcastToRoom(connections, ...)` call site
in `index.ts` (element handlers `~411/455/495`, `cursor`/`selection`
`~530/560`, presence `joined`/`left` `~203`/`~140`, and the new `chat`
broadcast from Task 3) with `broadcaster.publish(...)`. This is a
zero-behavior-change refactor (SCALING.md §5 step 1) — do it now so a later
`RedisBroadcaster` (SCALING.md §3.1) is a drop-in, not a rewrite touching
every call site again. `RoomStateStore`/`PresenceStore` interfaces
(SCALING.md §3.2/§3.3) are larger lifts — leave those for the actual
scaling pass, not this one.

---

## Testing

`/mnt/a/Codebase/Vexio/scratch-wstest.mjs` is a Bun script that signs up a
user, creates a room, opens two WS clients, and asserts `room_state` +
presence + `element_add` broadcast all work. Run it via Windows Bun/
PowerShell (WSL bash can't reach the Windows-hosted dev servers):

```powershell
cd A:\Codebase\Vexio
bun scratch-wstest.mjs
```

Requires `apps/web` (port 8000, for the auth/room REST endpoints) and
`apps/ws-server` (port 8080) both running first.

**Extend it for this guide's work:**
- **Contract validation (Task 1):** send a malformed frame (e.g.
  `{ type: "element_add", slug, element: { notAnId: true } }`) and assert
  you get back `{ type: "error" }` instead of a silent drop or crash.
- **ACL (Task 2):** create a second user who is *not* added as a room
  member, have them `join_room` on the same slug, assert they get
  `{ type: "error", message: "not a member..." }` and never receive
  `room_state`. Then add them via `addMember(roomId, userId, "VIEWER")` and
  assert `join_room` now succeeds but `element_add` gets rejected.
- **Chat (Task 3):** after both clients join, send `chat_message` from A,
  assert B receives a `chat` message with matching `text`/`userId`; open a
  third client afterward and assert it receives `chat_history` (or sees the
  message in `room_state`, depending on which approach you took) on join.

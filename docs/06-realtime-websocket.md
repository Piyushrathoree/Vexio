# Real-Time / WebSocket

`apps/ws-server` is a raw `ws` `WebSocketServer` (no framework) at `NEXT_PUBLIC_WS_URL` (default `ws://localhost:8080`). It handles all live whiteboard collaboration: drawing, cursors, selection, presence.

## Connecting

```
ws://localhost:8080?token=<bearer token>
```

The client (`apps/web/lib/whiteboard-socket.ts`) builds this URL from the same bearer token used for REST calls (`getBearerToken()` from `auth-client.ts`). The server verifies it (`apps/ws-server/middleware/verify.ts`) by calling `auth.api.getSession()` with `Authorization: Bearer <token>`.

- **Valid token** → connection accepted, ready for `join_room`.
- **Missing / invalid / expired token** → server sends an `error` message and **closes with code `4001`**. The client treats 4001 as terminal — it stops retrying and shows "Your session expired. Please log in again." instead of burning reconnect attempts against a dead session.

Because auth requires an async DB round-trip, the server briefly buffers any messages sent before it completes (e.g. an eager `join_room`) and replays them once the connection is registered — so nothing sent immediately on `open` is lost.

## Message contract

Defined in `apps/ws-server/types.ts`, hand-mirrored (not imported/shared) in `apps/web/lib/whiteboard-socket.ts` — **both files must be kept in sync manually** when the wire protocol changes.

### Client → server

| Type | Payload | Notes |
|---|---|---|
| `join_room` | `{ slug }` | Joins a room; server replies with `room_state` + presence roster |
| `leave_room` | `{ slug }` | Explicit leave |
| `element_add` | `{ slug, element }` | New shape |
| `element_update` | `{ slug, element }` | Shape changed (throttled to ~30/sec per element on the client) |
| `element_delete` | `{ slug, elementId }` | Shape removed |
| `cursor` | `{ slug, x, y }` | **Ephemeral** — never persisted |
| `selection` | `{ slug, elementIds }` | **Ephemeral** — never persisted |

### Server → client

| Type | Payload | Notes |
|---|---|---|
| `room_state` | `{ slug, elements }` | Sent right after `join_room` — the current snapshot |
| `element_add` / `element_update` / `element_delete` | as above `+ userId` | Echoed to other room members (not back to the sender) |
| `presence` | `{ slug, userId, name, action: "joined" \| "left" }` | Ref-counted per user, not per connection (see below) |
| `cursor` | `{ slug, userId, name, x, y }` | Ephemeral relay |
| `selection` | `{ slug, userId, name, elementIds }` | Ephemeral relay |
| `error` | `{ message }` | Validation failure, rate limit, etc. |

## Room state & persistence

Room state lives **in-memory** on the ws-server process (`roomState`, `roomIds`, `saveTimers` maps) — there's no cross-instance pub/sub, so this doesn't scale past a single process yet.

- On the **first** `join_room` for a slug, the server hydrates `roomState` from `Room.snapshot` (Prisma `Json?`) via `getRoomSnapshot()`.
- Every mutating op (`element_add/update/delete`) schedules a **debounced save** (1.5s, `scheduleSave`) back to `Room.snapshot`.
- When the **last** connection leaves a room, `evictRoomIfEmpty` clears any pending debounce timer first, then flushes the final state immediately and drops the in-memory entry — so a save can't be dropped or double-written by a race between the debounce and the evict.

## Presence

Presence is **ref-counted per user per room**, not per connection:
- `joined` fires only when a user's **first** connection joins a room.
- `left` fires only when their **last** connection leaves.
- This means opening the same room in two tabs doesn't spam a duplicate "joined", and closing one tab doesn't falsely broadcast "left" while the other tab is still open.
- All three exit paths — explicit `leave_room`, socket close (tab close/network drop), and heartbeat termination — funnel through the same `leaveRoom` cleanup function, so behavior is consistent regardless of how a connection ends.
- New joiners receive a deduped roster of everyone already present before their own `joined` event fires.

## Heartbeat

The server pings every open connection every 30s. Any connection that didn't `pong` back since the last sweep is terminated. This reaps zombie connections (dead laptops, closed tunnels) that would otherwise keep a room "occupied" forever, blocking snapshot save/eviction and leaving stale presence for everyone else.

## Limits / rate limiting

| Limit | Value |
|---|---|
| Soft message size (friendly error) | 256 KB |
| Hard payload size (`maxPayload`, socket closed 1009) | 512 KB |
| Elements per room | 10,000 |
| General bucket (join/leave/element ops) | 40 burst, refills 20/sec — errors when empty |
| Ephemeral bucket (cursor/selection) | 120 burst, refills 60/sec — silently dropped when empty (no error spam, keeps pointer movement smooth) |

## Client: reconnect & offline outbox

`apps/web/lib/use-whiteboard-store.ts` owns the socket lifecycle:

- **Reconnect**: exponential backoff with full jitter (base 1s, cap 30s), up to 8 attempts, then a manual "Reconnect" button. A token-not-ready-yet case (bearer token lands in `localStorage` slightly after mount) is handled by briefly polling (300ms × up to 20 tries) rather than giving up.
- **Offline outbox** (`apps/web/lib/whiteboard-outbox.ts`): while disconnected, durable element ops (`add`/`update`/`delete` only — never cursor/selection) are queued to `localStorage` per room slug, capped at 500 entries, with consecutive updates to the same element coalesced into one. On reconnect, once `room_state` arrives, the queued ops are replayed **on top of** the server snapshot (so the user's unsynced edits survive instead of being wiped), then flushed to the server and the outbox is cleared.
- **Throttling**: outgoing `element_update` is coalesced to a trailing-edge send at ~30/sec per element while dragging (local UI stays instant); `cursor` ~30fps, `selection` ~16fps. Adds and deletes are never throttled.

See [WEBSOCKET_FIXES.md](../WEBSOCKET_FIXES.md) at the repo root for the detailed history of bugs found and fixed in this layer.

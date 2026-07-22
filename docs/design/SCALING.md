# Scaling `ws-server` horizontally

Status: design proposal. No code in this doc has been applied — `apps/ws-server`
still runs as a single process. This document defines the target architecture
and a seam-by-seam plan to get there without a big-bang rewrite.

## 1. Problem statement

`apps/ws-server/index.ts` is a single `bun`/Node process holding a raw `ws`
`WebSocketServer` on `WS_PORT` (default 8080). Every piece of runtime state
lives in module-level JS objects, private to that one process:

- **`connections`** — `Map<connectionId, ConnectionType>`
  (`apps/ws-server/index.ts:49`). One entry per live TCP socket, keyed by a
  `randomUUID()` minted at connect time (`index.ts:247`). Holds the actual
  `WebSocket` handle, the user's room membership (`rooms: Map<slug,
  RoomSession>`), heartbeat flag, and per-connection rate-limit buckets.
  This is inherently process-local — a `WebSocket` object cannot be handed to
  another process — so "which sockets are open" can never be fully
  centralized. Every other structure below derives from it.

- **`roomMaps.roomState`** — `Map<slug, unknown[]>`
  (`index.ts:51`, type at `middleware/helper.ts:56`). The authoritative,
  in-memory whiteboard element list per room. Hydrated once per room from
  `Room.snapshot` (Postgres JSON) via `getRoomSnapshot` on first join
  (`index.ts:182-190`), mutated directly on `element_add` / `element_update` /
  `element_delete` (`index.ts:386-409`, `445-453`, `489-493`), and is the
  payload sent to a newly joining client as `room_state`
  (`index.ts:192-196`). **This is the crux of the scaling blocker**: it is
  read-modify-written with no locking and no cross-process visibility, so a
  second instance holding its own copy would silently diverge from the first
  the moment two users land on different instances.

- **`roomMaps.roomIds`** — `Map<slug, number>` (`index.ts:52`), a cache of the
  Postgres `Room.id` for a slug, used to call `saveRoomSnapshot(roomId, ...)`.
  Cheap to look up from Postgres but currently only ever populated in-process
  (`index.ts:180`), so a second instance would refetch it independently —
  harmless by itself, but symptomatic of everything being process-scoped.

- **`roomMaps.saveTimers`** — `Map<slug, Timeout>` (`index.ts:53`), the
  debounce timer for flushing `roomState` back to Postgres
  (`middleware/helper.ts:130-146`, `scheduleSave`, 1500ms debounce). Timers
  are obviously process-local; with N instances each holding a shard of a
  room's writes, you'd get N independent debounced writers racing to
  overwrite the same `Room.snapshot` row, each with a partial view.

- **Presence** is not a separate map — it's derived by scanning
  `connections` for `conn.rooms.has(slug)`
  (`middleware/helper.ts:89-99`, `userConnectionCountInRoom`; and
  `sendPresenceRosterToJoiner`, `index.ts:104-127`). This only sees sockets
  connected to *this* process. On instance B, a user connected to instance A
  is invisible — join/leave presence broadcasts and the roster sent to a new
  joiner would both be wrong (missing peers, and potentially firing a false
  "joined" broadcast on B when the user already has a tab open via A).

- **Broadcast** — `broadcastToRoom` (`middleware/helper.ts:66-84`) iterates
  the local `connections` map and calls `ws.send` directly. This is the
  literal reason a second process doesn't work: if user X is on instance A
  and user Y is on instance B, and X draws a shape, `broadcastToRoom` on A
  only walks A's `connections` map — Y's socket (on B) is never reached. **No
  message ever crosses a process boundary today.**

- **Rate limiting** — token buckets (`TokenBucket`,
  `middleware/helper.ts:22-53`) live inline on each `ConnectionType`
  (`general`, `ephemeral` fields, `index.ts:255-256`). Per-connection, not
  per-user, so this one is actually fine to stay local — a user with tabs
  split across instances just gets independent buckets per tab, which is
  already true today per-connection and is not a correctness issue, only a
  (minor, pre-existing) fairness one.

**Net effect**: running a second `ws-server` process today produces a classic
split-brain — two disjoint room-state copies, two disjoint presence views, and
broadcasts that only reach half the audience. The blocker is not one
structure but three coupled ones: **broadcast fan-out**, **room element
state**, and **presence**, all scoped to the process's local
`connections`/`roomMaps` maps.

## 2. Target architecture

### Topology

```
                      ┌─────────────┐
   clients  ───────►  │ Load Balancer│
   (wss://)           │ (sticky, L4/L7 hash on room slug or conn) │
                      └──────┬──────┘
                 ┌───────────┼───────────┐
                 ▼           ▼           ▼
           ws-server-1  ws-server-2  ws-server-3   (stateless-ish, N replicas)
                 │           │           │
                 └─────┬─────┴─────┬─────┘
                       ▼           ▼
                 Redis Pub/Sub   Redis (presence sets, rate-limit buckets,
                 (broadcast)      optional room-state cache)
                       │
                       ▼
                    Postgres (Room.snapshot — durable source of truth)
```

### Sticky vs non-sticky sessions

**Recommendation: non-sticky at the connection level, but use a
Redis Pub/Sub fan-out so it doesn't matter which instance a client lands on.**

Rationale:
- WebSocket connections are long-lived; sticky sessions (LB hashing on a
  cookie or client IP) mostly help by keeping a *given connection* on one
  backend for its lifetime, which is automatic for WS anyway — LBs don't
  re-route an established connection mid-flight. What sticky sessions *don't*
  solve is two different users in the same room landing on two different
  instances, which is the common case at any real scale. So sticky sessions
  alone are not sufficient here.
  - Optional/staged variant: `sticky by room slug` (consistent hashing on the
    `slug` query/path param at the LB) would concentrate one room's traffic
    on one instance, reducing cross-instance fan-out for the hot path — but
    it reintroduces a soft single-point-of-failure per room and complicates
    LB config (most managed LBs, e.g. an AWS NLB or a simple nginx/haproxy
    setup, hash on client IP or a cookie, not on a WS query param, without
    custom Lua/config). **Not recommended for v1** — plain round-robin/least-
    connections is simpler and works once Pub/Sub exists.
- With Redis Pub/Sub doing cross-instance fan-out (see below), instance
  placement becomes irrelevant to correctness. Sticky sessions become purely
  an optimization (fewer cross-process hops for same-room traffic), not a
  requirement. Ship without it; revisit only if Redis Pub/Sub fan-out volume
  becomes a bottleneck.

### Cross-instance broadcast: Redis Pub/Sub

Each instance keeps its local `connections` map (sockets can't leave a
process) but broadcast no longer assumes the recipient is local:

1. On any room mutation or ephemeral event, the *originating* instance
   publishes the `ServerMessage` to a Redis channel keyed by slug (e.g.
   `room:{slug}`).
2. Every instance subscribes to channels for rooms it currently has at least
   one local connection in (subscribe on first local join, unsubscribe on
   last local leave — mirrors today's `evictRoomIfEmpty` lifecycle).
3. On receiving a published message, an instance fans it out to its *local*
   sockets in that room via the existing `broadcastToRoom` — unchanged logic,
   just fed from Redis instead of directly from the handler.

This makes `broadcastToRoom`'s exclusion semantics (`excludeConnectionId`,
used so the sender doesn't get its own echo, `index.ts:411-421` etc.) need
one adjustment: the exclusion has to survive the trip through Redis, since
the publishing instance also self-subscribes. Include the originating
`connectionId` (or a per-instance id) in the published envelope and filter it
out on receipt — see interface sketch in §3.

### Where authoritative room state should live

Three options considered:

**Option A — Redis as the source of truth for live room state**, Postgres
only for cold storage / durability snapshot. Every `element_add/update/delete`
writes to a Redis data structure (hash or list per room), reads always go to
Redis. Fully consistent across instances, low latency, but adds an
availability dependency (Redis down ⇒ no edits possible even though Postgres
is fine) and requires re-deriving all the array-membership logic
(`elements.some/findIndex/filter`, `index.ts:389-490`) as Redis commands
(hash field ops), which is more moving parts.

**Option B — Postgres snapshot + Redis cache** (mirrors today's model,
generalized). Keep the current shape almost exactly: an in-memory (or
Redis-cached) working copy of the element array per room, still debounce-
flushed to `Room.snapshot`, but the "in-memory" tier becomes Redis instead of
a local JS `Map` — so any instance can read/write it and it survives an
individual instance restarting. Consistency is LWW per Redis write (Redis
single-threaded command execution gives you atomicity per command, so e.g. an
atomic Redis list/hash op replaces the current unsynchronized `Array.push` /
`findIndex`+assign).

**Option C — Dedicated per-room owner instance** (actor-per-room / sharding).
Route all traffic for a given room slug to exactly one instance
(consistent-hash at the LB or an internal router), so that instance keeps
`roomState` in local memory exactly as today, with zero cross-instance
coordination for state, only for *routing* the initial connection. Other
instances proxy or redirect.

**Recommendation: Option B (Postgres snapshot + Redis cache/broadcast),
generalized from the current design.**

Rationale for this app's scale (a collaborative whiteboard product, not a
figma-scale real-time engine): 
- It is the smallest structural delta from the current code — `RoomMaps`
  already separates "hot in-memory state" from "durable Postgres snapshot"
  with a debounce save; Option B just moves the hot tier from a local `Map`
  to Redis, which is a swap of the storage backend behind the same
  `RoomStateStore` interface (§3), not a rewrite of the app's data model.
- Option A buys stronger cross-instance consistency guarantees that this app
  doesn't need yet — room edit volume is bursty and per-room, not a global
  hot key, so Redis-as-cache with debounced Postgres flush is enough; making
  Redis the *only* copy raises the operational bar (backup/AOF tuning,
  because losing Redis before a debounce flush loses unsaved edits — whereas
  with Option B, Redis is disposable/rebuildable from the Postgres snapshot
  at any time, which is a meaningfully simpler failure mode).
- Option C avoids touching room-state code entirely but reintroduces a
  soft single-instance-per-room bottleneck (hot rooms don't scale past one
  instance's CPU/connection budget) and needs custom LB routing logic that
  the rest of this stack doesn't have infrastructure for (no service mesh /
  internal proxy layer currently exists — see §5 for how this could still be
  a *later* optimization layered on top of B, not a replacement for it).

So: **Redis hash per room (`room:{slug}:elements`, field = element id, value
= JSON element) is the live cross-instance cache; Postgres `Room.snapshot`
remains the durable copy, flushed on the same debounce cadence as today
(1500ms) plus on graceful shutdown and room eviction.** Redis eviction/TTL is
not used for this key — presence-based `RoomStateStore` lifecycle
(populate on first join anywhere, allowed to be evicted from Redis only when
truly no instance has anyone in the room, mirroring `evictRoomIfEmpty`)
keeps it bounded, same as today's `MAX_ELEMENTS_PER_ROOM` cap.

## 3. Concrete change plan

Four seams, each an interface with a `Local*` (current behavior, default when
`REDIS_URL` unset — keeps single-instance dev/tests working unmodified) and a
`Redis*` implementation.

### 3.1 `Broadcaster`

Replaces direct use of `broadcastToRoom` as the only fan-out path. Wraps
"publish to whoever needs this message," whether they're local sockets or on
another instance.

```ts
// apps/ws-server/broadcast/types.ts
export interface Broadcaster {
  // Fan out `message` to every connection in `slug` except `excludeConnectionId`,
  // across ALL instances (local sockets handled directly; remote via transport).
  publish(slug: string, message: ServerMessage, excludeConnectionId?: string): Promise<void>;

  // Called when this instance gets its first local connection in `slug` —
  // Redis impl subscribes to the room's channel; Local impl no-ops.
  onRoomActivated(slug: string): Promise<void>;

  // Called from evictRoomIfEmpty equivalent — Redis impl unsubscribes.
  onRoomDeactivated(slug: string): Promise<void>;
}
```

- `LocalBroadcaster` — thin wrapper around today's `broadcastToRoom`
  (`middleware/helper.ts:66-84`); `onRoomActivated`/`onRoomDeactivated`
  no-ops. This is what runs when `REDIS_URL` is unset, so local dev
  (`bun --hot index.ts`) and any existing tests keep working unchanged.
- `RedisBroadcaster` — `publish` does two things: (1) calls the same local
  `broadcastToRoom` for this instance's own sockets (so senders on this
  instance get low-latency delivery without a Redis round trip), tagged with
  an `originInstanceId`; (2) `PUBLISH`es the envelope
  `{ originInstanceId, excludeConnectionId, message }` to `room:{slug}`. The
  subscribe handler on *every* instance (including the origin) receives it,
  and instances *other than* the origin call local `broadcastToRoom`. The
  origin skips re-delivering (it already did step 1) — dedupe by comparing
  `originInstanceId` to `process.env.INSTANCE_ID` (new env var, §6).
- **Code that changes**: every call site of `broadcastToRoom` in
  `index.ts` (`element_add` at line ~411, `element_update` ~455,
  `element_delete` ~495, `cursor` ~530, `selection` ~560, presence `joined`
  ~203 and `left` in `leaveRoom` ~140) switches from calling
  `broadcastToRoom(connections, ...)` directly to `broadcaster.publish(...)`.
  `handleJoinRoom`/`leaveRoom` additionally call `onRoomActivated` /
  `onRoomDeactivated` at the same points they currently touch
  `roomState`/`evictRoomIfEmpty`.

### 3.2 `RoomStateStore`

Replaces direct `roomMaps.roomState` Map access.

```ts
// apps/ws-server/room-state/types.ts
export interface RoomStateStore {
  // Load elements for `slug`; on cache miss, hydrate from Postgres snapshot
  // (getRoomSnapshot) exactly as handleJoinRoom does today.
  getElements(slug: string): Promise<unknown[]>;

  // Atomic add — must reject duplicates and enforce MAX_ELEMENTS_PER_ROOM
  // the same way index.ts:389-407 does today. Returns false on duplicate/cap.
  addElement(slug: string, element: ElementLike): Promise<boolean>;

  updateElement(slug: string, element: ElementLike): Promise<boolean>; // false if id not found
  deleteElement(slug: string, elementId: string): Promise<void>;

  // Debounced durable flush — same contract as scheduleSave today.
  scheduleFlush(slug: string, roomId: number): void;

  // Immediate flush + local cleanup, used by evictRoomIfEmpty and SIGTERM.
  flushAndEvict(slug: string, roomId: number | undefined): Promise<void>;
}
```

- `LocalRoomStateStore` — `roomMaps.roomState`/`roomIds`/`saveTimers` exactly
  as they exist today (`middleware/helper.ts:55-59`, `130-146`), just moved
  behind this interface. No behavior change for single-instance mode.
- `RedisRoomStateStore` — backs `getElements`/`addElement`/etc with a Redis
  hash `room:{slug}:elements` (`HGETALL`, `HSETNX`-then-check for the
  duplicate-id case, `HSET`, `HDEL`). `scheduleFlush` keeps a **local**
  `setTimeout` per slug per instance (Redis has no native debounce), but
  guards the actual `saveRoomSnapshot` write with a short Redis lock
  (`SET room:{slug}:flushlock NX PX 1000`) so if two instances both have
  pending flush timers for the same room (both have local members), only one
  actually writes to Postgres per debounce window — avoiding the "N
  independent debounced writers" race flagged in §1. The write itself reads
  the *current* Redis hash state at flush time (not a stale local copy), so
  even the "losing" instance's edits are captured by whichever flush wins.
- **Code that changes**: `handleJoinRoom`'s snapshot hydration
  (`index.ts:182-190`) becomes `roomStateStore.getElements(slug)`.
  `element_add`/`update`/`delete` handlers (`index.ts:386-509`) replace
  direct `roomState.get/set` + array mutation with the store methods.
  `scheduleSave`/`evictRoomIfEmpty` (`middleware/helper.ts:101-146`) become
  thin callers of `scheduleFlush`/`flushAndEvict`.

### 3.3 `PresenceStore`

Replaces "scan `connections` for who's in a room."

```ts
// apps/ws-server/presence/types.ts
export interface PresenceStore {
  // Called on join: register (slug, userId, connectionId, instanceId) with a
  // heartbeat TTL. Returns true if this was the user's first connection
  // ANYWHERE (not just this instance) in the room — replaces the local
  // `alreadyPresent` check at index.ts:176-177.
  join(slug: string, userId: string, connectionId: string): Promise<{ isFirstConnection: boolean }>;

  // Called on leave/close/heartbeat-terminate: deregister. Returns true if
  // this was the user's LAST connection anywhere — replaces
  // userConnectionCountInRoom === 0 at index.ts:139.
  leave(slug: string, userId: string, connectionId: string): Promise<{ wasLastConnection: boolean }>;

  // Roster for a newly joining client — replaces sendPresenceRosterToJoiner's
  // scan over local `connections` (index.ts:104-127).
  listPeers(slug: string, excludeUserId: string): Promise<{ userId: string; name: string }[]>;

  // Refresh TTL on heartbeat pong so a crashed instance's users auto-expire
  // from presence without an explicit leave.
  heartbeat(connectionId: string): Promise<void>;
}
```

- `LocalPresenceStore` — implements this on top of the existing
  `connections` scan logic (`userConnectionCountInRoom`,
  `sendPresenceRosterToJoiner`), unchanged behavior for single-instance.
- `RedisPresenceStore` — Redis set `presence:{slug}` of `userId`, plus a hash
  `presence:{slug}:conns` mapping `connectionId -> {userId, name,
  instanceId}` with a TTL refreshed on every heartbeat pong (mirrors the
  existing `HEARTBEAT_INTERVAL_MS` sweep at `index.ts:70-85`, but now the TTL
  expiring *is* the failure-detection mechanism cross-instance — if instance
  B crashes uncleanly, its users' presence entries expire within one TTL
  window instead of hanging around forever, which today's local-only
  `isAlive` flag can't provide once the crashed instance isn't around to sweep
  them). `join`/`leave` use `SADD`/`SREM` + refcount (`HINCRBY` on a
  per-(slug,userId) connection counter) to reproduce the ref-counted
  multi-tab semantics currently done by counting `connections` entries
  (`middleware/helper.ts:89-99`).
- **Code that changes**: `sendPresenceRosterToJoiner` (`index.ts:104-127`)
  and the `alreadyPresent`/broadcast-`joined` logic in `handleJoinRoom`
  (`index.ts:176-215`), plus `userConnectionCountInRoom` usage in `leaveRoom`
  (`index.ts:132-153`), all become calls into `PresenceStore`. The heartbeat
  sweep (`index.ts:70-85`) additionally calls `presenceStore.heartbeat(...)`
  on every pong alongside the existing `conn.isAlive = true`.

### 3.4 Distributed rate limiting

Current token buckets (`TokenBucket`, `middleware/helper.ts:22-53`) are
per-connection and stored on `ConnectionType` — as noted in §1 this is not a
correctness bug at N instances, only a fairness gap if a single hostile actor
opens connections split across instances to multiply their effective budget.
**Recommendation: leave per-connection buckets local (no change) for v1**;
they solve the DoS-shape problem (bound one socket's message rate) that they
were built for, and centralizing them costs a Redis round trip on every
single inbound message (`element_add`, `cursor`, etc. — the hottest path in
the whole server), which is a bad latency trade for a fairness edge case.

If/when abuse patterns actually show connection-splitting to evade limits,
add a **secondary, coarser, per-user distributed check**, not a replacement:

```ts
// apps/ws-server/rate-limit/types.ts
export interface DistributedRateLimiter {
  // Coarse per-user-per-room budget, checked in addition to (not instead of)
  // the existing local per-connection TokenBucket. Backed by a Redis Lua
  // script implementing token-bucket semantics atomically (GCRA or
  // INCR+EXPIRE window is enough; doesn't need sub-ms precision).
  consumeUser(userId: string, slug: string, cost: number): Promise<boolean>;
}
```

This stays out of scope for the initial multi-instance migration — call it
out in the doc but don't build it in phase 1 (see §5).

### Wiring

`index.ts` picks implementations once at startup based on `process.env.REDIS_URL`:

```ts
const broadcaster: Broadcaster = process.env.REDIS_URL
  ? new RedisBroadcaster(redisClient, INSTANCE_ID)
  : new LocalBroadcaster(connections);

const roomStateStore: RoomStateStore = process.env.REDIS_URL
  ? new RedisRoomStateStore(redisClient)
  : new LocalRoomStateStore(roomMaps);

const presenceStore: PresenceStore = process.env.REDIS_URL
  ? new RedisPresenceStore(redisClient, INSTANCE_ID)
  : new LocalPresenceStore(connections);
```

`connections` (the local socket map, `index.ts:49`) stays exactly as-is in
every scenario — it is inherently process-local and none of the three stores
above try to replace it, only the cross-instance-visible *derived* state.

## 4. Consistency / conflict considerations

Today's model is already last-writer-wins at the single-process level: two
users editing the same element concurrently just race on
`elements[index] = element` (`index.ts:453`) / the equivalent for add/delete,
with whichever `element_update` message the process handles last winning, and
both clients converging on that value via broadcast. There is no operational
transform or CRDT merge — the whole element object is replaced wholesale.

**Multi-instance changes the mechanics of the race but not its shape**, given
the Option B design in §2:
- With `RedisRoomStateStore.updateElement` implemented as a single `HSET`
  (§3.2), Redis's single-threaded command execution makes each individual
  update atomic — no torn writes, no lost update *within* one field-level
  operation. Two concurrent `element_update`s for the same element ID from
  different instances still resolve as LWW, same as today: whichever `HSET`
  reaches Redis last wins, and both instances broadcast their own version to
  their local peers via Pub/Sub, so **all clients converge on the last
  write**, matching today's guarantee.
- The one new failure mode vs. single-instance: message *arrival order*
  across instances is not guaranteed to match Redis command order under
  Pub/Sub (a slow subscriber, network jitter). In the current single-process
  model, broadcast order === mutation order (`index.ts` mutates `roomState`
  then broadcasts synchronously, `index.ts:409-423`). Cross-instance, it's
  possible — rare, but possible — for the *broadcast* two users see to arrive
  in a different order than the *storage* writes landed in Redis, causing a
  momentary UI flicker where a client briefly renders a stale value before
  the final one arrives. This self-heals on the next `room_state` fetch
  (join) or the next edit to that element, and does not affect the
  Postgres-durable snapshot (which reads current Redis hash state at flush
  time, not the broadcast stream). Acceptable for a whiteboard app; call out
  explicitly rather than silently accept.
- **Do we need a per-room lock or CRDT?** No, not for this app at this
  scale. A per-room lock would serialize all edits to a room across
  instances, which defeats a chunk of the purpose of scaling out (hot rooms
  would bottleneck on lock acquisition instead of CPU). A CRDT (e.g.
  Yjs-style) would give strong offline-friendly conflict-free merges, but is
  a data-model change to `ElementLike`/the wire protocol
  (`apps/ws-server/types.ts:1-9`) far beyond what horizontal scaling
  requires, and whole-object LWW is already the accepted UX today (this
  isn't a regression introduced by scaling, it's carried forward unchanged).
  Revisit only if user complaints about "my edit got overwritten" become
  common — that's a product decision independent of this scaling work.
- **`element_add` duplicate-id check** (`index.ts:389-398`) needs to become
  atomic under Redis too (§3.2, `HSETNX`-then-verify) — otherwise two
  instances racing to add the same new element id (unlikely given client-
  generated UUIDs, but possible on retry/reconnect-replay) could both
  "succeed" locally before either's Redis write lands, producing duplicate
  broadcasts. Flag this as a concrete implementation detail, not just a
  design footnote — `HSETNX` naturally gives first-writer-wins here, which is
  the correct semantics (unlike the update case where LWW is correct).

## 5. Migration path

Each step should be independently shippable and leaves the system in a
working state (single OR multi instance) at every point.

1. **Extract the interfaces, ship Local-only.** Introduce `Broadcaster`,
   `RoomStateStore`, `PresenceStore` (§3) with only the `Local*`
   implementations, wired into `index.ts` in place of direct
   `connections`/`roomMaps` access. Zero behavior change, zero new infra —
   this is a refactor commit that makes the later Redis swap additive
   instead of invasive. Verifiable with today's existing single-instance
   flows.
2. **Add Redis, wire `RedisBroadcaster` only, behind `REDIS_URL`.** Stand up
   Redis (env var added, §6). Implement `RedisBroadcaster` and switch
   broadcast to it when `REDIS_URL` is set, while `RoomStateStore` and
   `PresenceStore` *stay Local* even in multi-instance mode. This is
   deliberately inconsistent (each instance still has its own room-state/
   presence view) and **not yet safe to run >1 instance** — but it's the
   smallest slice that proves the Pub/Sub wiring, connection handling, and
   Redis client lifecycle work, testable by pointing two local processes at
   the same Redis and confirming cross-process delivery in a *single* shared
   room manually.
3. **Add `RedisRoomStateStore`.** Now room element state is instance-
   independent. At this point two instances behind an LB *can* run correctly
   for the room-editing flows, modulo presence still being per-instance
   (a joiner on instance B won't see a roster of users on instance A, and
   `joined`/`left` broadcasts could misfire across instances). Still worth
   shipping standalone since it's the highest-risk store (most complex
   atomicity requirements, §3.2/§4) and can be validated in isolation.
4. **Add `RedisPresenceStore`.** Closes the last gap — multi-instance is now
   fully correct. This is the point at which the LB can actually be
   configured with >1 replica in production traffic, not just staging.
5. **Turn on N replicas + LB.** Configure the load balancer (round-robin or
   least-connections, no sticky requirement per §2) to point at multiple
   `ws-server` instances, all sharing one `REDIS_URL` and one Postgres. Add
   `INSTANCE_ID` (§6) per replica. Roll out behind a feature-flag-style
   staged rollout (e.g. 2 replicas first, watch Redis memory/latency and
   Postgres write volume from concurrent debounced flushes, then scale
   further).
6. **(Optional, later) Distributed rate limiter, sticky-by-room LB tuning.**
   Only if/when justified by observed abuse patterns or cross-instance
   fan-out becoming a measurable bottleneck (§2, §3.4). Not required for
   correctness.

Each step keeps `REDIS_URL` unset as a fully-supported fallback path (local
dev, tests, or a deliberate single-instance deploy) all the way through —
`Local*` implementations are never deleted, only joined by `Redis*` siblings.

## 6. Ops notes

### Environment variables

Add to `.env.example` alongside the existing `WS_PORT` block:

```
# WebSocket server — horizontal scaling
REDIS_URL="redis://localhost:6379"       # unset = single-instance Local* mode (dev default)
INSTANCE_ID=""                            # unique per replica; defaults to a generated UUID if unset
                                           # (used to dedupe Pub/Sub self-delivery, §3.1)
```

`REDIS_URL` absence should remain a supported first-class mode (local dev,
`bun --hot index.ts`), not just a legacy fallback — per §5 this is the
guarantee that keeps every migration step shippable.

### Health checks

Add a lightweight HTTP health endpoint (currently `ws-server` is WS-only, no
HTTP surface at all — `wss.on("connection", ...)` is the entire server,
`index.ts:218`). Minimum viable: an `http.Server` alongside the
`WebSocketServer` exposing:
- `GET /healthz` — process liveness (200 if the event loop is responsive).
  Used by the orchestrator (k8s/ECS/etc.) for restart decisions.
- `GET /readyz` — readiness, additionally checks Redis connectivity (`PING`)
  when `REDIS_URL` is set, and rejects (503) during graceful shutdown drain
  (see below) so the LB stops routing new connections to a draining instance
  before it actually closes.

### Graceful shutdown (flush snapshots on SIGTERM)

Currently there is no `SIGTERM`/`SIGINT` handler at all — only
`unhandledRejection`/`uncaughtException` logging (`index.ts:95-100`). Add:

```ts
process.on("SIGTERM", async () => {
  // 1. Stop accepting new connections / fail readyz immediately.
  server.close(); // http health server
  // 2. Optionally notify connected clients (best-effort) so they can
  //    reconnect to a healthy instance rather than time out.
  // 3. Flush every room this instance has local connections in, immediately
  //    (bypass the 1500ms debounce) — same codepath as flushAndEvict (§3.2),
  //    called for every slug currently present in roomMaps.roomState /
  //    RoomStateStore's local view, not just ones that already had a timer.
  const slugs = new Set([...roomMaps.roomState.keys()]);
  await Promise.allSettled(
    [...slugs].map((slug) =>
      roomStateStore.flushAndEvict(slug, roomMaps.roomIds.get(slug))
    )
  );
  // 4. Deregister this instance's presence entries so they don't linger
  //    until TTL expiry (RedisPresenceStore should expose a bulk
  //    `leaveAll(instanceId)` for this).
  await presenceStore.leaveAll?.(INSTANCE_ID);
  // 5. Close all local sockets (clients reconnect and land on a live
  //    instance via the LB).
  wss.clients.forEach((ws) => ws.close(1001, "server shutting down"));
  process.exit(0);
});
```

This directly generalizes the *existing* flush-on-evict logic
(`evictRoomIfEmpty`, `middleware/helper.ts:101-127`) to "flush everything,
unconditionally, right now" rather than "flush this one room because it just
went empty." Set the orchestrator's shutdown grace period comfortably above
worst-case flush time (a handful of Postgres writes, should be well under a
few seconds; measure under load before finalizing the grace period).

### Sticky-session config

Per §2, sticky sessions are **not required** once Redis Pub/Sub broadcast is
live (step 2+ in §5) — a plain round-robin or least-connections LB is
sufficient and simpler to operate. If sticky-by-client is available cheaply
on the chosen LB (e.g. cookie-based on an ALB, or IP-hash) it's a harmless
minor optimization (slightly warmer local caches, marginally less Pub/Sub
chatter) but should not be treated as a correctness requirement anywhere in
this design — nothing in §3's interfaces assumes it.

### Redis sizing / persistence

Redis here holds three kinds of data with different durability needs:
- Broadcast channels (Pub/Sub) — ephemeral by nature, no persistence needed.
- Room-state cache (`room:{slug}:elements` hashes) — disposable/rebuildable
  from Postgres `Room.snapshot` at any time (that's the whole point of
  Option B, §2), so AOF/RDB persistence is a nice-to-have for warm restarts,
  not a correctness requirement. Losing Redis mid-session loses at most the
  last <1500ms of unflushed edits for actively-open rooms — same blast
  radius as a `ws-server` crash today.
- Presence sets/TTLs — inherently ephemeral, self-healing via heartbeat
  re-registration on reconnect.

A single small managed Redis instance (no cluster mode needed) is sufficient
at this app's current scale; revisit only if room count / concurrent editors
grow enough to make a single Redis instance's throughput a bottleneck.

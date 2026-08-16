# Vexio — WebSocket / Real-Time Fixes

Plain-language summary of everything changed in the real-time layer, why it was broken, and how it's fixed. Each item links to the exact code (`file:line`).

---

## 0. Why NOTHING worked (the real blocker)

The WebSocket code was actually fine. Real-time never worked because **users can't log in**, so the browser never gets an auth token, so the socket is rejected.

**The chain:**
1. `packages/auth/auth.ts` has `requireEmailVerification: true`.
2. Sending the verification email needs SMTP — but your `.env` has **no SMTP settings**, so `packages/auth/email.ts` throws and no email is ever sent.
3. No email → user can't verify → sign-in is blocked → no bearer token is issued.
4. No token → the WebSocket URL is `ws://…?token=` (empty) → the server rejects it and closes with code **4001** → "no real-time features."

We proved the token pipeline itself is correct (live curl: sign-in returns a `set-auth-token`, and that same token passes the WS handshake). So this is an **operational/config issue, not a code bug**.

**What you need to decide (see the end of this doc):** either keep email verification OFF for local dev, or fill in real SMTP credentials so verification emails actually send.

**Two smaller real bugs found and fixed along the way:**
- **Socket opened too early / never retried the token.** The client read the token once when the page mounted and gave up if it wasn't there yet (the token lands a moment later). Now it briefly waits for the token, then connects. → `apps/web/lib/use-whiteboard-store.ts:281` (and constants at `:36`)
- **Web app didn't type-check.** A pre-existing TypeScript error in `apps/web/lib/auth-client.ts:34` is fixed; `bun run check-types` is now clean.
- **`.env` was missing `NEXT_PUBLIC_WS_URL` and `WS_PORT`** — added (they matched the defaults, but are now explicit).

---

## 1. Stability (dropped connections, presence, join/leave)

### Heartbeat — detect dead connections
**Was:** if someone's network dropped (closed laptop, dead tunnel), the server never noticed. That ghost connection kept the room "occupied" forever — so the room never saved/evicted and others still saw the person as "online."
**Fix:** the server now pings every client every 30s and drops any that don't pong back.
→ `apps/ws-server/index.ts:70` (sweep), `:256` (pong), `apps/ws-server/middleware/helper.ts:11`

### Clean auth rejection (close code 4001)
**Was:** a bad/expired token got a plain socket close, indistinguishable from a network blip — so the client kept retrying with the same dead token.
**Fix:** the server closes unauthorized sockets with code **4001**; the client sees 4001 and stops retrying, showing "session expired, please log in again."
→ server `apps/ws-server/index.ts:240` · client `apps/web/lib/use-whiteboard-store.ts:393` · shared code `apps/web/lib/whiteboard-socket.ts:44`

### Multi-tab join/leave presence (the one you specifically asked for)
**Was:** presence was tracked per connection. Open the board in 2 tabs, close 1 → everyone else saw you leave, even though you were still there. Opening a 2nd tab also spammed a duplicate "joined."
**Fix:** presence is now **ref-counted per user, per room**. "Joined" fires only on your *first* connection into a room; "left" fires only when your *last* one leaves. All three exit paths (leave button, tab close, dead-connection sweep) funnel through one cleanup function so presence and room-eviction stay consistent.
→ counter `apps/ws-server/middleware/helper.ts:86` · join gate `apps/ws-server/index.ts:175` · single leave path `apps/ws-server/index.ts:131` · roster dedupe in `sendPresenceRosterToJoiner`
**Proven live:** 2 tabs (same user) + 1 other user → closing tab 1 sent NO "left"; closing the last tab sent exactly ONE "left."

### Snapshot save safety
Verified the debounced save and the on-empty "flush and evict" can't double-write or lose the final board state (the evict path clears the pending timer first). Behavior confirmed correct, unchanged. → `apps/ws-server/middleware/helper.ts`

---

## 2. Scale (stop flooding the network / server)

### Throttle drawing updates
**Was:** every tiny mouse move while dragging/resizing sent a full WebSocket message *and* scheduled a DB save — hundreds per second per shape.
**Fix:** the screen still updates instantly, but the network sends are coalesced to ~30/sec per shape (trailing edge, so the final position always goes out). Adds/deletes are never throttled.
→ `apps/web/lib/use-whiteboard-store.ts:526` (throttled update), `:161` (flush)

### Smarter reconnect
**Was:** fixed linear retry delay, and after giving up your only option was "refresh the page."
**Fix:** exponential backoff with jitter (caps at 30s), plus a **Reconnect button** so you can retry without losing your board.
→ backoff `apps/web/lib/use-whiteboard-store.ts:262` · manual reconnect `:418` · button `apps/web/app/whiteboard/[slug]/page.tsx:2280`

### Abuse / memory limits
**Was:** a client could send unlimited or huge messages and grow server memory without bound.
**Fix:** max message size (256KB soft / 512KB hard), a per-connection rate limit (drawing/control messages throttled; cursors get a separate looser budget so they stay smooth), and a 10,000-element cap per room.
→ buckets `apps/ws-server/middleware/helper.ts:19` · size/rate `apps/ws-server/index.ts:284`, `:313` · element cap `:397`

---

## 3. Offline support (your localStorage idea)

**What it does:** while you're disconnected, your edits are saved to `localStorage` (an "outbox"). When the socket reconnects, those queued edits are replayed on top of the latest server state (so your work isn't wiped by the incoming snapshot) and then flushed to the server. Long drags collapse to one queued update so the outbox can't overflow.
→ new file `apps/web/lib/whiteboard-outbox.ts` · queue-or-send `apps/web/lib/use-whiteboard-store.ts:147` · reconcile + flush on reconnect `:308`

---

## 4. Live collaboration (cursors + selection)

**What it adds:** you now see other people's mouse cursors move in real time (each with a stable per-user color + short label) and a colored outline around whatever shape a teammate has selected. These are "ephemeral" — relayed to the room but **never saved to the database**.
→ server relay `apps/ws-server/index.ts:511` · client senders `apps/web/lib/use-whiteboard-store.ts:585` (cursor), `:605` (selection) · remote state `:355` · render overlay `apps/web/app/whiteboard/[slug]/page.tsx:2748` · per-user color `:1184`

The client↔server message shapes and the 4001 close code were cross-checked and **mirror exactly** on both sides.

---

## What YOU need to do to use it

Real-time works the moment you can log in. Pick one:

- **Fast (local dev):** leave `requireEmailVerification: false` in `packages/auth/auth.ts` (temporarily set for testing). Sign up → sign in → real-time works immediately. *(Don't ship this to production.)*
- **Production-correct:** put real Gmail credentials in `.env` (`SMTP_USER`, `SMTP_PASS` = Google App Password, and optionally `SMTP_FROM` — see `.env.example`), then set `requireEmailVerification` back to `true`. Verification emails will send, users verify, and sign-in issues the token.

⚠️ **Do not flip `requireEmailVerification` back to `true` without working SMTP** — that's exactly what broke real-time for everyone in the first place.

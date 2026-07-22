# HTTP API

Base URL: `NEXT_PUBLIC_AUTH_URL` (default `http://localhost:8000`), served by `apps/http-server` (Express 5).

Response envelope on success: `{ success: true, statusCode, data, message }` (`ApiResponse`). Errors: `{ success: false, message }` with the matching HTTP status (`ApiError`); anything unexpected → `500`.

CORS: origin = `WEB_URL`, credentials enabled, `set-auth-token` header exposed to the browser.

## Auth — `/api/auth/*` (better-auth)

Mounted directly via better-auth's Express handler (`toNodeHandler(auth)`), **before** the JSON body parser — better-auth needs the raw request body. Not custom routes; this is better-auth's standard REST surface, covering (at a high level):

| Concern | What it does |
|---|---|
| Sign up | Email + password registration; optionally sends a verification email |
| Sign in | Email/password, or Google/GitHub OAuth redirect flow |
| Sign out | Clears the session |
| Session | Get current session/user |
| Email verification | Verify via emailed link (currently `requireEmailVerification: false` — see [07-roadmap.md](./07-roadmap.md)) |
| Password reset | Request reset email, then confirm with new password |

Every successful sign-in/sign-up response includes a `set-auth-token` header — the **bearer token**. `apps/web/lib/auth-client.ts` captures it into `localStorage` (`bearer_token`) and reuses it both for REST `Authorization: Bearer <token>` headers and as the WebSocket `?token=` query param (see [06-realtime-websocket.md](./06-realtime-websocket.md)).

## `GET /api/me`

Returns the current better-auth session, or `401` if not logged in. (Not under `/api/v1`.)

| | |
|---|---|
| Auth required | Yes (session cookie or bearer token) |
| Response 200 | better-auth session object |
| Response 401 | `{ error: "Unauthorized" }` |

## `/api/v1` — Room routes

All routes require auth (`isAuthenticated` middleware — validates the session/bearer token via `auth.api.getSession`, attaches `req.user = { userId, email }`).

### `POST /api/v1/room`

Create a room.

| | |
|---|---|
| Auth required | Yes |
| Body | `{ "slug": string }` |
| Validation | slug trimmed + lowercased; must be 3–64 chars, `a-z0-9-` only |
| Response 201 | `{ success: true, data: { room }, message: "new room created successfully" }` |
| Response 400 | invalid/missing slug |
| Response 401 | unauthorized |
| Response 409 | slug already exists |

### `GET /api/v1/rooms`

List rooms the current user can see: rooms they created **and** rooms where they have a `RoomMember` row (any role).

| | |
|---|---|
| Auth required | Yes |
| Response 200 | `{ success: true, data: { rooms: Room[] }, message: "rooms fetched successfully" }` |

### `GET /api/v1/room/:slug`

Fetch a single room by slug.

| | |
|---|---|
| Auth required | Yes, and caller must be a **member** of the room |
| Response 200 | `{ success: true, data: { room }, message: "room fetched successfully" }` |
| Response 400 | missing slug |
| Response 403 | authenticated but not a member of this room |
| Response 404 | room not found |

### `PATCH /api/v1/room/:slug`

Rename a room (change its slug). ADMIN only.

| | |
|---|---|
| Auth required | Yes, caller must have role `ADMIN` on the room |
| Body | `{ "slug": string }` — the new slug (same validation as create: 3–64 chars, `a-z0-9-`, trimmed + lowercased) |
| Response 200 | `{ success: true, data: { room }, message: "room renamed successfully" }` |
| Response 400 | invalid slug, or new slug same as current |
| Response 403 | not an admin of this room |
| Response 404 | room not found |
| Response 409 | new slug already taken |

### `DELETE /api/v1/room/:slug`

Delete a room. ADMIN only. Cascades to its `RoomMember`, `RoomInvite`, and `Chat` rows.

| | |
|---|---|
| Auth required | Yes, caller must have role `ADMIN` on the room |
| Response 200 | `{ success: true, data: {}, message: "room deleted successfully" }` |
| Response 403 | not an admin of this room |
| Response 404 | room not found |

### `POST /api/v1/room/:slug/leave`

Leave a room you're a member of. Blocked if you're the room's only admin (transfer the admin role or delete the room instead).

| | |
|---|---|
| Auth required | Yes, caller must be a member |
| Response 200 | `{ success: true, data: {}, message: "left room successfully" }` |
| Response 400 | caller is the only admin of the room |
| Response 403 | not a member of this room |
| Response 404 | room not found |

### `GET /api/v1/room/:slug/members`

List a room's members. Member-only (any role).

| | |
|---|---|
| Auth required | Yes, caller must be a member |
| Response 200 | `{ success: true, data: { members: RoomMember[] }, message: "room members fetched successfully" }` |
| Response 403 | not a member of this room |
| Response 404 | room not found |

### `PATCH /api/v1/room/:slug/members/:userId`

Change a member's role. ADMIN only. Blocked if it would demote the room's only admin.

| | |
|---|---|
| Auth required | Yes, caller must have role `ADMIN` on the room |
| Body | `{ "role": "ADMIN" \| "EDITOR" \| "VIEWER" }` |
| Response 200 | `{ success: true, data: { member }, message: "member role updated successfully" }` |
| Response 400 | missing/invalid role, or would demote the only admin |
| Response 403 | caller is not an admin of this room |
| Response 404 | room not found, or target user is not a member |

### `DELETE /api/v1/room/:slug/members/:userId`

Remove a member from a room. ADMIN only. Blocked if the target is the room's only admin.

| | |
|---|---|
| Auth required | Yes, caller must have role `ADMIN` on the room |
| Response 200 | `{ success: true, data: {}, message: "member removed successfully" }` |
| Response 400 | target is the only admin of the room |
| Response 403 | caller is not an admin of this room |
| Response 404 | room not found, or target user is not a member |

### `POST /api/v1/room/:slug/invite`

Create an invite link for a room. ADMIN only. Invite roles are limited to `EDITOR`/`VIEWER` (you cannot mint an `ADMIN` invite).

| | |
|---|---|
| Auth required | Yes, caller must have role `ADMIN` on the room |
| Body | `{ "role"?: "EDITOR" \| "VIEWER", "expiresInHours"?: number }` — both optional; role defaults to `EDITOR`, no `expiresInHours` means the invite never expires |
| Response 201 | `{ success: true, data: { invite, inviteUrl }, message: "invite created successfully" }` — `invite` is the `RoomInvite` row, `inviteUrl` is `${WEB_URL}/invite/:token` |
| Response 400 | invalid role or `expiresInHours` |
| Response 403 | caller is not an admin of this room |
| Response 404 | room not found |

### `POST /api/v1/invite/:token/accept`

Accept an invite: upserts a `RoomMember` row for the caller at the invite's role (updates the role if already a member).

| | |
|---|---|
| Auth required | Yes |
| Response 200 | `{ success: true, data: { slug, member }, message: "invite accepted successfully" }` — `slug` is the room's slug, so the client can redirect straight into it |
| Response 400 | invite has expired |
| Response 404 | invite token not found, or (unexpectedly) its room is gone |

## Other

`GET /` → `{ msg: "working fine" }` (health check). Unmatched routes → `404 { success: false, message: "not found" }`.

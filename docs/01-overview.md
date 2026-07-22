# Overview

Vexio is a real-time collaborative whiteboard — think Excalidraw. Multiple people open the same "room" and draw shapes together, seeing each other's cursors, selections, and edits live, with changes saved automatically.

## Core concepts

| Concept | What it is |
|---|---|
| **User** | An account (email/password or Google/GitHub OAuth), managed by better-auth. |
| **Room** | A whiteboard, addressed by a unique `slug`. Has one owner (`adminId`) — no invite/collaborator list yet. |
| **Snapshot** | The room's whiteboard content — a JSON array of drawing elements, persisted on `Room.snapshot`. |
| **Real-time sync** | While a room is open, edits flow over a WebSocket to every connected peer and are periodically saved back to the snapshot. |

## Feature list (verified working)

- Sign up / sign in with email+password, or Google/GitHub OAuth
- Password reset via email
- Create a room, list "my rooms", open a room by slug
- Live collaborative drawing: add / move / delete shapes, seen instantly by everyone in the room
- Live cursors and selection outlines for everyone else in the room (ephemeral — never saved)
- Presence ("X joined" / "X left"), correct even across multiple tabs for the same user
- Undo / redo
- Automatic reconnect with backoff, plus a manual "Reconnect" button
- Offline editing: edits made while disconnected are queued locally and replayed on reconnect

## Current status — what's in progress / not real yet

- **AI icon generator** — the landing page has an "AI icon generator" section (`apps/web/components/AiIconSection.tsx`). It's marketing UI only: static demo copy and icons, no backend or model behind it.
- **Chat** — a `Chat` database model and full service layer exist, but nothing in the app calls them. No chat UI, no route, no WebSocket message type.
- **Room access control** — a room only has a single owner. Anyone with a valid login and the room's slug can join it over WebSocket; there's no membership or invite list.
- **Email verification** — turned off by default for local dev (see [07-roadmap.md](./07-roadmap.md)); the SMTP path exists but needs real credentials to work end-to-end.

See [07-roadmap.md](./07-roadmap.md) for the full honest checklist of what's left.

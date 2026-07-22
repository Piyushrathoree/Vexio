# Vexio Docs

Vexio is a real-time collaborative whiteboard (Excalidraw-style) — draw shapes, see other people's cursors and edits live, and pick up where you left off after a refresh or a dropped connection. It's a Turborepo/bun monorepo: a Next.js frontend, an Express REST/auth API, a raw-WebSocket real-time server, and a shared Postgres (Neon) database via Prisma.

This is the documentation index. Each page is short and focused — read them in order for a full picture, or jump to what you need.

| Page | What's in it |
|---|---|
| [01-overview.md](./01-overview.md) | What Vexio does, core concepts, feature list, current status |
| [02-architecture.md](./02-architecture.md) | Monorepo layout, system diagram, tech stack |
| [03-getting-started.md](./03-getting-started.md) | Prerequisites, env setup, how to run everything |
| [04-data-model.md](./04-data-model.md) | Prisma models, fields, ER diagram |
| [05-http-api.md](./05-http-api.md) | Every REST endpoint (auth + room routes) |
| [06-realtime-websocket.md](./06-realtime-websocket.md) | WebSocket protocol, message types, presence, offline outbox |
| [07-roadmap.md](./07-roadmap.md) | What's left / known gaps, as a checklist |

For deep implementation notes and known sharp edges (aimed at AI coding agents but useful for anyone), see [`/CLAUDE.md`](../CLAUDE.md) at the repo root. For the history of real-time bug fixes, see [`/WEBSOCKET_FIXES.md`](../WEBSOCKET_FIXES.md).

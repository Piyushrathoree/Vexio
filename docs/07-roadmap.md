# Roadmap / Known Gaps

An honest checklist of what's left. Nothing here is secret — it's all visible in the code, called out here so it's easy to find.

## Done

- [x] **Email delivery**: migrated to Resend (`packages/auth/email.ts`). `RESEND_API_KEY` / `RESEND_FROM_EMAIL` are read and used; missing key now just no-ops delivery (logs a warning) instead of silently failing against unused `SMTP_*` vars.
- [x] **Room membership + ACL model**: `RoomMember` (role `ADMIN`/`EDITOR`/`VIEWER`) and `RoomInvite` models exist. `GET /api/v1/room/:slug` now enforces membership (`403` if the caller isn't a member), and `GET /api/v1/rooms` returns rooms the user created *or* is a member of. See [04-data-model.md](./04-data-model.md).
- [x] **Room lifecycle + invite endpoints**: rename (`PATCH /api/v1/room/:slug`), delete (`DELETE /api/v1/room/:slug`), leave (`POST /api/v1/room/:slug/leave`), member list/role-update/removal, and invite create/accept. All admin-gated where appropriate, with last-admin protections. See [05-http-api.md](./05-http-api.md).
- [x] **Server-side route protection middleware**: `apps/http-server/middleware/middleware.ts` (`isAuthenticated`) plus per-route `requireRoomMember` / `requireRoomAdmin` checks in the controllers.
- [x] **Shared WS contract package**: `@repo/ws-schema` (`packages/ws-schema`) centralizes the WebSocket message unions so `apps/ws-server` and `apps/web` stop hand-defining them separately.
- [x] **Full docs**: this docs/ tree.
- [x] **Template cleanup**: removed leftover starter-template scaffolding.

## In progress / owned by dev

- [ ] **WebSocket enhancements**: enforcing the new room ACL (`RoomMember` roles) over the WS connection itself, finishing `@repo/ws-schema` adoption across `apps/ws-server` and `apps/web`, and wiring up chat (model + service already exist, no route/message type yet). Tracked in [docs/guides/WEBSOCKET_IMPLEMENTATION.md](./guides/WEBSOCKET_IMPLEMENTATION.md).
- [ ] **AI icon generation**: `apps/web/components/AiIconSection.tsx` is still landing-page marketing copy — static demo prompts/icons, no backend or model integration. Design/scope tracked in [docs/guides/AI_ICON_GENERATION.md](./guides/AI_ICON_GENERATION.md).

## Remaining

- [ ] **Apply pending Prisma migrations to Neon**: `20260713120000_add_room_members_invites` and `20260713130000_chat_room_cascade` exist in `packages/db/prisma/migrations` but need to be run against the Neon database (`prisma migrate deploy`).
- [ ] **Type safety**: `apps/web/next.config.ts` still sets `typescript.ignoreBuildErrors: true` — `next build` succeeds even with type errors. Remove the flag and fix whatever `bun run check-types` turns up.
- [ ] **Tests**: there are no test scripts anywhere in the repo currently; add integration tests, especially around the new room/member/invite endpoints and their ACL edge cases (last-admin protections, expired invites).
- [ ] **Multi-instance WS scaling**: room state still lives in a single process's memory (`Map`s in `apps/ws-server/index.ts`). Design for horizontal scaling (pub/sub layer, e.g. Redis) is sketched in [docs/design/SCALING.md](./design/SCALING.md) but not implemented.
- [ ] **Email verification**: flip `requireEmailVerification` to `true` in `packages/auth/auth.ts` once Resend delivery is confirmed working end-to-end in the target environment (currently `false` for local dev).
- [ ] **Turbo task hygiene**: `turbo.json` still declares `db:generate` / `db:push` task shapes that `packages/db` doesn't implement (its actual scripts are `generate`, `migrate`, `reset`, `db:deploy`) — dead config. Either rename the package scripts to match or fix `turbo.json`.

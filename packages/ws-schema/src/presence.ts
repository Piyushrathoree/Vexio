import { z } from "zod";

// Ephemeral presence payloads — mirrors apps/web/lib/use-whiteboard-store.ts's
// RemoteCursor/RemoteSelection/RemoteUser types and the "cursor"/"selection"
// members of ClientMessage/ServerMessage. These are NEVER persisted (see
// apps/web/lib/whiteboard-outbox.ts: only element_add/update/delete are
// queued offline). There is intentionally no `color` field on the wire —
// today color is derived client-side from a hash of `userId`
// (apps/web/app/whiteboard/[slug]/page.tsx).

export const CursorSchema = z.object({
    userId: z.string(),
    name: z.string(),
    x: z.number(),
    y: z.number(),
});
export type Cursor = z.infer<typeof CursorSchema>;

export const SelectionSchema = z.object({
    userId: z.string(),
    name: z.string(),
    elementIds: z.array(z.string()),
});
export type Selection = z.infer<typeof SelectionSchema>;

export const RemoteUserSchema = z.object({
    userId: z.string(),
    name: z.string(),
});
export type RemoteUser = z.infer<typeof RemoteUserSchema>;

export const PresenceActionSchema = z.enum(["joined", "left"]);
export type PresenceAction = z.infer<typeof PresenceActionSchema>;

// FORWARD-LOOKING (not yet emitted by apps/ws-server or consumed by
// apps/web): an optional room-membership role, informed by
// packages/db/prisma/schema.prisma's Room.adminId. Additive and optional so
// existing "presence" server messages (which never carry `role` today)
// continue to validate unchanged.
export const PresenceRoleSchema = z.enum(["admin", "member"]);
export type PresenceRole = z.infer<typeof PresenceRoleSchema>;

export const PresenceEntrySchema = RemoteUserSchema.extend({
    role: PresenceRoleSchema.optional(),
});
export type PresenceEntry = z.infer<typeof PresenceEntrySchema>;

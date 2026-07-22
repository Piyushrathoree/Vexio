import { z } from "zod";

// ---------------------------------------------------------------------------
// FORWARD-LOOKING / PLANNED — not yet wired into apps/web or apps/ws-server.
//
// packages/db/prisma/schema.prisma already has a `Chat` model
// (id: Int, messages: String, roomId: Int, userId: String) with no WS
// transport in front of it yet. These schemas define the shape a future
// real-time chat feature is expected to use, so the message contract can
// grow additively (new discriminated-union members) without another
// hand-sync exercise later. They are exported but intentionally NOT wired
// into any UI/socket handler today — adding them here is non-breaking for
// current ClientMessage/ServerMessage consumers, since existing message
// types are unchanged and callers that only handle known `type`s can ignore
// these variants.
// ---------------------------------------------------------------------------

export const ChatMessageClientSchema = z.object({
    type: z.literal("chat_message"),
    slug: z.string(),
    text: z.string(),
});
export type ChatMessageClient = z.infer<typeof ChatMessageClientSchema>;

export const ChatServerSchema = z.object({
    type: z.literal("chat"),
    slug: z.string(),
    userId: z.string(),
    name: z.string(),
    text: z.string(),
    // Optional: maps to Chat.id (Int, autoincrement) once persisted.
    id: z.number().optional(),
    // Optional: ISO timestamp, once the Chat model gains a createdAt column.
    createdAt: z.string().optional(),
});
export type ChatServer = z.infer<typeof ChatServerSchema>;

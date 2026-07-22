import { z } from "zod";
import { DrawingElementSchema } from "./elements.ts";
import {
    CursorSchema,
    PresenceActionSchema,
    PresenceRoleSchema,
    SelectionSchema,
} from "./presence.ts";
import { ChatMessageClientSchema, ChatServerSchema } from "./chat.ts";

export * from "./elements.ts";
export * from "./presence.ts";
export * from "./chat.ts";

// ---------------------------------------------------------------------------
// Single source of truth for the WS message contract, faithfully unifying
// what today lives duplicated in:
//   - apps/web/lib/whiteboard-socket.ts   (client-side ClientMessage/ServerMessage)
//   - apps/ws-server/types.ts             (server-side ClientMessage/ServerMessage)
//
// Field names, optionality, and nesting are preserved exactly from both
// sources. The one intentional change: `element`/`elements` are now
// DrawingElementSchema-typed instead of `unknown`/`unknown[]` — apps/ws-server
// today only checks for a string `id` (see isElementLike in
// apps/ws-server/index.ts), so validating the full element shape here is a
// STRICTER but backward-compatible contract for well-formed clients.
// ---------------------------------------------------------------------------

const SlugField = z.string();

// --- Client -> Server -------------------------------------------------------

export const JoinRoomMessageSchema = z.object({
    type: z.literal("join_room"),
    slug: SlugField,
});

export const LeaveRoomMessageSchema = z.object({
    type: z.literal("leave_room"),
    slug: SlugField,
});

export const ElementAddClientMessageSchema = z.object({
    type: z.literal("element_add"),
    slug: SlugField,
    element: DrawingElementSchema,
});

export const ElementUpdateClientMessageSchema = z.object({
    type: z.literal("element_update"),
    slug: SlugField,
    element: DrawingElementSchema,
});

export const ElementDeleteClientMessageSchema = z.object({
    type: z.literal("element_delete"),
    slug: SlugField,
    elementId: z.string(),
});

// Ephemeral presence — relayed to room peers, never persisted.
export const CursorClientMessageSchema = z.object({
    type: z.literal("cursor"),
    slug: SlugField,
    x: z.number(),
    y: z.number(),
});

export const SelectionClientMessageSchema = z.object({
    type: z.literal("selection"),
    slug: SlugField,
    elementIds: z.array(z.string()),
});

export const ClientMessageSchema = z.discriminatedUnion("type", [
    JoinRoomMessageSchema,
    LeaveRoomMessageSchema,
    ElementAddClientMessageSchema,
    ElementUpdateClientMessageSchema,
    ElementDeleteClientMessageSchema,
    CursorClientMessageSchema,
    SelectionClientMessageSchema,
    // Forward-looking, additive — see src/chat.ts.
    ChatMessageClientSchema,
]);
export type ClientMessage = z.infer<typeof ClientMessageSchema>;

// --- Server -> Client -------------------------------------------------------

export const RoomStateMessageSchema = z.object({
    type: z.literal("room_state"),
    slug: SlugField,
    elements: z.array(DrawingElementSchema),
});

export const ElementAddServerMessageSchema = z.object({
    type: z.literal("element_add"),
    slug: SlugField,
    element: DrawingElementSchema,
    userId: z.string(),
});

export const ElementUpdateServerMessageSchema = z.object({
    type: z.literal("element_update"),
    slug: SlugField,
    element: DrawingElementSchema,
    userId: z.string(),
});

export const ElementDeleteServerMessageSchema = z.object({
    type: z.literal("element_delete"),
    slug: SlugField,
    elementId: z.string(),
    userId: z.string(),
});

export const PresenceMessageSchema = z.object({
    type: z.literal("presence"),
    slug: SlugField,
    userId: z.string(),
    name: z.string(),
    action: PresenceActionSchema,
    // Forward-looking, additive — see src/presence.ts PresenceRoleSchema.
    // Not emitted by apps/ws-server today; optional so current payloads
    // (which never carry `role`) keep validating unchanged.
    role: PresenceRoleSchema.optional(),
});

// Ephemeral presence — mirror of the client messages above, fanned out to
// peers. Built on top of CursorSchema/SelectionSchema (src/presence.ts) so
// the {userId, name, x, y} / {userId, name, elementIds} shape stays defined
// in exactly one place.
export const CursorServerMessageSchema = CursorSchema.extend({
    type: z.literal("cursor"),
    slug: SlugField,
});

export const SelectionServerMessageSchema = SelectionSchema.extend({
    type: z.literal("selection"),
    slug: SlugField,
});

export const ErrorMessageSchema = z.object({
    type: z.literal("error"),
    message: z.string(),
});

export const ServerMessageSchema = z.discriminatedUnion("type", [
    RoomStateMessageSchema,
    ElementAddServerMessageSchema,
    ElementUpdateServerMessageSchema,
    ElementDeleteServerMessageSchema,
    PresenceMessageSchema,
    CursorServerMessageSchema,
    SelectionServerMessageSchema,
    ErrorMessageSchema,
    // Forward-looking, additive — see src/chat.ts.
    ChatServerSchema,
]);
export type ServerMessage = z.infer<typeof ServerMessageSchema>;

// --- Parsers -----------------------------------------------------------------

/** Parses and validates a raw client -> server payload. Throws z.ZodError on failure. */
export const parseClientMessage = (raw: unknown): ClientMessage =>
    ClientMessageSchema.parse(raw);

/** Parses and validates a raw server -> client payload. Throws z.ZodError on failure. */
export const parseServerMessage = (raw: unknown): ServerMessage =>
    ServerMessageSchema.parse(raw);

/** Safe variant of parseClientMessage — returns a SafeParseReturnType instead of throwing. */
export const safeParseClientMessage = (raw: unknown) =>
    ClientMessageSchema.safeParse(raw);

/** Safe variant of parseServerMessage — returns a SafeParseReturnType instead of throwing. */
export const safeParseServerMessage = (raw: unknown) =>
    ServerMessageSchema.safeParse(raw);

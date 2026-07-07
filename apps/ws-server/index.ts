import "@repo/common";
import { getRoomBySlug, getRoomSnapshot } from "@repo/db";
import { randomUUID } from "crypto";
import { WebSocketServer, type WebSocket } from "ws";
import {
    broadcastToRoom,
    consumeToken,
    evictRoomIfEmpty,
    newBucket,
    scheduleSave,
    send,
    userConnectionCountInRoom,
    type ConnectionType,
    type RoomMaps,
} from "./middleware/helper";
import verifyUser from "./middleware/verify";
import type { ClientMessage } from "./types";

// --- Limits (bound memory / DoS) ------------------------------------------
// Hard cap on a single inbound frame. Also enforced at the ws layer via
// `maxPayload` (which closes the socket); this softer check lets us reply with
// a friendly error before the backstop trips.
const MAX_MESSAGE_BYTES = 256 * 1024; // 256 KB per frame
// Absolute ceiling accepted by the ws layer; oversized frames are dropped and
// the socket is closed with code 1009 automatically.
const MAX_PAYLOAD_BYTES = 512 * 1024; // 512 KB
// Cap on persisted elements per room so a single room can't grow unbounded.
const MAX_ELEMENTS_PER_ROOM = 10000;
// Strict token bucket for state-mutating / control messages.
const GENERAL_BURST = 40;
const GENERAL_REFILL_PER_SEC = 20;
// Cheaper, higher-throughput bucket for ephemeral cursor/selection so live
// cursors stay smooth even under rapid pointer movement.
const EPHEMERAL_BURST = 120;
const EPHEMERAL_REFILL_PER_SEC = 60;
// Heartbeat sweep interval; sockets that miss a pong between sweeps are killed.
const HEARTBEAT_INTERVAL_MS = 30_000;

interface ElementLike {
    id: string;
    [key: string]: unknown;
}

const isElementLike = (value: unknown): value is ElementLike =>
    !!value &&
    typeof value === "object" &&
    typeof (value as { id?: unknown }).id === "string";

const connections = new Map<string, ConnectionType>();
const roomMaps: RoomMaps = {
    roomState: new Map<string, unknown[]>(),
    roomIds: new Map<string, number>(),
    saveTimers: new Map<string, ReturnType<typeof setTimeout>>(),
};

const { roomState, roomIds } = roomMaps;

const rawPort = process.env.WS_PORT ?? "8080";
const port = Number(rawPort);
if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`invalid WS_PORT: "${rawPort}"`);
}

const wss = new WebSocketServer({ port, maxPayload: MAX_PAYLOAD_BYTES });

// Heartbeat: every sweep, kill sockets that didn't answer the previous ping,
// then ping the rest. This reaps zombie connections (half-open TCP, sleeping
// laptops) that would otherwise keep rooms "occupied" — blocking eviction /
// snapshot flush — and leave stale presence for everyone else.
const heartbeatInterval = setInterval(() => {
    connections.forEach((conn) => {
        if (!conn.isAlive) {
            // Missed the previous pong window — terminate. The 'close' handler
            // funnels through the same leave/cleanup path as leave_room/close.
            conn.ws.terminate();
            return;
        }
        conn.isAlive = false;
        try {
            conn.ws.ping();
        } catch {
            // ignore; a dead socket will be terminated on the next sweep
        }
    });
}, HEARTBEAT_INTERVAL_MS);

wss.on("close", () => {
    clearInterval(heartbeatInterval);
});

wss.on("error", (err) => {
    console.error("[Vexio:WS] server error", err);
});

process.on("unhandledRejection", (reason) => {
    console.error("[Vexio:WS] unhandled rejection", reason);
});
process.on("uncaughtException", (err) => {
    console.error("[Vexio:WS] uncaught exception", err);
});

const normalizeSlug = (slug: string) => slug.trim().toLowerCase();

const sendPresenceRosterToJoiner = (
    ws: WebSocket,
    slug: string,
    joinerConnectionId: string,
    joinerUserId: string
) => {
    // Dedupe by userId (not per-connection) so a peer with multiple tabs is
    // reported once, and never report the joiner's own id back to them.
    const seen = new Set<string>();
    connections.forEach((other) => {
        if (other.connectionId === joinerConnectionId) return;
        if (!other.rooms.has(slug)) return;
        if (other.userId === joinerUserId) return;
        if (seen.has(other.userId)) return;
        seen.add(other.userId);
        send(ws, {
            type: "presence",
            slug,
            userId: other.userId,
            name: other.userName,
            action: "joined",
        });
    });
};

// Single funnel for removing a connection from a room, used by leave_room,
// socket close, and heartbeat terminate. Broadcasts `left` only when this was
// the user's LAST connection in the room, then evicts the room if now empty.
const leaveRoom = async (connectionId: string, slug: string) => {
    const conn = connections.get(connectionId);
    if (!conn || !conn.rooms.has(slug)) return;

    const { userId, userName } = conn;
    conn.rooms.delete(slug);

    if (userConnectionCountInRoom(connections, slug, userId) === 0) {
        broadcastToRoom(
            connections,
            slug,
            { type: "presence", slug, userId, name: userName, action: "left" },
            connectionId
        );
    }

    try {
        await evictRoomIfEmpty(slug, connections, roomMaps);
    } catch (err) {
        console.error(`failed to evict room ${slug} on leave`, err);
    }
};

const handleJoinRoom = async (
    ws: WebSocket,
    connectionId: string,
    slug: string
) => {
    const conn = connections.get(connectionId);
    if (!conn) return;

    let room;
    try {
        room = await getRoomBySlug(slug);
    } catch (err) {
        console.error(`failed to look up room ${slug}`, err);
        send(ws, { type: "error", message: "failed to join room" });
        return;
    }
    if (!room) {
        send(ws, { type: "error", message: "room not found" });
        return;
    }

    const alreadyPresent =
        userConnectionCountInRoom(connections, slug, conn.userId) > 0;

    conn.rooms.set(slug, { roomId: room.id, slug });
    roomIds.set(slug, room.id);

    if (!roomState.has(slug)) {
        try {
            const snapshot = await getRoomSnapshot(slug);
            roomState.set(slug, Array.isArray(snapshot) ? snapshot : []);
        } catch (err) {
            console.error(`failed to load snapshot for room ${slug}`, err);
            roomState.set(slug, []);
        }
    }

    send(ws, {
        type: "room_state",
        slug,
        elements: roomState.get(slug) ?? [],
    });

    sendPresenceRosterToJoiner(ws, slug, connectionId, conn.userId);

    // Only announce `joined` for the user's FIRST connection in this room, so
    // opening a second tab doesn't re-broadcast a join to existing peers.
    if (!alreadyPresent) {
        broadcastToRoom(
            connections,
            slug,
            {
                type: "presence",
                slug,
                userId: conn.userId,
                name: conn.userName,
                action: "joined",
            },
            connectionId
        );
    }
};

wss.on("connection", async (ws, request) => {
    const url = request.url;
    if (!url) {
        ws.close();
        return;
    }

    const token =
        new URL(url, "http://localhost").searchParams.get("token") ?? "";

    // Authentication requires a DB round-trip (getSession), during which the
    // real message handler below is not yet attached. Clients send join_room
    // immediately on open, so buffer any messages that arrive before auth
    // completes and replay them once the connection is registered — otherwise
    // that first join_room is silently dropped and no realtime features work.
    const earlyMessages: unknown[] = [];
    const bufferEarly = (data: unknown) => {
        earlyMessages.push(data);
    };
    ws.on("message", bufferEarly);

    const verified = await verifyUser(token);
    if (!verified) {
        send(ws, { type: "error", message: "unauthorized" });
        ws.close(4001, "unauthorized");
        return;
    }
    const { id: userId, name: userName } = verified;

    const connectionId = randomUUID();
    connections.set(connectionId, {
        connectionId,
        userId,
        userName,
        rooms: new Map(),
        ws,
        isAlive: true,
        general: newBucket(GENERAL_BURST, GENERAL_REFILL_PER_SEC),
        ephemeral: newBucket(EPHEMERAL_BURST, EPHEMERAL_REFILL_PER_SEC),
    });

    // Heartbeat liveness: any pong re-marks the socket alive.
    ws.on("pong", () => {
        const conn = connections.get(connectionId);
        if (conn) conn.isAlive = true;
    });

    ws.on("close", async () => {
        // Funnel every room this connection was in through the same ref-counted
        // leave path used by leave_room/terminate, so presence + eviction stay
        // consistent. leaveRoom reads live membership, so snapshot the slugs
        // first and remove this connection last.
        const conn = connections.get(connectionId);
        const slugs = conn ? [...conn.rooms.keys()] : [];
        for (const slug of slugs) {
            await leaveRoom(connectionId, slug);
        }
        connections.delete(connectionId);
    });

    // Real handler is ready; stop buffering and attach it.
    ws.off("message", bufferEarly);

    ws.on("message", async (data) => {
        // Size guard: reject oversized frames before parsing/buffering them.
        // (`maxPayload` on the server is the hard backstop; this is the polite
        // one that keeps the socket open with an error.)
        const byteLength = Buffer.isBuffer(data)
            ? data.byteLength
            : Buffer.byteLength(String(data));
        if (byteLength > MAX_MESSAGE_BYTES) {
            send(ws, { type: "error", message: "message too large" });
            return;
        }

        let parsed: Partial<ClientMessage> & {
            type?: string;
            slug?: string;
            element?: unknown;
            elementId?: string;
            x?: unknown;
            y?: unknown;
            elementIds?: unknown;
        };
        try {
            parsed = JSON.parse(String(data));
        } catch {
            send(ws, { type: "error", message: "invalid JSON" });
            return;
        }

        if (!parsed.type || typeof parsed.type !== "string") {
            send(ws, { type: "error", message: "message type is required" });
            return;
        }

        // Rate limiting. Ephemeral cursor/selection draw from a larger, faster
        // bucket so live presence stays smooth; when it empties we silently drop
        // (no error spam). Everything else uses the strict bucket and errors.
        const conn = connections.get(connectionId);
        const isEphemeral =
            parsed.type === "cursor" || parsed.type === "selection";
        if (conn) {
            const bucket = isEphemeral ? conn.ephemeral : conn.general;
            if (!consumeToken(bucket)) {
                if (!isEphemeral) {
                    send(ws, { type: "error", message: "rate limit exceeded" });
                }
                return;
            }
        }

        try {
            if (parsed.type === "join_room") {
                if (!parsed.slug || typeof parsed.slug !== "string") {
                    send(ws, { type: "error", message: "slug is required" });
                    return;
                }
                const slug = normalizeSlug(parsed.slug);
                if (!slug) {
                    send(ws, { type: "error", message: "slug is required" });
                    return;
                }
                await handleJoinRoom(ws, connectionId, slug);
                return;
            }

            if (parsed.type === "leave_room") {
                if (!parsed.slug || typeof parsed.slug !== "string") {
                    send(ws, { type: "error", message: "slug is required" });
                    return;
                }
                const slug = normalizeSlug(parsed.slug);
                if (!slug) {
                    send(ws, { type: "error", message: "slug is required" });
                    return;
                }

                const current = connections.get(connectionId);
                if (!current) return;

                if (!current.rooms.has(slug)) {
                    send(ws, { type: "error", message: "not in room" });
                    return;
                }

                await leaveRoom(connectionId, slug);
                return;
            }

            if (parsed.type === "element_add") {
                const conn = connections.get(connectionId);
                const slug =
                    parsed.slug && typeof parsed.slug === "string"
                        ? normalizeSlug(parsed.slug)
                        : "";

                if (!slug || !conn?.rooms.has(slug)) {
                    send(ws, { type: "error", message: "join room first" });
                    return;
                }

                const element = parsed.element;
                if (!isElementLike(element)) {
                    send(ws, { type: "error", message: "invalid element" });
                    return;
                }

                const elements = roomState.get(slug) ?? [];
                if (!roomState.has(slug)) roomState.set(slug, elements);

                const duplicate = elements.some(
                    (el) => isElementLike(el) && el.id === element.id
                );
                if (duplicate) {
                    send(ws, {
                        type: "error",
                        message: `element with id ${element.id} already exists`,
                    });
                    return;
                }

                // Bound room memory: refuse new elements past the cap.
                if (elements.length >= MAX_ELEMENTS_PER_ROOM) {
                    send(ws, {
                        type: "error",
                        message: "room element limit reached",
                    });
                    return;
                }

                elements.push(element);

                broadcastToRoom(
                    connections,
                    slug,
                    {
                        type: "element_add",
                        slug,
                        element,
                        userId: conn.userId,
                    },
                    connectionId
                );

                scheduleSave(slug, roomMaps);
                return;
            }

            if (parsed.type === "element_update") {
                const conn = connections.get(connectionId);
                const slug =
                    parsed.slug && typeof parsed.slug === "string"
                        ? normalizeSlug(parsed.slug)
                        : "";

                if (!slug || !conn?.rooms.has(slug)) {
                    send(ws, { type: "error", message: "join room first" });
                    return;
                }

                const element = parsed.element;
                if (!isElementLike(element)) {
                    send(ws, { type: "error", message: "invalid element" });
                    return;
                }

                const elements = roomState.get(slug) ?? [];
                if (!roomState.has(slug)) roomState.set(slug, elements);

                const index = elements.findIndex(
                    (el) => isElementLike(el) && el.id === element.id
                );
                if (index === -1) return;

                elements[index] = element;

                broadcastToRoom(
                    connections,
                    slug,
                    {
                        type: "element_update",
                        slug,
                        element,
                        userId: conn.userId,
                    },
                    connectionId
                );

                scheduleSave(slug, roomMaps);
                return;
            }

            if (parsed.type === "element_delete") {
                const conn = connections.get(connectionId);
                const slug =
                    parsed.slug && typeof parsed.slug === "string"
                        ? normalizeSlug(parsed.slug)
                        : "";

                if (!slug || !conn?.rooms.has(slug)) {
                    send(ws, { type: "error", message: "join room first" });
                    return;
                }

                const elementId = parsed.elementId;
                if (!elementId || typeof elementId !== "string") {
                    send(ws, { type: "error", message: "invalid elementId" });
                    return;
                }

                const elements = roomState.get(slug) ?? [];
                const filtered = elements.filter(
                    (el) => !(isElementLike(el) && el.id === elementId)
                );
                roomState.set(slug, filtered);

                broadcastToRoom(
                    connections,
                    slug,
                    {
                        type: "element_delete",
                        slug,
                        elementId,
                        userId: conn.userId,
                    },
                    connectionId
                );

                scheduleSave(slug, roomMaps);
                return;
            }

            // --- Ephemeral relay: cursor / selection ----------------------
            // Validate membership, fan out to peers (excluding sender), and
            // NEVER persist or scheduleSave. Validation failures are dropped
            // silently to avoid error spam on a hot path.
            if (parsed.type === "cursor") {
                const current = connections.get(connectionId);
                const slug =
                    parsed.slug && typeof parsed.slug === "string"
                        ? normalizeSlug(parsed.slug)
                        : "";
                if (!slug || !current?.rooms.has(slug)) return;
                if (
                    typeof parsed.x !== "number" ||
                    typeof parsed.y !== "number" ||
                    !Number.isFinite(parsed.x) ||
                    !Number.isFinite(parsed.y)
                ) {
                    return;
                }
                broadcastToRoom(
                    connections,
                    slug,
                    {
                        type: "cursor",
                        slug,
                        userId: current.userId,
                        name: current.userName,
                        x: parsed.x,
                        y: parsed.y,
                    },
                    connectionId
                );
                return;
            }

            if (parsed.type === "selection") {
                const current = connections.get(connectionId);
                const slug =
                    parsed.slug && typeof parsed.slug === "string"
                        ? normalizeSlug(parsed.slug)
                        : "";
                if (!slug || !current?.rooms.has(slug)) return;
                const elementIds = parsed.elementIds;
                if (
                    !Array.isArray(elementIds) ||
                    !elementIds.every((id) => typeof id === "string")
                ) {
                    return;
                }
                broadcastToRoom(
                    connections,
                    slug,
                    {
                        type: "selection",
                        slug,
                        userId: current.userId,
                        name: current.userName,
                        elementIds: elementIds as string[],
                    },
                    connectionId
                );
                return;
            }

            send(ws, { type: "error", message: "unknown message type" });
        } catch (err) {
            console.error(
                `unexpected error handling "${parsed.type}" message`,
                err
            );
            send(ws, { type: "error", message: "internal server error" });
        }
    });

    // Replay anything the client sent before auth finished (e.g. join_room).
    for (const buffered of earlyMessages) {
        ws.emit("message", buffered);
    }
    earlyMessages.length = 0;
});

console.log(`ws-server listening on :${port}`);

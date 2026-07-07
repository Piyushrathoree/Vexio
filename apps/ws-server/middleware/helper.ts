import { saveRoomSnapshot } from "@repo/db";
import type { WebSocket } from "ws";
import type { RoomSession, ServerMessage } from "../types";

export interface ConnectionType {
    connectionId: string;
    userId: string;
    // Display name resolved from the session at auth time; relayed on presence /
    // cursor / selection so peers can label live cursors by name, not by id.
    userName: string;
    ws: WebSocket;
    rooms: Map<string, RoomSession>;
    // Heartbeat: flipped true on every `pong`, false before each ping sweep.
    isAlive: boolean;
    // Rate limiting: strict bucket for state-mutating messages, a cheaper/faster
    // bucket for ephemeral cursor/selection so live presence stays smooth.
    general: TokenBucket;
    ephemeral: TokenBucket;
}

// --- Rate limiting (token bucket) -----------------------------------------
export interface TokenBucket {
    tokens: number;
    last: number;
    capacity: number;
    refillPerSec: number;
}

export const newBucket = (
    capacity: number,
    refillPerSec: number
): TokenBucket => ({
    tokens: capacity,
    last: Date.now(),
    capacity,
    refillPerSec,
});

// Refill lazily based on elapsed time and try to spend one token.
// Returns false when the bucket is empty (i.e. the caller is flooding).
export const consumeToken = (bucket: TokenBucket, now = Date.now()): boolean => {
    const elapsedSec = (now - bucket.last) / 1000;
    bucket.tokens = Math.min(
        bucket.capacity,
        bucket.tokens + elapsedSec * bucket.refillPerSec
    );
    bucket.last = now;
    if (bucket.tokens >= 1) {
        bucket.tokens -= 1;
        return true;
    }
    return false;
};

export type RoomMaps = {
    roomState: Map<string, unknown[]>;
    roomIds: Map<string, number>;
    saveTimers: Map<string, ReturnType<typeof setTimeout>>;
};

export const send = (ws: WebSocket, message: ServerMessage) => {
    if (ws.readyState !== 1) return;
    ws.send(JSON.stringify(message));
};

export const broadcastToRoom = (
    connections: Map<string, ConnectionType>,
    slug: string,
    message: ServerMessage,
    excludeConnectionId?: string
) => {
    connections.forEach((conn) => {
        if (!conn.rooms.has(slug) || conn.ws.readyState !== 1) {
            return;
        }
        if (
            excludeConnectionId &&
            conn.connectionId === excludeConnectionId
        ) {
            return;
        }
        send(conn.ws, message);
    });
};

// Count how many *live* connections a given user currently has in a room.
// Presence is ref-counted on this so a second browser tab closing does not
// wrongly broadcast `left` while another tab of the same user is still joined.
export const userConnectionCountInRoom = (
    connections: Map<string, ConnectionType>,
    slug: string,
    userId: string
): number => {
    let count = 0;
    connections.forEach((conn) => {
        if (conn.userId === userId && conn.rooms.has(slug)) count += 1;
    });
    return count;
};

export const evictRoomIfEmpty = async (
    slug: string,
    connections: Map<string, ConnectionType>,
    maps: RoomMaps
) => {
    const stillOccupied = [...connections.values()].some((c) =>
        c.rooms.has(slug)
    );
    if (stillOccupied) return;

    const existingTimer = maps.saveTimers.get(slug);
    if (existingTimer) {
        clearTimeout(existingTimer);
        maps.saveTimers.delete(slug);
    }

    const roomId = maps.roomIds.get(slug);
    const finalElements = maps.roomState.get(slug) ?? [];
    maps.roomState.delete(slug);
    maps.roomIds.delete(slug);

    if (roomId === undefined) return;
    try {
        await saveRoomSnapshot(roomId, finalElements);
    } catch (err) {
        console.error(`failed to flush snapshot for room ${slug}`, err);
    }
};

export const scheduleSave = (slug: string, maps: RoomMaps) => {
    const existing = maps.saveTimers.get(slug);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
        maps.saveTimers.delete(slug);
        const roomId = maps.roomIds.get(slug);
        if (roomId === undefined) return;
        try {
            await saveRoomSnapshot(roomId, maps.roomState.get(slug) ?? []);
        } catch (err) {
            console.error(`failed to save snapshot for room ${slug}`, err);
        }
    }, 1500);

    maps.saveTimers.set(slug, timer);
};

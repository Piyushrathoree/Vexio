import "@repo/common";
import { getRoomBySlug, getRoomSnapshot } from "@repo/db";
import { randomUUID } from "crypto";
import { WebSocketServer, type WebSocket } from "ws";
import verifyUser from "./middleware/verify";
import type { RoomSession, ServerMessage } from "./types";

interface ConnectionType {
    connectionId: string;
    userId: string;
    ws: WebSocket;
    rooms: Map<string, RoomSession>;
}

const connections = new Map<string, ConnectionType>();
const roomState = new Map<string, unknown[]>();

const port = Number(process.env.WS_PORT ?? 8080);
const wss = new WebSocketServer({ port });

const send = (ws: WebSocket, message: ServerMessage) => {
    if (ws.readyState !== 1) return;
    ws.send(JSON.stringify(message));
};

const broadcastToRoom = (
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

wss.on("connection", async (ws, request) => {
    const url = request.url;
    if (!url) {
        ws.close();
        return;
    }

    const token =
        new URL(url, "http://localhost").searchParams.get("token") ?? "";
    const userId = await verifyUser(token);
    if (!userId) {
        ws.close();
        return;
    }

    const connectionId = randomUUID();
    connections.set(connectionId, {
        connectionId,
        userId,
        rooms: new Map(),
        ws,
    });

    ws.on("close", () => {
        const conn = connections.get(connectionId);
        if (conn) {
            conn.rooms.forEach((_, slug) => {
                broadcastToRoom(slug, {
                    type: "presence",
                    slug,
                    userId: conn.userId,
                    action: "left",
                });
            });
        }
        connections.delete(connectionId);
    });

    ws.on("message", async (data) => {
        let parsed: { type?: string; slug?: string };
        try {
            parsed = JSON.parse(String(data));
        } catch {
            send(ws, { type: "error", message: "invalid JSON" });
            return;
        }

        if (parsed.type === "join_room") {
            const slug = parsed.slug;
            if (!slug || typeof slug !== "string") {
                send(ws, { type: "error", message: "slug is required" });
                return;
            }

            const conn = connections.get(connectionId);
            if (!conn) return;

            const room = await getRoomBySlug(slug);
            if (!room) {
                send(ws, { type: "error", message: "room not found" });
                return;
            }

            conn.rooms.set(slug, { roomId: room.id, slug });

            if (!roomState.has(slug)) {
                const snapshot = await getRoomSnapshot(slug);
                roomState.set(slug, Array.isArray(snapshot) ? snapshot : []);
            }

            send(ws, {
                type: "room_state",
                slug,
                elements: roomState.get(slug) ?? [],
            });

            broadcastToRoom(slug, {
                type: "presence",
                slug,
                userId: conn.userId,
                action: "joined",
            });
        }

        if (parsed.type === "leave_room") {
            const slug = parsed.slug;
            if (!slug || typeof slug !== "string") {
                send(ws, { type: "error", message: "slug is required" });
                return;
            }

            const conn = connections.get(connectionId);
            if (!conn) return;

            if (!conn.rooms.has(slug)) {
                send(ws, { type: "error", message: "not in room" });
                return;
            }

            broadcastToRoom(slug, {
                type: "presence",
                slug,
                userId: conn.userId,
                action: "left",
            });

            conn.rooms.delete(slug);
        }
    });
});

console.log(`ws-server listening on :${port}`);

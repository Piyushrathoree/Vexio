import { randomUUID } from "crypto";
import type { WebSocket } from "ws";
import type { RoomSession } from "../types";

export interface Connection {
    connectionId: string;
    userId: string;
    ws: WebSocket;
    rooms: Map<string, RoomSession>;
}

const addConnection = (
    userId: string,
    ws: WebSocket,
    connections: Map<string, Connection>
): string => {
    const connectionId = randomUUID();
    connections.set(connectionId, {
        connectionId,
        userId,
        ws,
        rooms: new Map(),
    });
    return connectionId;
};

const joinRoomSession = (connection: Connection, session: RoomSession) => {
    connection.rooms.set(session.slug, session);
};

const leaveRoomSession = (
    connectionId: string,
    slug: string,
    connections: Map<string, Connection>
) => {
    const connection = connections.get(connectionId);
    if (!connection) return;
    connection.rooms.delete(slug);
};

const broadcastToRoom = (
    slug: string,
    message: string,
    connections: Map<string, Connection>,
    excludeConnectionId?: string
) => {
    connections.forEach((connection) => {
        if (!connection.rooms.has(slug) || connection.ws.readyState !== 1) {
            return;
        }
        if (
            excludeConnectionId &&
            connection.connectionId === excludeConnectionId
        ) {
            return;
        }
        try {
            connection.ws.send(message);
        } catch (err) {
            console.error(
                `Failed to send to connection ${connection.connectionId}:`,
                err
            );
        }
    });
};

const sendToConnection = (
    connectionId: string,
    message: string,
    connections: Map<string, Connection>
) => {
    const connection = connections.get(connectionId);
    if (!connection || connection.ws.readyState !== 1) return;
    connection.ws.send(message);
};

const removeConnection = (
    connectionId: string,
    connections: Map<string, Connection>
) => {
    connections.delete(connectionId);
};

const getConnectionsInRoom = (
    slug: string,
    connections: Map<string, Connection>
) => {
    return [...connections.values()].filter((connection) =>
        connection.rooms.has(slug)
    );
};

export {
    addConnection,
    joinRoomSession,
    leaveRoomSession,
    broadcastToRoom,
    sendToConnection,
    removeConnection,
    getConnectionsInRoom,
};

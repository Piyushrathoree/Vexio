"use client";

import { getBearerToken } from "./auth-client";

// Mirrors apps/ws-server/types.ts exactly. Keep the two unions identical to the
// server contract — cursor/selection are EPHEMERAL (never persisted) presence
// messages layered on top of the durable element ops.
export type ClientMessage =
    | { type: "join_room"; slug: string }
    | { type: "leave_room"; slug: string }
    | { type: "element_add"; slug: string; element: unknown }
    | { type: "element_update"; slug: string; element: unknown }
    | { type: "element_delete"; slug: string; elementId: string }
    | { type: "cursor"; slug: string; x: number; y: number }
    | { type: "selection"; slug: string; elementIds: string[] };

export type ServerMessage =
    | { type: "room_state"; slug: string; elements: unknown[] }
    | { type: "element_add"; slug: string; element: unknown; userId: string }
    | { type: "element_update"; slug: string; element: unknown; userId: string }
    | {
          type: "element_delete";
          slug: string;
          elementId: string;
          userId: string;
      }
    | {
          type: "presence";
          slug: string;
          userId: string;
          name: string;
          action: "joined" | "left";
      }
    | {
          type: "cursor";
          slug: string;
          userId: string;
          name: string;
          x: number;
          y: number;
      }
    | {
          type: "selection";
          slug: string;
          userId: string;
          name: string;
          elementIds: string[];
      }
    | { type: "error"; message: string };

// Close code the server uses to reject a bad/expired token. The client must NOT
// reconnect on this code — retrying only burns attempts against a dead session.
export const WS_CLOSE_UNAUTHORIZED = 4001;

export const normalizeSlug = (slug: string) => slug.trim().toLowerCase();

const wsBaseUrl = () =>
    process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";

export const buildWhiteboardSocketUrl = () => {
    const token = getBearerToken() ?? "";
    return `${wsBaseUrl()}?token=${encodeURIComponent(token)}`;
};

export const safeSend = (
    socket: WebSocket | null | undefined,
    message: ClientMessage
) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    try {
        socket.send(JSON.stringify(message));
    } catch {
        // ignore send failures (socket may be closing)
    }
};

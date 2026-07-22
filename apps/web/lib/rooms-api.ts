// Typed client helpers for the room-management + sharing HTTP API.
//
// Every handler on the backend (apps/http-server/controllers/index.ts)
// wraps successful responses as `{ statusCode, data, message, success }`
// (see @repo/common ApiResponse) and error responses as
// `{ success: false, message }` (see the global error handler in
// apps/http-server/index.ts). `request()` below normalizes both shapes
// into a small discriminated union so callers never touch raw `Response`
// objects.

import { apiFetch } from "./api";

export type MemberRole = "ADMIN" | "EDITOR" | "VIEWER";
export type InviteRole = "EDITOR" | "VIEWER";

export type Room = {
    id: number;
    slug: string;
    createdAt: string;
    adminId: string;
};

// A capped, geometry-only rendition of the board's snapshot, built server-side
// (packages/db/src/services/room.ts) so the dashboard can draw real thumbnails
// without shipping whole snapshots — a board may hold up to 10,000 elements.
export type PreviewElement = {
    type: string;
    color: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    points?: { x: number; y: number }[];
};

export type RoomPreview = {
    bbox: { x1: number; y1: number; x2: number; y2: number };
    elements: PreviewElement[];
};

// What GET /api/v1/rooms returns: the room plus the caller's own role and the
// counts/preview the board cards render.
export type RoomSummary = Room & {
    role: MemberRole;
    memberCount: number;
    elementCount: number;
    preview: RoomPreview | null;
};

export type RoomMember = {
    id: number;
    roomId: number;
    userId: string;
    role: MemberRole;
    createdAt: string;
};

export type RoomInvite = {
    id: number;
    roomId: number;
    token: string;
    role: InviteRole;
    createdBy: string;
    expiresAt: string | null;
    createdAt: string;
};

export type ApiResult<T> =
    | { ok: true; data: T }
    | { ok: false; status: number; message: string };

async function request<T>(
    path: string,
    init?: RequestInit
): Promise<ApiResult<T>> {
    let res: Response;
    try {
        res = await apiFetch(path, init);
    } catch {
        return { ok: false, status: 0, message: "Network error — check your connection." };
    }

    let json: { data?: T; message?: string; error?: string } | null = null;
    try {
        json = await res.json();
    } catch {
        json = null;
    }

    if (!res.ok) {
        const message =
            json?.message ??
            json?.error ??
            `Request failed — ${res.status}.`;
        return { ok: false, status: res.status, message };
    }

    return { ok: true, data: (json?.data ?? ({} as T)) as T };
}

export const fetchRooms = () =>
    request<{ rooms: RoomSummary[] }>("/api/v1/rooms");

export const createRoom = (slug: string) =>
    request<{ room: Room }>("/api/v1/room", {
        method: "POST",
        body: JSON.stringify({ slug }),
    });

export const fetchRoom = (slug: string) =>
    request<{ room: Room; role: MemberRole }>(
        `/api/v1/room/${encodeURIComponent(slug)}`
    );

// Open-by-link. Idempotent: enrols the caller as an EDITOR the first time and
// returns their existing role thereafter (never downgrades an ADMIN/VIEWER).
// Returns 404 when the slug doesn't exist.
export const joinRoom = (slug: string) =>
    request<{ room: Room; member: RoomMember; role: MemberRole }>(
        `/api/v1/room/${encodeURIComponent(slug)}/join`,
        { method: "POST" }
    );

export const renameRoom = (slug: string, newSlug: string) =>
    request<{ room: Room }>(`/api/v1/room/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        body: JSON.stringify({ slug: newSlug }),
    });

export const deleteRoom = (slug: string) =>
    request<Record<string, never>>(
        `/api/v1/room/${encodeURIComponent(slug)}`,
        { method: "DELETE" }
    );

export const leaveRoom = (slug: string) =>
    request<Record<string, never>>(
        `/api/v1/room/${encodeURIComponent(slug)}/leave`,
        { method: "POST" }
    );

export const fetchRoomMembers = (slug: string) =>
    request<{ members: RoomMember[] }>(
        `/api/v1/room/${encodeURIComponent(slug)}/members`
    );

export const createRoomInvite = (
    slug: string,
    opts: { role?: InviteRole; expiresInHours?: number } = {}
) =>
    request<{ invite: RoomInvite; inviteUrl: string }>(
        `/api/v1/room/${encodeURIComponent(slug)}/invite`,
        {
            method: "POST",
            body: JSON.stringify(opts),
        }
    );

export const acceptInvite = (token: string) =>
    request<{ slug: string; member: RoomMember }>(
        `/api/v1/invite/${encodeURIComponent(token)}/accept`,
        { method: "POST" }
    );

export const updateMemberRole = (
    slug: string,
    userId: string,
    role: MemberRole
) =>
    request<{ member: RoomMember }>(
        `/api/v1/room/${encodeURIComponent(slug)}/members/${encodeURIComponent(userId)}`,
        {
            method: "PATCH",
            body: JSON.stringify({ role }),
        }
    );

export const removeRoomMember = (slug: string, userId: string) =>
    request<Record<string, never>>(
        `/api/v1/room/${encodeURIComponent(slug)}/members/${encodeURIComponent(userId)}`,
        { method: "DELETE" }
    );

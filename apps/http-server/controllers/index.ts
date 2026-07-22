import type { Request, Response } from "express";
import {
    createRoom,
    getRoomById,
    getRoomBySlug,
    getRoomsForUser,
    getMember,
    ensureMember,
    getRoomMembers,
    removeMember,
    updateMemberRole,
    createInvite,
    consumeInvite,
    updateRoomSlug,
    deleteRoom as deleteRoomById,
} from "@repo/db";
import { ApiError, ApiResponse } from "@repo/common";
import { auth } from "@repo/auth";
import { fromNodeHeaders } from "better-auth/node";

type MemberRole = "ADMIN" | "EDITOR" | "VIEWER";
const VALID_ROLES: ReadonlySet<string> = new Set(["ADMIN", "EDITOR", "VIEWER"]);
const VALID_INVITE_ROLES: ReadonlySet<string> = new Set(["EDITOR", "VIEWER"]);

const normalizeSlug = (raw: unknown): string => {
    if (!raw || typeof raw !== "string") {
        throw new ApiError(400, "you must have a Slug");
    }

    const slug = raw.trim().toLowerCase();
    if (slug.length < 3 || slug.length > 64) {
        throw new ApiError(400, "slug must be between 3 and 64 characters");
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
        throw new ApiError(
            400,
            "slug must use lowercase letters, numbers, and hyphens only"
        );
    }
    return slug;
};

const requireSlugParam = (raw: unknown): string => {
    if (!raw || typeof raw !== "string") {
        throw new ApiError(400, "slug is required");
    }
    const slug = raw.trim().toLowerCase();
    if (!slug) {
        throw new ApiError(400, "slug is required");
    }
    return slug;
};

const requireUserId = (req: Request): string => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new ApiError(401, "unauthorized");
    }
    return userId;
};

const requireRoomMember = async (roomId: number, userId: string) => {
    const member = await getMember(roomId, userId);
    if (!member) {
        throw new ApiError(403, "you are not a member of this room");
    }
    return member;
};

const requireRoomAdmin = async (roomId: number, userId: string) => {
    const member = await requireRoomMember(roomId, userId);
    if (member.role !== "ADMIN") {
        throw new ApiError(403, "only room admins can perform this action");
    }
    return member;
};

const countAdmins = async (roomId: number) => {
    const members = await getRoomMembers(roomId);
    return members.filter((m) => m.role === "ADMIN").length;
};

const CreateRoom = async (req: Request, res: Response) => {
    const userId = requireUserId(req);

    const { slug } = req.body ?? {};
    const normalizedSlug = normalizeSlug(slug);

    try {
        const room = await createRoom(normalizedSlug, userId);
        res.status(201).json(
            new ApiResponse(201, { room }, "new room created successfully")
        );
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Room not created";
        if (message.includes("Unique constraint")) {
            throw new ApiError(409, "room slug already exists");
        }
        // Anything else is an infrastructure failure, not the caller's fault.
        // Flattening it to a 400 previously disguised a missing table as a
        // validation error; let the central handler surface it as a 500.
        throw error;
    }
};

const getMyRooms = async (req: Request, res: Response) => {
    const userId = requireUserId(req);

    const rooms = await getRoomsForUser(userId);
    res.status(200).json(
        new ApiResponse(200, { rooms }, "rooms fetched successfully")
    );
};

const getRoom = async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const slug = requireSlugParam(req.params.slug);

    const room = await getRoomBySlug(slug);
    if (!room) {
        throw new ApiError(404, "room not found");
    }

    // ACL: only members (or the admin) of the room may open it via its slug.
    const member = await requireRoomMember(room.id, userId);

    res.status(200).json(
        new ApiResponse(
            200,
            { room, role: member.role },
            "room fetched successfully"
        )
    );
};

// The ws-server authenticates from a bearer token in the query string, but
// better-auth only emits `set-auth-token` on sign-in — never on sign-up, and
// never on get-session. That left anyone who had just signed up, or whose
// stored token aged out, unable to open a socket at all: REST kept working off
// the session cookie while the board sat permanently on "offline".
//
// This hands the current session's token to an already-authenticated caller
// (cookie or bearer), so the client can always obtain a working one.
const getWsToken = async (req: Request, res: Response) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });

    const token = session?.session?.token;
    if (!token) {
        throw new ApiError(401, "unauthorized");
    }

    res.status(200).json(new ApiResponse(200, { token }, "token issued"));
};

// Open-by-link: any signed-in user who opens a board's slug is enrolled as an
// EDITOR. Idempotent, and `ensureMember` never downgrades an existing role, so
// this is safe to call on every board open.
const joinRoom = async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const slug = requireSlugParam(req.params.slug);

    const room = await getRoomBySlug(slug);
    if (!room) {
        throw new ApiError(404, "room not found");
    }

    const member = await ensureMember(room.id, userId, "EDITOR");

    res.status(200).json(
        new ApiResponse(
            200,
            { room, member, role: member.role },
            "joined room successfully"
        )
    );
};

const updateRoom = async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const slug = requireSlugParam(req.params.slug);

    const room = await getRoomBySlug(slug);
    if (!room) {
        throw new ApiError(404, "room not found");
    }

    await requireRoomAdmin(room.id, userId);

    const { slug: newSlugRaw } = req.body ?? {};
    const newSlug = normalizeSlug(newSlugRaw);

    if (newSlug === room.slug) {
        throw new ApiError(400, "new slug must be different from the current slug");
    }

    const existing = await getRoomBySlug(newSlug);
    if (existing) {
        throw new ApiError(409, "room slug already exists");
    }

    const updatedRoom = await updateRoomSlug(room.id, newSlug);
    res.status(200).json(
        new ApiResponse(200, { room: updatedRoom }, "room renamed successfully")
    );
};

const deleteRoom = async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const slug = requireSlugParam(req.params.slug);

    const room = await getRoomBySlug(slug);
    if (!room) {
        throw new ApiError(404, "room not found");
    }

    await requireRoomAdmin(room.id, userId);

    await deleteRoomById(room.id);
    res.status(200).json(new ApiResponse(200, {}, "room deleted successfully"));
};

const leaveRoom = async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const slug = requireSlugParam(req.params.slug);

    const room = await getRoomBySlug(slug);
    if (!room) {
        throw new ApiError(404, "room not found");
    }

    const member = await requireRoomMember(room.id, userId);

    if (member.role === "ADMIN") {
        const adminCount = await countAdmins(room.id);
        if (adminCount <= 1) {
            throw new ApiError(
                400,
                "you are the only admin of this room - transfer the admin role or delete the room instead of leaving"
            );
        }
    }

    await removeMember(room.id, userId);
    res.status(200).json(new ApiResponse(200, {}, "left room successfully"));
};

const listRoomMembers = async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const slug = requireSlugParam(req.params.slug);

    const room = await getRoomBySlug(slug);
    if (!room) {
        throw new ApiError(404, "room not found");
    }

    await requireRoomMember(room.id, userId);

    const members = await getRoomMembers(room.id);
    res.status(200).json(
        new ApiResponse(200, { members }, "room members fetched successfully")
    );
};

const createRoomInvite = async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const slug = requireSlugParam(req.params.slug);

    const room = await getRoomBySlug(slug);
    if (!room) {
        throw new ApiError(404, "room not found");
    }

    await requireRoomAdmin(room.id, userId);

    const { role, expiresInHours } = req.body ?? {};

    let inviteRole: MemberRole = "EDITOR";
    if (role !== undefined) {
        if (typeof role !== "string" || !VALID_INVITE_ROLES.has(role)) {
            throw new ApiError(400, "role must be one of EDITOR, VIEWER");
        }
        inviteRole = role as MemberRole;
    }

    let expiresAt: Date | undefined;
    if (expiresInHours !== undefined) {
        const hours = Number(expiresInHours);
        if (!Number.isFinite(hours) || hours <= 0) {
            throw new ApiError(400, "expiresInHours must be a positive number");
        }
        expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    }

    const invite = await createInvite(room.id, userId, inviteRole, expiresAt);

    const webUrl = process.env.WEB_URL ?? "http://localhost:3001";
    const inviteUrl = `${webUrl.replace(/\/$/, "")}/invite/${invite.token}`;

    res.status(201).json(
        new ApiResponse(201, { invite, inviteUrl }, "invite created successfully")
    );
};

const acceptRoomInvite = async (req: Request, res: Response) => {
    const userId = requireUserId(req);

    const rawToken = req.params.token;
    if (!rawToken || typeof rawToken !== "string") {
        throw new ApiError(400, "invite token is required");
    }

    // consumeInvite throws ApiError(404) for an unknown token and
    // ApiError(400) for an expired one.
    const member = await consumeInvite(rawToken, userId);

    const room = await getRoomById(member.roomId);
    if (!room) {
        throw new ApiError(404, "room not found");
    }

    res.status(200).json(
        new ApiResponse(
            200,
            { slug: room.slug, member },
            "invite accepted successfully"
        )
    );
};

const updateRoomMemberRole = async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const slug = requireSlugParam(req.params.slug);

    const targetUserId = req.params.userId;
    if (!targetUserId || typeof targetUserId !== "string") {
        throw new ApiError(400, "target userId is required");
    }

    const room = await getRoomBySlug(slug);
    if (!room) {
        throw new ApiError(404, "room not found");
    }

    await requireRoomAdmin(room.id, userId);

    const { role } = req.body ?? {};
    if (!role || typeof role !== "string" || !VALID_ROLES.has(role)) {
        throw new ApiError(400, "role must be one of ADMIN, EDITOR, VIEWER");
    }

    const targetMember = await getMember(room.id, targetUserId);
    if (!targetMember) {
        throw new ApiError(404, "member not found");
    }

    if (targetMember.role === "ADMIN" && role !== "ADMIN") {
        const adminCount = await countAdmins(room.id);
        if (adminCount <= 1) {
            throw new ApiError(400, "cannot demote the only admin of the room");
        }
    }

    const updated = await updateMemberRole(
        room.id,
        targetUserId,
        role as MemberRole
    );
    res.status(200).json(
        new ApiResponse(200, { member: updated }, "member role updated successfully")
    );
};

const removeRoomMember = async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const slug = requireSlugParam(req.params.slug);

    const targetUserId = req.params.userId;
    if (!targetUserId || typeof targetUserId !== "string") {
        throw new ApiError(400, "target userId is required");
    }

    const room = await getRoomBySlug(slug);
    if (!room) {
        throw new ApiError(404, "room not found");
    }

    await requireRoomAdmin(room.id, userId);

    const targetMember = await getMember(room.id, targetUserId);
    if (!targetMember) {
        throw new ApiError(404, "member not found");
    }

    if (targetMember.role === "ADMIN") {
        const adminCount = await countAdmins(room.id);
        if (adminCount <= 1) {
            throw new ApiError(
                400,
                "cannot remove the only admin of the room - transfer the admin role first"
            );
        }
    }

    await removeMember(room.id, targetUserId);
    res.status(200).json(new ApiResponse(200, {}, "member removed successfully"));
};

export {
    CreateRoom,
    getMyRooms,
    getRoom,
    getWsToken,
    joinRoom,
    updateRoom,
    deleteRoom,
    leaveRoom,
    listRoomMembers,
    createRoomInvite,
    acceptRoomInvite,
    updateRoomMemberRole,
    removeRoomMember,
};

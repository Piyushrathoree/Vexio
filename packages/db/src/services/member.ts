import { randomUUID } from "crypto";
import { client } from "../index.ts";
import { ApiError } from "@repo/common";
import type { RoomRole } from "../generated/prisma/client.js";

const addMember = async (roomId: number, userId: string, role: RoomRole = "EDITOR") => {
    try {
        return await client.roomMember.create({
            data: { roomId, userId, role },
        });
    } catch (error) {
        throw new ApiError(
            400,
            error instanceof Error ? error.message : "Unknown error"
        );
    }
};

// Idempotent "open by link" enrolment. `update: {}` is deliberate — revisiting a
// board must never downgrade an existing ADMIN/VIEWER to the default EDITOR.
const ensureMember = async (
    roomId: number,
    userId: string,
    role: RoomRole = "EDITOR"
) => {
    try {
        return await client.roomMember.upsert({
            where: { roomId_userId: { roomId, userId } },
            update: {},
            create: { roomId, userId, role },
        });
    } catch (error) {
        throw new ApiError(
            400,
            error instanceof Error ? error.message : "Unknown error"
        );
    }
};

const removeMember = async (roomId: number, userId: string) => {
    try {
        return await client.roomMember.delete({
            where: { roomId_userId: { roomId, userId } },
        });
    } catch (error) {
        throw new ApiError(
            400,
            error instanceof Error ? error.message : "Unknown error"
        );
    }
};

const getMember = async (roomId: number, userId: string) => {
    try {
        return await client.roomMember.findUnique({
            where: { roomId_userId: { roomId, userId } },
        });
    } catch (error) {
        throw new ApiError(
            400,
            error instanceof Error ? error.message : "Unknown error"
        );
    }
};

const getRoomMembers = async (roomId: number) => {
    try {
        return await client.roomMember.findMany({ where: { roomId } });
    } catch (error) {
        throw new ApiError(
            400,
            error instanceof Error ? error.message : "Unknown error"
        );
    }
};

const getMemberedRooms = async (userId: string) => {
    try {
        return await client.roomMember.findMany({
            where: { userId },
            include: { room: true },
        });
    } catch (error) {
        throw new ApiError(
            400,
            error instanceof Error ? error.message : "Unknown error"
        );
    }
};

const updateMemberRole = async (
    roomId: number,
    userId: string,
    role: RoomRole
) => {
    try {
        return await client.roomMember.update({
            where: { roomId_userId: { roomId, userId } },
            data: { role },
        });
    } catch (error) {
        throw new ApiError(
            400,
            error instanceof Error ? error.message : "Unknown error"
        );
    }
};

const createInvite = async (
    roomId: number,
    createdBy: string,
    role: RoomRole = "EDITOR",
    expiresAt?: Date
) => {
    try {
        const token = randomUUID();
        return await client.roomInvite.create({
            data: { roomId, createdBy, role, token, expiresAt },
        });
    } catch (error) {
        throw new ApiError(
            400,
            error instanceof Error ? error.message : "Unknown error"
        );
    }
};

const getInviteByToken = async (token: string) => {
    try {
        return await client.roomInvite.findUnique({ where: { token } });
    } catch (error) {
        throw new ApiError(
            400,
            error instanceof Error ? error.message : "Unknown error"
        );
    }
};

const consumeInvite = async (token: string, userId: string) => {
    try {
        const invite = await client.roomInvite.findUnique({ where: { token } });
        if (!invite) {
            throw new ApiError(404, "Invite not found");
        }
        if (invite.expiresAt && invite.expiresAt < new Date()) {
            throw new ApiError(400, "Invite has expired");
        }
        return await client.roomMember.upsert({
            where: {
                roomId_userId: { roomId: invite.roomId, userId },
            },
            update: { role: invite.role },
            create: { roomId: invite.roomId, userId, role: invite.role },
        });
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            400,
            error instanceof Error ? error.message : "Unknown error"
        );
    }
};

const deleteInvite = async (id: number) => {
    try {
        return await client.roomInvite.delete({ where: { id } });
    } catch (error) {
        throw new ApiError(
            400,
            error instanceof Error ? error.message : "Unknown error"
        );
    }
};

export {
    addMember,
    ensureMember,
    removeMember,
    getMember,
    getRoomMembers,
    getMemberedRooms,
    updateMemberRole,
    createInvite,
    getInviteByToken,
    consumeInvite,
    deleteInvite,
};

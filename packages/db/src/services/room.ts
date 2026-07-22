import { client } from "../index.ts";
import { ApiError } from "@repo/common";
import { Prisma } from "../generated/prisma/client.js";

const createRoom = async (slug: string, adminId: string) => {
    return client.$transaction(async (tx) => {
        const room = await tx.room.create({
            data: { slug, adminId },
        });
        await tx.roomMember.create({
            data: { roomId: room.id, userId: adminId, role: "ADMIN" },
        });
        return room;
    });
};

const getRoomById = async (id: number) => {
    return client.room.findUnique({ where: { id } });
};

const getRoomBySlug = async (slug: string) => {
    return client.room.findUnique({ where: { slug } });
};

const getRoomsByAdminId = async (adminId: string) => {
    return client.room.findMany({ where: { adminId } });
};

// Dashboard thumbnails. A room may hold up to 10,000 elements, so the snapshot is
// capped and stripped down to bare geometry here — whole snapshots must never be
// serialized out to the boards list.
const PREVIEW_ELEMENT_CAP = 80;
const PREVIEW_PEN_POINT_CAP = 24;

type PreviewElement = {
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

const isFiniteNumber = (v: unknown): v is number =>
    typeof v === "number" && Number.isFinite(v);

const buildPreview = (
    snapshot: unknown
): { preview: RoomPreview | null; elementCount: number } => {
    if (!Array.isArray(snapshot) || snapshot.length === 0) {
        return { preview: null, elementCount: 0 };
    }

    const elements: PreviewElement[] = [];
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const track = (x: number, y: number) => {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
    };

    for (const raw of snapshot) {
        if (elements.length >= PREVIEW_ELEMENT_CAP) break;
        if (!raw || typeof raw !== "object") continue;

        const el = raw as Record<string, unknown>;
        const type = typeof el.type === "string" ? el.type : null;
        if (!type) continue;
        const color = typeof el.color === "string" ? el.color : "#ffffff";

        if (type === "pen") {
            if (!Array.isArray(el.points) || el.points.length === 0) continue;

            // Decimate evenly so the stroke keeps its shape at thumbnail size.
            const step = Math.max(
                1,
                Math.ceil(el.points.length / PREVIEW_PEN_POINT_CAP)
            );
            const points: { x: number; y: number }[] = [];
            for (let i = 0; i < el.points.length; i += step) {
                const p = el.points[i] as Record<string, unknown> | undefined;
                if (!p || !isFiniteNumber(p.x) || !isFiniteNumber(p.y)) continue;
                points.push({ x: p.x, y: p.y });
                track(p.x, p.y);
            }
            if (points.length === 0) continue;

            const xs = points.map((p) => p.x);
            const ys = points.map((p) => p.y);
            elements.push({
                type,
                color,
                x1: Math.min(...xs),
                y1: Math.min(...ys),
                x2: Math.max(...xs),
                y2: Math.max(...ys),
                points,
            });
            continue;
        }

        if (
            !isFiniteNumber(el.x1) ||
            !isFiniteNumber(el.y1) ||
            !isFiniteNumber(el.x2) ||
            !isFiniteNumber(el.y2)
        ) {
            continue;
        }

        track(el.x1, el.y1);
        track(el.x2, el.y2);
        elements.push({
            type,
            color,
            x1: el.x1,
            y1: el.y1,
            x2: el.x2,
            y2: el.y2,
        });
    }

    if (elements.length === 0 || minX === Infinity) {
        return { preview: null, elementCount: snapshot.length };
    }

    return {
        preview: {
            bbox: { x1: minX, y1: minY, x2: maxX, y2: maxY },
            elements,
        },
        elementCount: snapshot.length,
    };
};

const getRoomsForUser = async (userId: string) => {
    const rooms = await client.room.findMany({
        where: {
            OR: [{ adminId: userId }, { members: { some: { userId } } }],
        },
        include: {
            members: { select: { userId: true, role: true } },
        },
    });

    const uniqueRooms = new Map(rooms.map((room) => [room.id, room]));

    return Array.from(uniqueRooms.values()).map((room) => {
        const { snapshot, members, ...rest } = room;
        const { preview, elementCount } = buildPreview(snapshot);
        const self = members.find((m) => m.userId === userId);

        return {
            ...rest,
            // Owners predate the RoomMember model, so fall back to adminId.
            role: self?.role ?? (room.adminId === userId ? "ADMIN" : "EDITOR"),
            memberCount: members.length,
            elementCount,
            preview,
        };
    });
};

const getRoomSnapshot = async (slug: string) => {
    const room = await client.room.findUnique({
        where: { slug },
        select: { snapshot: true },
    });
    return room?.snapshot ?? null;
};

const saveRoomSnapshot = async (roomId: number, snapshot: unknown) => {
    return client.room.update({
        where: { id: roomId },
        data: { snapshot: snapshot as object },
    });
};

const updateRoomSlug = async (roomId: number, newSlug: string) => {
    try {
        return await client.room.update({
            where: { id: roomId },
            data: { slug: newSlug },
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            throw new ApiError(409, "slug already taken");
        }
        throw new ApiError(
            400,
            error instanceof Error ? error.message : "Unknown error"
        );
    }
};

const deleteRoom = async (roomId: number) => {
    try {
        return await client.room.delete({ where: { id: roomId } });
    } catch (error) {
        throw new ApiError(
            400,
            error instanceof Error ? error.message : "Unknown error"
        );
    }
};

export {
    createRoom,
    getRoomById,
    getRoomBySlug,
    getRoomsByAdminId,
    getRoomsForUser,
    getRoomSnapshot,
    saveRoomSnapshot,
    updateRoomSlug,
    deleteRoom,
};

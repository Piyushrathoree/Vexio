import { client } from "../index.ts";

const createRoom = async (slug: string, adminId: string) => {
    return client.room.create({
        data: { slug, adminId },
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

export {
    createRoom,
    getRoomById,
    getRoomBySlug,
    getRoomsByAdminId,
    getRoomSnapshot,
    saveRoomSnapshot,
};

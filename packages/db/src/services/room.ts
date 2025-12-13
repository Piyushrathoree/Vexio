import { client } from "../index.ts";

const createRoom = async (slug: string, adminId: string) => {
    return client.room.create({
        data: { slug, adminId },
    });
};
const getRoomById = async (id: number) => {
    return client.room.findUnique({ where: { id } });
};

const getRoomByAdminId = async (adminId: string) => {
    return client.room.findMany({ where: { adminId } });
};
const updateRoom = async (id: number, memberId: string) => {
    return client.room.update({
        where: { id },
        data: { members: { connect: { id: memberId } } },
    });
};

export { createRoom, getRoomById, getRoomByAdminId, updateRoom };

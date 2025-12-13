import { client } from "../index.ts";
import { ApiError } from "@repo/common";

const createChat = async (userId: string, roomId: number, messages: string) => {
    console.log(process.env.DATABASE_URL);
    console.log(process.env.DATABASE_URL);
    console.log(process.env.DATABASE_URL);
    console.log(process.env.DATABASE_URL);

    try {
        return await client.chat.create({
            data: { messages, roomId, userId },
        });
    } catch (error) {
        throw new ApiError(
            400,
            error instanceof Error ? error.message : "Unknown error"
        );
    }
};
const getChatsByRoomId = async (roomId: number) => {
    try {
        return client.chat.findMany({ where: { roomId } });
    } catch (error) {
        throw new ApiError(
            400,
            error instanceof Error ? error.message : "Unknown error"
        );
    }
};
const deleteChat = async (chatId: number) => {
    try {
        return client.chat.delete({ where: { id: chatId } });
    } catch (error) {
        throw new ApiError(
            400,
            error instanceof Error ? error.message : "Unknown error"
        );
    }
};
const updateChat = async (chatId: number, message: string) => {
    try {
        return client.chat.update({
            where: { id: chatId },
            data: { messages: message },
        });
    } catch (error) {
        throw new ApiError(
            400,
            error instanceof Error ? error.message : "Unknown error"
        );
    }
};
const getChatByUserId = async (userId: string) => {
    try {
        return client.chat.findMany({ where: { userId } });
    } catch (error) {
        throw new ApiError(
            400,
            error instanceof Error ? error.message : "Unknown error"
        );
    }
};

export {
    createChat,
    getChatsByRoomId,
    deleteChat,
    updateChat,
    getChatByUserId,
};

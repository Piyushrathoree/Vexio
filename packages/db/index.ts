export { client } from "./src/index.ts";

export { getUserById } from "./src/services/auth.ts";

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
} from "./src/services/room.ts";

export type { RoomPreview } from "./src/services/room.ts";

export {
    createChat,
    deleteChat,
    getChatByUserId,
    getChatsByRoomId,
    updateChat,
} from "./src/services/chat.ts";

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
} from "./src/services/member.ts";

import type { User } from "..";

/***
    type = import("@types/ws").default   // Bun's version
    type = import("ws").WebSocket        // Node's version
    and here ws is confused between them that's why using @args any  there 
 ***/
const addUser = (
    userId: string,
    ws: any | WebSocket,
    Users: Map<string, User>
) => {
    Users.set(userId, { userId, ws, rooms: new Set() });
};

const joinRoom = (userId: string, roomId: number, Users: Map<string, User>) => {
    if (!userId) return;
    const user = Users.get(userId);
    if (!user) return;
    if (!user.rooms.has(roomId)) {
        user.rooms.add(roomId);
    }
};

const leaveRoom = (
    userId: string,
    roomId: number,
    Users: Map<string, User>
) => {
    if (!userId) return;
    const user = Users.get(userId);
    if (!user) return;
    if (user.rooms.has(roomId)) {
        user.rooms.delete(roomId);
    }
};

const broadcastMessage = (
    userId: string,
    message: string,
    Users: Map<string, User>
) => {
    const user = Users.get(userId);
    if (user) {
        user.ws.send(message);
    }
};

//removing the whole user from the map
const removeUser = (userId: string, Users: Map<string, User>) => {
    Users.delete(userId);
};

export { addUser, joinRoom, leaveRoom, broadcastMessage, removeUser };

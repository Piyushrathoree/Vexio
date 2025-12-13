import { createChat } from "@repo/db";
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

const broadcastToRoom = async(
    roomId: number,
    message: string,
    Users: Map<string, User>
) => {
    Users.forEach((user) => {
        if (user.rooms.has(roomId)) {
            try {
                // Only send if socket is open (readyState === 1)
                if (user.ws.readyState === 1) {
                    user.ws.send(message);
                }
            } catch (err) {
                // Ignore send errors (socket might have closed)
                console.error(`Failed to send to user ${user.userId}:`, err);
            }
        }
    });
};

//removing the whole user from the map
const removeUser = (userId: string, Users: Map<string, User>) => {
    Users.delete(userId);
};

export { addUser, joinRoom, leaveRoom, broadcastToRoom, removeUser };

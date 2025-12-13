import { WebSocketServer } from "ws";
import type { WebSocket, RawData } from "ws";
import getToken from "./middleware/getToken.ts";
import {
    addUser,
    broadcastToRoom,
    joinRoom,
    leaveRoom,
    removeUser,
} from "./middleware/Users.ts";
import { createChat } from "@repo/db";

const wss = new WebSocketServer({ port: 8080 });
export interface User {
    userId: string;
    rooms: Set<number>;
    ws: WebSocket;
}

const Users = new Map<string, User>();

// Convert Bufferto string -- node.js returns buffer as data in ws which are basically network packets (bytes)
const toText = (data: RawData): string => {
    if (typeof data === "string") return data;
    if (Buffer.isBuffer(data)) return data.toString("utf8");
    if (data instanceof ArrayBuffer) return Buffer.from(data).toString("utf8");
    return String(data);
};

wss.on("connection", function connection(ws, request) {
    const userId = getToken(request, ws);
    if (!userId) {
        ws.close();
        return;
    }
    addUser(userId, ws, Users);
    console.log("User connected:", userId);

    ws.on("error", console.error);

    // Clean up when user disconnects
    ws.on("close", () => {
        removeUser(userId, Users);
        console.log("User disconnected:", userId);
    });

    // main logic goes here
    ws.on("message",async function message(data) {
        const text = toText(data);
        console.log("Raw message:", text);

        let parsedData: any;
        try {
            parsedData = JSON.parse(text);
        } catch (error) {
            // Don't crash on bad JSON - just log and ignore
            console.error("Invalid JSON received:", error);
            return;
        }

        if (!parsedData || typeof parsedData !== "object") {
            console.log("Invalid message format");
            return;
        }

        console.log("Parsed:", parsedData.type);
        console.log(parsedData.roomId); 
        
        try {
            if (parsedData.type === "join_room" && parsedData.roomId != null) {
                console.log("Joining room:", parsedData.roomId);
                joinRoom(userId, Number(parsedData.roomId), Users);
            }

            if (parsedData.type === "leave_room" && parsedData.roomId != null) {    
                console.log("Leaving room:", parsedData.roomId);
                leaveRoom(userId, Number(parsedData.roomId), Users);
            }

            if (parsedData.type === "stroke" && parsedData.roomId != null) {
                await createChat(userId , parsedData.roomId , parsedData.message)
                broadcastToRoom(
                    Number(parsedData.roomId),
                    JSON.stringify(parsedData),
                    Users
                );
            }
            console.log(Users);
            
        } catch (error) {
            console.error("Error processing message:", error);
        }
    });
});

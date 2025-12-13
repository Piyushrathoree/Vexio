import { WebSocketServer } from "ws";
import type { WebSocket } from "ws";
import getToken from "./service/getToken";
import { addUser } from "./service/Users";

const wss = new WebSocketServer({ port: 8080 });
export interface User {
    userId: string;
    rooms: Set<number>;
    ws: WebSocket;
}

const Users = new Map();

wss.on("connection", function connection(ws, request) {
    const userId = getToken(request, ws);
    if (!userId) {
        ws.close();
        return;
    }
    addUser(userId, ws, Users);

    ws.on("error", console.error);
    ws.on("message", function message(data) {
        console.log("%s", data);
    });
    ws.send("something ");
});

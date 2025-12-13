import { WebSocketServer } from "ws";
import getToken from "./service/getToken";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", function connection(ws, request) {
    getToken(request, ws);
    ws.on("error", console.error);
    ws.on("message", function message(data) {
        console.log("%s", data);
    });
    ws.send("something ");
});

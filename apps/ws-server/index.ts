import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", function connection(ws, request) {
    const url = request.url;
    if (!url) {
        return;
    }
    const queryParams = new URLSearchParams(url.split("?")[1]);
    const token = queryParams.get("token") || " ";
    if (!token) {
        return;
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    if (typeof decoded == "string") {
        ws.close();
        return;
    }
    if (!decoded) {
        ws.close();
        return;
    }
    
    ws.on("error", console.error);
    ws.on("message", function message(data) {
        console.log("%s", data);
    });
    ws.send("something ");
});

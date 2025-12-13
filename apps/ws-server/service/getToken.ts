import { ApiError } from "@repo/common";
import verifyUser from "./verify";
import WebSocket from "ws";

export default function getToken(
    request: { url?: string },
    ws: WebSocket
): string | null {
    try {
        const url = request.url;
        if (!url) {
            return null;
        }
        const queryParams = new URLSearchParams(url.split("?")[1]);
        const token = queryParams.get("token") || " ";
        const userId = verifyUser(token);
        if (typeof userId !== "string") {
            ws.close();
            return null;
        }
        return userId;
    } catch (error) {
        throw new ApiError(500, "user not authenticated");
    }
}

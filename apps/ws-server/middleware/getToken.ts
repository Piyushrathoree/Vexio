import type { WebSocket } from "ws";
import verifyUser from "./verify";

export default async function getToken(
    request: { url?: string },
    ws: WebSocket
): Promise<string | null> {
    try {
        const url = request.url;
        if (!url) {
            ws.close();
            return null;
        }

        const token = new URL(url, "http://localhost").searchParams.get("token");
        if (!token) {
            ws.close();
            return null;
        }

        const userId = await verifyUser(token);
        if (!userId) {
            ws.close();
            return null;
        }

        return userId;
    } catch {
        ws.close();
        return null;
    }
}

// Shared WS test client for tests/integration/*.test.ts — adapted from the
// `mkClient` helper in /mnt/a/Codebase/Vexio/scratch-wstest.mjs.
//
// Keep this aligned with the CURRENT message contract in
// apps/ws-server/types.ts / packages/ws-schema (the ws-server is being
// actively reworked — see tests/README.md).

export type WsMessage = { type: string; [key: string]: unknown };

export type TestWsClient = {
    ws: WebSocket;
    /** Every message received so far, in order. */
    received: WsMessage[];
    /** True once any message of the given type has been received. */
    hasReceived(type: string, predicate?: (m: WsMessage) => boolean): boolean;
    /** Poll `received` until a matching message shows up or `timeoutMs` elapses. */
    waitFor(
        type: string,
        predicate?: (m: WsMessage) => boolean,
        timeoutMs?: number
    ): Promise<WsMessage>;
    close(): void;
};

/**
 * Opens a WS connection authenticated via `?token=<bearer>` (see
 * apps/ws-server/index.ts's `wss.on("connection", ...)`, which reads the
 * token from the URL query string) and immediately sends `join_room` — this
 * mirrors the "original client behavior" the scratch script documents:
 * ws-server buffers messages that arrive before auth completes and replays
 * them, so sending join_room right on `open` is safe.
 */
export function connectWsClient(wsBase: string, bearer: string, slug: string): Promise<TestWsClient> {
    return new Promise((resolve, reject) => {
        const url = `${wsBase}?token=${encodeURIComponent(bearer)}`;
        const ws = new WebSocket(url);
        const received: WsMessage[] = [];

        const client: TestWsClient = {
            ws,
            received,
            hasReceived(type, predicate) {
                return received.some((m) => m.type === type && (!predicate || predicate(m)));
            },
            async waitFor(type, predicate, timeoutMs = 5000) {
                const start = Date.now();
                while (Date.now() - start < timeoutMs) {
                    const found = received.find(
                        (m) => m.type === type && (!predicate || predicate(m))
                    );
                    if (found) return found;
                    await new Promise((r) => setTimeout(r, 50));
                }
                throw new Error(
                    `timed out waiting for a "${type}" message (received so far: ${JSON.stringify(received)})`
                );
            },
            close() {
                try {
                    ws.close();
                } catch {
                    // already closed — fine
                }
            },
        };

        const openTimeout = setTimeout(() => reject(new Error("WS open timeout")), 5000);

        ws.onopen = () => {
            clearTimeout(openTimeout);
            ws.send(JSON.stringify({ type: "join_room", slug }));
            resolve(client);
        };
        ws.onmessage = (e) => {
            try {
                received.push(JSON.parse(String(e.data)));
            } catch {
                // non-JSON frame — ignore for these tests
            }
        };
        ws.onerror = () => {
            // Surfaced via close/timeout; avoid throwing here so onclose can
            // still run its course.
        };
    });
}

import "@repo/common";

/**
 * WebSocket server — not implemented yet.
 * See extension plan in repo / handoff notes.
 */
const port = Number(process.env.WS_PORT ?? 8080);

console.log(`ws-server placeholder on :${port} (no WS logic yet)`);

// Keep process alive for turbo dev
setInterval(() => {}, 60_000);

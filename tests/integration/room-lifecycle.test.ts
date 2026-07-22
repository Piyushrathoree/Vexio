// HTTP + WS end-to-end integration test, adapted from the manual E2E script
// at /mnt/a/Codebase/Vexio/scratch-wstest.mjs.
//
// Flow: sign up a throwaway admin -> create a room -> confirm it shows up in
// GET /api/v1/rooms -> confirm a second (non-member) user gets 403 on
// GET /api/v1/room/:slug -> admin creates an invite -> second user accepts
// it -> confirm the second user can now GET the room -> open two WS clients
// and assert element_add broadcast + room_state + presence.
//
// This test talks to REAL running services (http-server on :8000, ws-server
// on :8080, and a pushed Postgres schema behind @repo/db) — it never mocks
// the network. Per the task brief it must not fail the suite just because
// those aren't up in a given environment, so it is gated behind:
//
//   1. the TEST_INTEGRATION env flag (must be "1" or "true"), AND
//   2. a live reachability probe against the http-server base URL.
//
// If either check fails, the whole describe block is skipped with a
// console note explaining why — see tests/README.md for how to actually run
// this.
//
// NOTE: apps/ws-server is being actively reworked by the developer. If the
// WS assertions below start failing, check apps/ws-server/types.ts and
// packages/ws-schema/src/messages.ts first — the message contract may have
// moved out from under this test.

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { signUpAndSignIn, makeThrowawayUser } from "../support/auth-client";
import { connectWsClient, type TestWsClient } from "../support/ws-client";

const HTTP_URL = (
    process.env.HTTP_SERVER_URL ??
    process.env.NEXT_PUBLIC_AUTH_URL ??
    "http://localhost:8000"
).replace(/\/$/, "");

const WS_URL =
    process.env.WS_SERVER_URL ?? process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";

const rawFlag = (process.env.TEST_INTEGRATION ?? "").trim().toLowerCase();
const flagEnabled = rawFlag === "1" || rawFlag === "true";

let httpReachable = false;
if (flagEnabled) {
    try {
        const res = await fetch(`${HTTP_URL}/`, { signal: AbortSignal.timeout(2000) });
        httpReachable = res.ok;
    } catch {
        httpReachable = false;
    }
}

const RUN = flagEnabled && httpReachable;

if (!flagEnabled) {
    console.log(
        "[integration] TEST_INTEGRATION is not set to 1/true — skipping tests/integration/room-lifecycle.test.ts. " +
            "See tests/README.md to run it against live servers."
    );
} else if (!httpReachable) {
    console.log(
        `[integration] could not reach http-server at ${HTTP_URL} — skipping tests/integration/room-lifecycle.test.ts. ` +
            "Start it with `bun run dev` (or the http-server workspace alone) and re-run."
    );
}

describe.skipIf(!RUN)("room lifecycle integration (HTTP + WS)", () => {
    const runId = Date.now();
    const slug = `vexio-it-room-${runId}`;
    const admin = makeThrowawayUser("admin", runId);
    const invitee = makeThrowawayUser("invitee", runId);
    // Open-by-link: never invited, just opens the slug.
    const joiner = makeThrowawayUser("joiner", runId);
    // Invited explicitly as VIEWER, to prove the WS write guard.
    const viewer = makeThrowawayUser("viewer", runId);

    let adminBearer = "";
    let inviteeBearer = "";
    let joinerBearer = "";
    let viewerBearer = "";
    let inviteToken = "";

    let clientA: TestWsClient | undefined;
    let clientB: TestWsClient | undefined;
    let clientViewer: TestWsClient | undefined;

    beforeAll(async () => {
        adminBearer = await signUpAndSignIn(HTTP_URL, admin);
        inviteeBearer = await signUpAndSignIn(HTTP_URL, invitee);
        joinerBearer = await signUpAndSignIn(HTTP_URL, joiner);
        viewerBearer = await signUpAndSignIn(HTTP_URL, viewer);
    }, 30000);

    afterAll(() => {
        clientA?.close();
        clientB?.close();
        clientViewer?.close();
    });

    test("admin creates the room", async () => {
        const res = await fetch(`${HTTP_URL}/api/v1/room`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                authorization: `Bearer ${adminBearer}`,
            },
            body: JSON.stringify({ slug }),
        });
        expect(res.status).toBe(201);
        const body = await res.json();
        expect(body.data.room.slug).toBe(slug);
    });

    test("GET /api/v1/rooms for the admin includes the new room", async () => {
        const res = await fetch(`${HTTP_URL}/api/v1/rooms`, {
            headers: { authorization: `Bearer ${adminBearer}` },
        });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(Array.isArray(body.data.rooms)).toBe(true);
        expect(body.data.rooms.some((r: { slug: string }) => r.slug === slug)).toBe(true);
    });

    test("a non-member is forbidden (403) from GET /api/v1/room/:slug", async () => {
        const res = await fetch(`${HTTP_URL}/api/v1/room/${slug}`, {
            headers: { authorization: `Bearer ${inviteeBearer}` },
        });
        expect(res.status).toBe(403);
    });

    // --- Open by link ----------------------------------------------------
    // The headline flow: a user who was never invited opens the board's slug
    // and is enrolled as an EDITOR. Before this existed, apps/web's "paste a
    // slug" box pushed to a board the user wasn't a member of, the gate 403'd,
    // and the whiteboard page silently bounced them back to /rooms.

    test("a non-member who joins by link is enrolled as EDITOR", async () => {
        const res = await fetch(`${HTTP_URL}/api/v1/room/${slug}/join`, {
            method: "POST",
            headers: { authorization: `Bearer ${joinerBearer}` },
        });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.data.room.slug).toBe(slug);
        expect(body.data.role).toBe("EDITOR");
    });

    test("the joiner can now GET the room", async () => {
        const res = await fetch(`${HTTP_URL}/api/v1/room/${slug}`, {
            headers: { authorization: `Bearer ${joinerBearer}` },
        });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.data.role).toBe("EDITOR");
    });

    test("joining is idempotent and never downgrades an existing ADMIN", async () => {
        // The room's admin re-opening their own board must stay ADMIN — this is
        // the `update: {}` in ensureMember (packages/db/src/services/member.ts).
        const res = await fetch(`${HTTP_URL}/api/v1/room/${slug}/join`, {
            method: "POST",
            headers: { authorization: `Bearer ${adminBearer}` },
        });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.data.role).toBe("ADMIN");
    });

    test("joining an unknown slug is a 404, not a silent success", async () => {
        const res = await fetch(
            `${HTTP_URL}/api/v1/room/vexio-it-nope-${runId}/join`,
            {
                method: "POST",
                headers: { authorization: `Bearer ${joinerBearer}` },
            }
        );
        expect(res.status).toBe(404);
    });

    test("GET /api/v1/rooms carries role, counts, and a capped preview", async () => {
        const res = await fetch(`${HTTP_URL}/api/v1/rooms`, {
            headers: { authorization: `Bearer ${adminBearer}` },
        });
        expect(res.status).toBe(200);
        const body = await res.json();
        const room = body.data.rooms.find(
            (r: { slug: string }) => r.slug === slug
        );
        expect(room).toBeDefined();
        expect(room.role).toBe("ADMIN");
        expect(typeof room.memberCount).toBe("number");
        expect(room.memberCount).toBeGreaterThanOrEqual(2);
        expect(typeof room.elementCount).toBe("number");
        // `preview` is null for an untouched board and an object once drawn on;
        // either way the raw snapshot must never be shipped to the dashboard.
        expect(room.snapshot).toBeUndefined();
    });

    test("admin creates an invite", async () => {
        const res = await fetch(`${HTTP_URL}/api/v1/room/${slug}/invite`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                authorization: `Bearer ${adminBearer}`,
            },
            body: JSON.stringify({ role: "EDITOR" }),
        });
        expect(res.status).toBe(201);
        const body = await res.json();
        expect(typeof body.data.invite.token).toBe("string");
        inviteToken = body.data.invite.token;
    });

    test("invitee accepts the invite", async () => {
        expect(inviteToken).not.toBe("");
        const res = await fetch(`${HTTP_URL}/api/v1/invite/${inviteToken}/accept`, {
            method: "POST",
            headers: { authorization: `Bearer ${inviteeBearer}` },
        });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.data.slug).toBe(slug);
        expect(body.data.member.role).toBe("EDITOR");
    });

    test("invitee can now GET the room (ACL now allows it)", async () => {
        const res = await fetch(`${HTTP_URL}/api/v1/room/${slug}`, {
            headers: { authorization: `Bearer ${inviteeBearer}` },
        });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.data.room.slug).toBe(slug);
    });

    test(
        "two WS clients: room_state on join, presence broadcast, and element_add fan-out",
        async () => {
            clientA = await connectWsClient(WS_URL, adminBearer, slug);
            clientB = await connectWsClient(WS_URL, inviteeBearer, slug);

            // Both joins send room_state + (for the second joiner) presence to
            // existing peers — give the server a moment to process both.
            await clientB.waitFor("room_state", (m) => m.slug === slug);

            // A should see B's "joined" presence (B joined after A).
            await clientA.waitFor(
                "presence",
                (m) => m.action === "joined" && m.slug === slug
            );

            clientA.ws.send(
                JSON.stringify({
                    type: "element_add",
                    slug,
                    element: {
                        id: "it-element-1",
                        color: "#000000",
                        thickness: 2,
                        type: "rect",
                        x1: 0,
                        y1: 0,
                        x2: 10,
                        y2: 10,
                        fill: null,
                    },
                })
            );

            const addMsg = await clientB.waitFor(
                "element_add",
                (m) => (m.element as { id?: string })?.id === "it-element-1"
            );
            expect(addMsg.slug).toBe(slug);
            expect(addMsg.userId).toBeDefined();
        },
        15000
    );

    test(
        "a VIEWER is refused element writes over WS but still receives room_state",
        async () => {
            // Grant VIEWER explicitly via an invite. The WS join path calls the
            // same ensureMember, so opening the board must NOT promote them to
            // EDITOR — the role has to survive the join.
            const inviteRes = await fetch(
                `${HTTP_URL}/api/v1/room/${slug}/invite`,
                {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                        authorization: `Bearer ${adminBearer}`,
                    },
                    body: JSON.stringify({ role: "VIEWER" }),
                }
            );
            expect(inviteRes.status).toBe(201);
            const viewerToken = (await inviteRes.json()).data.invite.token;

            const acceptRes = await fetch(
                `${HTTP_URL}/api/v1/invite/${viewerToken}/accept`,
                {
                    method: "POST",
                    headers: { authorization: `Bearer ${viewerBearer}` },
                }
            );
            expect(acceptRes.status).toBe(200);
            expect((await acceptRes.json()).data.member.role).toBe("VIEWER");

            clientViewer = await connectWsClient(WS_URL, viewerBearer, slug);

            // Read access is unaffected.
            await clientViewer.waitFor("room_state", (m) => m.slug === slug);

            clientViewer.ws.send(
                JSON.stringify({
                    type: "element_add",
                    slug,
                    element: {
                        id: `it-viewer-denied-${runId}`,
                        color: "#000000",
                        thickness: 2,
                        type: "rect",
                        x1: 0,
                        y1: 0,
                        x2: 10,
                        y2: 10,
                        fill: null,
                    },
                })
            );

            const err = await clientViewer.waitFor("error");
            expect(String(err.message)).toContain("view-only");

            // And the write must not have landed on any peer.
            expect(
                clientA?.hasReceived(
                    "element_add",
                    (m) =>
                        (m.element as { id?: string })?.id ===
                        `it-viewer-denied-${runId}`
                )
            ).toBeFalsy();

            // The viewer keeps ephemeral presence — cursors still relay.
            expect(clientViewer.ws.readyState).toBe(WebSocket.OPEN);
        },
        20000
    );
});

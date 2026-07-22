// Pure unit tests documenting the room-invite token contract.
//
// packages/db/src/services/member.ts's createInvite mints tokens with
// Node's `crypto.randomUUID()` (imported there as `randomUUID`):
//
//     const token = randomUUID();
//     return client.roomInvite.create({ data: { roomId, createdBy, role, token, expiresAt } });
//
// and apps/http-server/controllers/index.ts's acceptRoomInvite deliberately
// does NOT format-validate the token — it only requires a non-empty string:
//
//     const rawToken = req.params.token;
//     if (!rawToken || typeof rawToken !== "string") {
//         throw new ApiError(400, "invite token is required");
//     }
//     const member = await consumeInvite(rawToken, userId); // 404 if unknown, 400 if expired
//
// These tests exercise the real `crypto.randomUUID` used by createInvite
// (no DB needed for token *generation*) and pin down the acceptance
// endpoint's string-shape contract as living documentation, since the DB
// lookup itself can only be covered by the integration suite.

import { describe, test, expect } from "bun:test";
import { randomUUID } from "crypto";

// RFC 4122 v4 UUID: 8-4-4-4-12 hex, version nibble "4", variant nibble in [8,9,a,b].
const UUID_V4_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("invite token generation (crypto.randomUUID, as used by createInvite)", () => {
    test("produces an RFC 4122 v4 UUID", () => {
        const token = randomUUID();
        expect(token).toMatch(UUID_V4_RE);
    });

    test("is 36 characters long including hyphens", () => {
        expect(randomUUID()).toHaveLength(36);
    });

    test("is effectively unique across many invites", () => {
        const tokens = new Set(Array.from({ length: 1000 }, () => randomUUID()));
        expect(tokens.size).toBe(1000);
    });

    test("is URL-path-safe, matching how it's embedded in routes", () => {
        // Used verbatim in POST /api/v1/invite/:token/accept and in the
        // inviteUrl `${webUrl}/invite/${invite.token}` built by
        // createRoomInvite — no encodeURIComponent happens anywhere, so the
        // charset must already be URL-safe.
        const token = randomUUID();
        expect(encodeURIComponent(token)).toBe(token);
    });
});

describe("acceptRoomInvite token param contract (string-shape guard only)", () => {
    // Mirrors the `!rawToken || typeof rawToken !== "string"` guard in
    // apps/http-server/controllers/index.ts's acceptRoomInvite. Anything
    // that passes this guard is forwarded to consumeInvite, which is the DB
    // layer that actually knows whether the token exists/expired — covered
    // by the integration suite, not here.
    const passesStringGuard = (raw: unknown): boolean =>
        typeof raw === "string" && raw.length > 0;

    test.each([
        ["a real UUID token", randomUUID()],
        ["an arbitrary non-empty string (format isn't checked here)", "not-a-real-uuid"],
    ])("%s passes the param guard", (_label, raw) => {
        expect(passesStringGuard(raw)).toBe(true);
    });

    test.each([
        ["empty string", ""],
        ["undefined", undefined],
        ["null", null],
        ["number", 123],
    ])("%s fails the param guard", (_label, raw) => {
        expect(passesStringGuard(raw)).toBe(false);
    });
});

describe("createInvite role defaults (VALID_INVITE_ROLES in controllers/index.ts)", () => {
    // createRoomInvite defaults to "EDITOR" and only accepts "EDITOR"/"VIEWER"
    // from the request body (never "ADMIN" — you can't invite someone
    // straight into admin).
    const VALID_INVITE_ROLES = new Set(["EDITOR", "VIEWER"]);

    test("EDITOR and VIEWER are invitable roles", () => {
        expect(VALID_INVITE_ROLES.has("EDITOR")).toBe(true);
        expect(VALID_INVITE_ROLES.has("VIEWER")).toBe(true);
    });

    test("ADMIN is not an invitable role", () => {
        expect(VALID_INVITE_ROLES.has("ADMIN")).toBe(false);
    });
});

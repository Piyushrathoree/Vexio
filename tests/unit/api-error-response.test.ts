// Pure unit tests for @repo/common's ApiError/ApiResponse — the shared
// envelope every http-server controller (apps/http-server/controllers/index.ts)
// throws/returns. No database, no server, no network.

import { describe, test, expect } from "bun:test";
import { ApiError, ApiResponse } from "@repo/common";

describe("ApiError", () => {
    test("carries statusCode and message", () => {
        const err = new ApiError(404, "room not found");
        expect(err.statusCode).toBe(404);
        expect(err.message).toBe("room not found");
        expect(err.success).toBe(false);
    });

    test("is a real Error instance (so it survives throw/catch and instanceof checks)", () => {
        const err = new ApiError(400, "bad slug");
        expect(err).toBeInstanceOf(Error);
        expect(() => {
            throw err;
        }).toThrow("bad slug");
    });

    test("defaults message when none is given", () => {
        const err = new ApiError(500);
        expect(err.message).toBe("something went wrong");
    });

    test("defaults to an empty errors array", () => {
        const err = new ApiError(400, "oops");
        expect(err.errors).toEqual([]);
    });

    // Table-driven over the status codes controllers/index.ts actually throws
    // today (401 unauthorized, 403 not-a-member/not-admin, 404 not found,
    // 409 slug conflict, 400 validation) — documents the ACL surface without
    // needing a live server.
    test.each([
        [400, "you must have a Slug"],
        [401, "unauthorized"],
        [403, "you are not a member of this room"],
        [403, "only room admins can perform this action"],
        [404, "room not found"],
        [409, "room slug already exists"],
    ])("round-trips statusCode=%d message=%p", (statusCode, message) => {
        const err = new ApiError(statusCode, message);
        expect(err.statusCode).toBe(statusCode);
        expect(err.message).toBe(message);
    });
});

describe("ApiResponse", () => {
    test("success=true for statusCode < 400", () => {
        const res = new ApiResponse(200, { room: { slug: "x" } }, "ok");
        expect(res.success).toBe(true);
        expect(res.statusCode).toBe(200);
        expect(res.data).toEqual({ room: { slug: "x" } });
        expect(res.message).toBe("ok");
    });

    test("success=false for statusCode >= 400", () => {
        const res = new ApiResponse(404, {}, "not found");
        expect(res.success).toBe(false);
    });

    test("201 (room created) is still success=true", () => {
        const res = new ApiResponse(201, { room: { slug: "new-room" } });
        expect(res.success).toBe(true);
        expect(res.message).toBe("success");
    });

    test("boundary: exactly 400 is success=false", () => {
        const res = new ApiResponse(400, {});
        expect(res.success).toBe(false);
    });

    test("boundary: 399 is success=true", () => {
        const res = new ApiResponse(399, {});
        expect(res.success).toBe(true);
    });
});

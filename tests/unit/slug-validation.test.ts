// Pure unit tests documenting the room-slug validation rules.
//
// `normalizeSlug` lives inline (not exported) in
// apps/http-server/controllers/index.ts:
//
//     const normalizeSlug = (raw: unknown): string => {
//         if (!raw || typeof raw !== "string") {
//             throw new ApiError(400, "you must have a Slug");
//         }
//         const slug = raw.trim().toLowerCase();
//         if (slug.length < 3 || slug.length > 64) {
//             throw new ApiError(400, "slug must be between 3 and 64 characters");
//         }
//         if (!/^[a-z0-9-]+$/.test(slug)) {
//             throw new ApiError(400, "slug must use lowercase letters, numbers, and hyphens only");
//         }
//         return slug;
//     };
//
// Per this test suite's ownership rules we may not edit apps/* to export it,
// so this file keeps a byte-for-byte behavioral mirror below and exercises
// THAT, table-driven, as living documentation of the contract. If
// apps/http-server/controllers/index.ts's normalizeSlug changes, update the
// mirror (and the table) to match — a diff here should be a deliberate
// signal that the slug contract moved, not silent drift.
//
// This also mirrors requireSlugParam (path-param variant: trims/lowercases,
// only rejects empty — no length/charset check, since it's applied to slugs
// that already exist).

import { describe, test, expect } from "bun:test";
import { ApiError } from "@repo/common";

const normalizeSlug = (raw: unknown): string => {
    if (!raw || typeof raw !== "string") {
        throw new ApiError(400, "you must have a Slug");
    }
    const slug = raw.trim().toLowerCase();
    if (slug.length < 3 || slug.length > 64) {
        throw new ApiError(400, "slug must be between 3 and 64 characters");
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
        throw new ApiError(
            400,
            "slug must use lowercase letters, numbers, and hyphens only"
        );
    }
    return slug;
};

const requireSlugParam = (raw: unknown): string => {
    if (!raw || typeof raw !== "string") {
        throw new ApiError(400, "slug is required");
    }
    const slug = raw.trim().toLowerCase();
    if (!slug) {
        throw new ApiError(400, "slug is required");
    }
    return slug;
};

describe("normalizeSlug (POST /api/v1/room, PATCH /api/v1/room/:slug body)", () => {
    const valid: string[] = [
        "abc",
        "my-room",
        "room123",
        "a".repeat(64), // exactly 64 chars — upper boundary
        "abc-123-def",
        "123",
        "---", // hyphens only still matches the charset (no alnum requirement)
    ];

    const invalid: Array<[label: string, raw: unknown]> = [
        ["empty string", ""],
        ["too short (2 chars)", "ab"],
        ["too long (65 chars)", "a".repeat(65)],
        // NB: uppercase is NOT listed here — normalizeSlug lowercases before
        // the charset check, so "MyRoom" normalizes to "myroom" and is
        // accepted. That behaviour is asserted explicitly below.
        ["spaces", "my room"],
        ["underscore", "my_room"],
        ["special chars", "room!"],
        ["unicode", "room-é"],
        ["null", null],
        ["undefined", undefined],
        ["non-string (number)", 123],
        ["non-string (object)", { slug: "abc" }],
    ];

    test.each(valid)("accepts %p", (raw) => {
        expect(() => normalizeSlug(raw)).not.toThrow();
    });

    test.each(invalid)("rejects %s", (_label, raw) => {
        expect(() => normalizeSlug(raw)).toThrow(ApiError);
    });

    test("trims surrounding whitespace", () => {
        expect(normalizeSlug("  my-room  ")).toBe("my-room");
    });

    test("lowercases mixed-case input rather than rejecting it after trim", () => {
        // Note: normalizeSlug lowercases BEFORE the charset check, so
        // "MyRoom" becomes "myroom" and passes — uppercase alone isn't a
        // rejection reason once normalized.
        expect(normalizeSlug("MyRoom")).toBe("myroom");
    });

    test("3 chars is the minimum accepted length", () => {
        expect(() => normalizeSlug("ab")).toThrow(/between 3 and 64/);
        expect(normalizeSlug("abc")).toBe("abc");
    });

    test("64 chars is the maximum accepted length", () => {
        expect(normalizeSlug("a".repeat(64))).toBe("a".repeat(64));
        expect(() => normalizeSlug("a".repeat(65))).toThrow(/between 3 and 64/);
    });

    test("rejects non-string input with a distinct message from the charset error", () => {
        expect(() => normalizeSlug(null)).toThrow("you must have a Slug");
    });
});

describe("requireSlugParam (:slug path param on GET/PATCH/DELETE/leave/members/invite routes)", () => {
    test("accepts and lowercases any non-empty string, even ones normalizeSlug would reject", () => {
        // Path params reference EXISTING rooms, so requireSlugParam only
        // guards against missing/empty — it intentionally does not re-run
        // the create-time length/charset rules.
        expect(requireSlugParam("Some_Weird-Slug!")).toBe("some_weird-slug!");
    });

    test("trims surrounding whitespace", () => {
        expect(requireSlugParam("  my-room  ")).toBe("my-room");
    });

    test.each([
        ["empty string", ""],
        ["whitespace only", "   "],
        ["null", null],
        ["undefined", undefined],
        ["non-string", 42],
    ])("rejects %s", (_label, raw) => {
        expect(() => requireSlugParam(raw)).toThrow(ApiError);
    });
});

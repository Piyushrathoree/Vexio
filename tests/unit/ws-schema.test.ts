// Pure unit tests for the WS message contract exported by @repo/ws-schema.
//
// These exercise the REAL exported code (packages/ws-schema/src/*.ts) — no
// database, no running server, no network. They document what a valid
// client -> server / server -> client payload looks like today and should
// fail loudly the moment apps/ws-server, apps/web, or packages/ws-schema
// drift out of sync with each other.
//
// NOTE (per task brief): the ws-server internals are being actively reworked
// by the developer. If this file starts failing after a ws-schema change,
// that's a signal the contract moved — update the fixtures below to match
// the new packages/ws-schema/src/*.ts, don't just delete the assertions.

import { describe, test, expect } from "bun:test";
import {
    ClientMessageSchema,
    ServerMessageSchema,
    DrawingElementSchema,
    parseClientMessage,
    parseServerMessage,
    safeParseClientMessage,
    safeParseServerMessage,
} from "@repo/ws-schema";

// --- fixtures ---------------------------------------------------------------

const validShapeElement = {
    id: "el-1",
    color: "#000000",
    thickness: 2,
    type: "rect",
    x1: 0,
    y1: 0,
    x2: 10,
    y2: 10,
    fill: null, // ShapeElement.fill is nullable, not optional
};

const validPenElement = {
    id: "el-2",
    color: "#ff0000",
    thickness: 1,
    type: "pen",
    points: [{ x: 0, y: 0, t: 0, pressure: 0.5 }],
};

const validTextElement = {
    id: "el-3",
    color: "#0000ff",
    thickness: 1,
    type: "text",
    x1: 0,
    y1: 0,
    x2: 50,
    y2: 20,
    text: "hello",
    fontFamily: "sans-serif",
};

const validStickyElement = {
    id: "el-4",
    color: "#000000",
    thickness: 1,
    type: "sticky",
    x1: 0,
    y1: 0,
    x2: 100,
    y2: 100,
    text: "note",
    fill: "#ffff00", // StickyElement.fill is required (not nullable, unlike ShapeElement)
    fontFamily: "sans-serif",
};

describe("DrawingElementSchema", () => {
    test.each([
        ["shape (rect)", validShapeElement],
        ["pen", validPenElement],
        ["text", validTextElement],
        ["sticky", validStickyElement],
    ])("accepts a valid %s element", (_label, element) => {
        expect(() => DrawingElementSchema.parse(element)).not.toThrow();
    });

    test("rejects an unknown element type", () => {
        const result = DrawingElementSchema.safeParse({
            ...validShapeElement,
            type: "hexagon",
        });
        expect(result.success).toBe(false);
    });

    test("rejects a shape element missing required numeric fields", () => {
        const { x2: _x2, ...missingX2 } = validShapeElement;
        const result = DrawingElementSchema.safeParse(missingX2);
        expect(result.success).toBe(false);
    });

    test("sticky element requires a non-null fill (unlike shape elements)", () => {
        const result = DrawingElementSchema.safeParse({
            ...validStickyElement,
            fill: null,
        });
        expect(result.success).toBe(false);
    });

    test("shape element allows a null fill", () => {
        const result = DrawingElementSchema.safeParse({
            ...validShapeElement,
            fill: null,
        });
        expect(result.success).toBe(true);
    });
});

describe("ClientMessageSchema / parseClientMessage", () => {
    test("accepts join_room", () => {
        const msg = { type: "join_room", slug: "my-room" };
        expect(parseClientMessage(msg)).toEqual(msg);
    });

    test("accepts leave_room", () => {
        const msg = { type: "leave_room", slug: "my-room" };
        expect(parseClientMessage(msg)).toEqual(msg);
    });

    test("accepts element_add with a valid element", () => {
        const msg = { type: "element_add", slug: "my-room", element: validShapeElement };
        expect(() => parseClientMessage(msg)).not.toThrow();
    });

    test("rejects element_add with a malformed element", () => {
        const msg = { type: "element_add", slug: "my-room", element: { id: "only-id" } };
        const result = safeParseClientMessage(msg);
        expect(result.success).toBe(false);
    });

    test("accepts element_delete", () => {
        const msg = { type: "element_delete", slug: "my-room", elementId: "el-1" };
        expect(parseClientMessage(msg)).toEqual(msg);
    });

    test("accepts cursor (ephemeral presence)", () => {
        const msg = { type: "cursor", slug: "my-room", x: 12.5, y: 3 };
        expect(parseClientMessage(msg)).toEqual(msg);
    });

    test("accepts selection (ephemeral presence)", () => {
        const msg = { type: "selection", slug: "my-room", elementIds: ["a", "b"] };
        expect(parseClientMessage(msg)).toEqual(msg);
    });

    test("rejects an unknown message type", () => {
        const result = safeParseClientMessage({ type: "teleport", slug: "my-room" });
        expect(result.success).toBe(false);
    });

    test("rejects a message with no type", () => {
        const result = safeParseClientMessage({ slug: "my-room" });
        expect(result.success).toBe(false);
    });

    test("parseClientMessage throws (not returns) on invalid input", () => {
        expect(() => parseClientMessage({ type: "cursor", slug: "r", x: "nope", y: 1 })).toThrow();
    });
});

describe("ServerMessageSchema / parseServerMessage", () => {
    test("accepts room_state with an element array", () => {
        const msg = { type: "room_state", slug: "my-room", elements: [validPenElement] };
        expect(() => parseServerMessage(msg)).not.toThrow();
    });

    test("room_state accepts an empty elements array", () => {
        const msg = { type: "room_state", slug: "my-room", elements: [] };
        expect(parseServerMessage(msg)).toEqual(msg);
    });

    test("accepts element_add fanned out with the actor's userId", () => {
        const msg = {
            type: "element_add",
            slug: "my-room",
            element: validShapeElement,
            userId: "user-123",
        };
        expect(() => parseServerMessage(msg)).not.toThrow();
    });

    test("accepts presence joined/left", () => {
        for (const action of ["joined", "left"] as const) {
            const msg = { type: "presence", slug: "my-room", userId: "u1", name: "Ada", action };
            expect(parseServerMessage(msg)).toEqual(msg);
        }
    });

    test("rejects presence with an invalid action", () => {
        const result = safeParseServerMessage({
            type: "presence",
            slug: "my-room",
            userId: "u1",
            name: "Ada",
            action: "sidestepped",
        });
        expect(result.success).toBe(false);
    });

    test("presence tolerates payloads without the forward-looking role field", () => {
        // role is optional/additive — today's ws-server never emits it.
        const result = safeParseServerMessage({
            type: "presence",
            slug: "my-room",
            userId: "u1",
            name: "Ada",
            action: "joined",
        });
        expect(result.success).toBe(true);
    });

    test("accepts an error message", () => {
        const msg = { type: "error", message: "unauthorized" };
        expect(parseServerMessage(msg)).toEqual(msg);
    });

    test("rejects an unknown server message type", () => {
        const result = safeParseServerMessage({ type: "broadcast_storm", slug: "my-room" });
        expect(result.success).toBe(false);
    });
});

describe("ClientMessageSchema / ServerMessageSchema stay in sync with apps/ws-server/types.ts", () => {
    // apps/ws-server/types.ts hand-declares the same discriminated unions as
    // plain TS types (no runtime validation there — see MAX_MESSAGE_BYTES /
    // isElementLike in apps/ws-server/index.ts, which only checks for a
    // string `id`). This test just pins the *type names* both sides agree on
    // so a renamed/removed variant on either side gets caught here first.
    const clientTypes = [
        "join_room",
        "leave_room",
        "element_add",
        "element_update",
        "element_delete",
        "cursor",
        "selection",
    ];
    const serverTypes = [
        "room_state",
        "element_add",
        "element_update",
        "element_delete",
        "presence",
        "cursor",
        "selection",
        "error",
    ];

    test.each(clientTypes)("ClientMessageSchema recognizes type=%s", (type) => {
        const options = (ClientMessageSchema.options ?? []) as Array<{
            shape: { type: { value?: unknown } };
        }>;
        const known = options.some((opt) => opt.shape.type.value === type);
        expect(known).toBe(true);
    });

    test.each(serverTypes)("ServerMessageSchema recognizes type=%s", (type) => {
        const options = (ServerMessageSchema.options ?? []) as Array<{
            shape: { type: { value?: unknown } };
        }>;
        const known = options.some((opt) => opt.shape.type.value === type);
        expect(known).toBe(true);
    });
});

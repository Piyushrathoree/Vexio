import { z } from "zod";

// Mirrors apps/web/lib/types.ts's DrawingElement union exactly. That file
// remains the source of truth for canvas rendering logic; this module exists
// so both the client and apps/ws-server can validate `element` payloads on
// the wire instead of trusting `unknown`. Do NOT add fields here that aren't
// already in apps/web/lib/types.ts (no width/height, angle, opacity,
// strokeWidth, roughness, backgroundColor, fillStyle — this is a custom
// canvas whiteboard, not Excalidraw).

export const ShapeTypeSchema = z.enum([
    "line",
    "arrow",
    "rect",
    "ellipse",
    "diamond",
    "triangle",
    "star",
]);
export type ShapeType = z.infer<typeof ShapeTypeSchema>;

export const FillableShapeTypeSchema = z.enum([
    "rect",
    "ellipse",
    "diamond",
    "triangle",
    "star",
]);
export type FillableShapeType = z.infer<typeof FillableShapeTypeSchema>;

// Stroke rendering style shared by all stroked shapes. Optional on the wire
// so legacy elements (which never carried it) still deserialize as "solid".
export const StrokeStyleSchema = z.enum(["solid", "dashed"]);
export type StrokeStyle = z.infer<typeof StrokeStyleSchema>;

export const PointSchema = z.object({
    x: z.number(),
    y: z.number(),
});
export type Point = z.infer<typeof PointSchema>;

export const StrokePointSchema = PointSchema.extend({
    t: z.number(),
    pressure: z.number(),
});
export type StrokePoint = z.infer<typeof StrokePointSchema>;

// Fields shared by every element variant (apps/web/lib/types.ts BaseElement).
const baseElementFields = {
    id: z.string(),
    color: z.string(),
    thickness: z.number(),
    strokeStyle: StrokeStyleSchema.optional(),
};

export const ShapeElementSchema = z.object({
    ...baseElementFields,
    type: ShapeTypeSchema,
    x1: z.number(),
    y1: z.number(),
    x2: z.number(),
    y2: z.number(),
    // Nullable (not optional) — matches ShapeElement.fill: string | null.
    fill: z.string().nullable(),
});
export type ShapeElement = z.infer<typeof ShapeElementSchema>;

export const PenElementSchema = z.object({
    ...baseElementFields,
    type: z.literal("pen"),
    points: z.array(StrokePointSchema),
});
export type PenElement = z.infer<typeof PenElementSchema>;

export const TextElementSchema = z.object({
    ...baseElementFields,
    type: z.literal("text"),
    x1: z.number(),
    y1: z.number(),
    x2: z.number(),
    y2: z.number(),
    text: z.string(),
    fontFamily: z.string(),
    fontWeight: z.string().optional(),
    fontStyle: z.string().optional(),
    textDecoration: z.string().optional(),
});
export type TextElement = z.infer<typeof TextElementSchema>;

// A sticky note: a filled, rounded card that also carries editable text. It
// reuses the x1/y1/x2/y2 box the shape/resize/move helpers already
// understand, so it serializes over the wire like any other element.
export const StickyElementSchema = z.object({
    ...baseElementFields,
    type: z.literal("sticky"),
    x1: z.number(),
    y1: z.number(),
    x2: z.number(),
    y2: z.number(),
    text: z.string(),
    // Required (unlike ShapeElement.fill, which is nullable) — matches
    // StickyElement.fill: string.
    fill: z.string(),
    fontFamily: z.string(),
    fontWeight: z.string().optional(),
    fontStyle: z.string().optional(),
    textDecoration: z.string().optional(),
});
export type StickyElement = z.infer<typeof StickyElementSchema>;

// Discriminated union on `type`. Note ShapeElementSchema's `type` is itself a
// sub-enum (7 literals), so we can't pass it directly to z.discriminatedUnion
// alongside the single-literal schemas without zod resolving each shape
// variant's literal individually — z.discriminatedUnion supports this as
// long as each member schema's discriminant key resolves to a
// ZodLiteral/ZodEnum, which ShapeTypeSchema (ZodEnum) satisfies.
export const DrawingElementSchema = z.discriminatedUnion("type", [
    ShapeElementSchema,
    PenElementSchema,
    TextElementSchema,
    StickyElementSchema,
]);
export type DrawingElement = z.infer<typeof DrawingElementSchema>;

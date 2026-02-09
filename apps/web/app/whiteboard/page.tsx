"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };
type StrokePoint = Point & { t: number; pressure: number };
type Tool =
    | "select"
    | "hand"
    | "pen"
    | "eraser"
    | "line"
    | "arrow"
    | "rect"
    | "ellipse"
    | "diamond"
    | "text";

type ShapeType = "line" | "arrow" | "rect" | "ellipse" | "diamond";
type FillableShapeType = "rect" | "ellipse" | "diamond";
type DrawableType = ShapeType | "pen" | "text";

interface BaseElement {
    id: string;
    type: DrawableType;
    color: string;
    thickness: number;
}

interface ShapeElement extends BaseElement {
    type: ShapeType;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    fill: string | null;
}

interface PenElement extends BaseElement {
    type: "pen";
    points: StrokePoint[];
}

interface TextElement extends BaseElement {
    type: "text";
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    text: string;
}

interface ActiveTextEditor {
    x: number;
    y: number;
    screenX: number;
    screenY: number;
    elementId?: string;
    width?: number;
    height?: number;
    text: string;
    color: string;
    thickness: number;
}

type DrawingElement = ShapeElement | PenElement | TextElement;

type PointerMode = "drawing" | "panning" | "moving" | "resizing" | "erasing";
type ResizeHandle =
    | "start"
    | "end"
    | "n"
    | "ne"
    | "e"
    | "se"
    | "s"
    | "sw"
    | "w"
    | "nw";

interface ResizeHandleDescriptor {
    id: ResizeHandle;
    point: Point;
    cursorClass: string;
}

interface PointerState {
    mode: PointerMode;
    pointerId: number;
    lastWorld: Point;
    lastScreen: Point;
    elementId?: string;
    resizeHandle?: ResizeHandle;
    originElement?: DrawingElement;
}

const TOOLBAR_TOOLS: Array<{ id: Tool; label: string }> = [
    { id: "select", label: "Select" },
    { id: "hand", label: "Hand" },
    { id: "pen", label: "Pen" },
    { id: "eraser", label: "Eraser" },
    { id: "line", label: "Line" },
    { id: "arrow", label: "Arrow" },
    { id: "rect", label: "Rectangle" },
    { id: "ellipse", label: "Ellipse" },
    { id: "diamond", label: "Diamond" },
    { id: "text", label: "Text" },
];

const COLOR_PALETTE = [
    "#111827",
    "#ef4444",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#9333ea",
    "#ec4899",
    "#ffffff",
];

const FILL_ALPHA = 0.2;
const RESIZE_HANDLE_HIT_RADIUS = 10;
const TEXT_PADDING_X = 6;
const TEXT_PADDING_Y = 4;
const TEXT_FONT_RATIO = 0.82;
const TEXT_FONT_FAMILY = `"Comic Sans MS", "Segoe Print", "Bradley Hand", cursive`;

const distance = (a: Point, b: Point): number => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
};

const clamp = (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, value));
};

const isFillableShapeType = (
    shapeType: ShapeType
): shapeType is FillableShapeType => {
    return (
        shapeType === "rect" ||
        shapeType === "ellipse" ||
        shapeType === "diamond"
    );
};

const isFillableShape = (
    el: DrawingElement
): el is ShapeElement & { type: FillableShapeType } => {
    return el.type === "rect" || el.type === "ellipse" || el.type === "diamond";
};

const toFillColor = (hexColor: string, alpha: number): string => {
    const normalized = hexColor.trim();
    if (!normalized.startsWith("#")) {
        return hexColor;
    }

    const raw = normalized.slice(1);
    const expanded =
        raw.length === 3
            ? raw
                  .split("")
                  .map((part) => `${part}${part}`)
                  .join("")
            : raw;

    if (expanded.length !== 6 || Number.isNaN(Number.parseInt(expanded, 16))) {
        return hexColor;
    }

    const red = Number.parseInt(expanded.slice(0, 2), 16);
    const green = Number.parseInt(expanded.slice(2, 4), 16);
    const blue = Number.parseInt(expanded.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const splitTextLines = (text: string): string[] => {
    return text.replace(/\r\n/g, "\n").split("\n");
};

const getTextBaseSize = (thickness: number): number => {
    return clamp(14 + thickness * 2, 14, 42);
};

const estimateTextBounds = (
    text: string,
    thickness: number
): { width: number; height: number } => {
    const lines = splitTextLines(text);
    const maxChars = lines.reduce((max, line) => Math.max(max, line.length), 1);
    const baseSize = getTextBaseSize(thickness);
    const lineHeight = baseSize * 1.28;
    return {
        width:
            Math.max(baseSize * 1.2, maxChars * baseSize * 0.62) +
            TEXT_PADDING_X * 2,
        height:
            Math.max(lineHeight, lines.length * lineHeight) +
            TEXT_PADDING_Y * 2,
    };
};

const toStrokePoint = (
    world: Point,
    event: React.PointerEvent<HTMLCanvasElement>
): StrokePoint => {
    const fallbackPressure = event.pointerType === "pen" ? 0.55 : 0.45;
    const pressure = event.pressure > 0 ? event.pressure : fallbackPressure;
    return {
        x: world.x,
        y: world.y,
        t: event.timeStamp,
        pressure: clamp(pressure, 0.1, 1),
    };
};

const smoothStrokePoint = (
    last: StrokePoint,
    next: StrokePoint
): StrokePoint => {
    const step = distance(last, next);
    const blend = step < 3 ? 0.45 : 0.7;
    return {
        x: last.x + (next.x - last.x) * blend,
        y: last.y + (next.y - last.y) * blend,
        t: next.t,
        pressure: last.pressure * 0.3 + next.pressure * 0.7,
    };
};

const PEN_BASE_THICKNESS_BOOST = 1.22;
const PEN_MIN_WIDTH_MULTIPLIER = 0.74;
const PEN_MAX_WIDTH_MULTIPLIER = 1.16;

const getSegmentWidth = (
    previous: StrokePoint,
    current: StrokePoint,
    baseThickness: number
): number => {
    const dt = Math.max(1, current.t - previous.t);
    const speed = distance(previous, current) / dt;
    const speedFactor = clamp(speed * 0.9, 0, 1);
    const pressureFactor = (previous.pressure + current.pressure) * 0.5;
    const dynamicFactor = 0.8 + pressureFactor * 0.34 - speedFactor * 0.2;
    const width = baseThickness * PEN_BASE_THICKNESS_BOOST * dynamicFactor;
    return clamp(
        width,
        baseThickness * PEN_MIN_WIDTH_MULTIPLIER,
        baseThickness * PEN_MAX_WIDTH_MULTIPLIER
    );
};

const distanceToSegment = (p: Point, a: Point, b: Point): number => {
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const wx = p.x - a.x;
    const wy = p.y - a.y;
    const lenSq = vx * vx + vy * vy;

    if (lenSq === 0) {
        return distance(p, a);
    }

    const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / lenSq));
    const projection = { x: a.x + t * vx, y: a.y + t * vy };
    return distance(p, projection);
};

const normalizeRect = (el: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}) => {
    const minX = Math.min(el.x1, el.x2);
    const minY = Math.min(el.y1, el.y2);
    const maxX = Math.max(el.x1, el.x2);
    const maxY = Math.max(el.y1, el.y2);
    return {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX,
        height: maxY - minY,
    };
};

const getElementBounds = (el: DrawingElement) => {
    if (el.type === "pen") {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const p of el.points) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }

        return { minX, minY, maxX, maxY };
    }

    const { minX, minY, maxX, maxY } = normalizeRect(el);
    return { minX, minY, maxX, maxY };
};

const getResizeHandleAtPoint = (
    point: Point,
    el: DrawingElement
): ResizeHandleDescriptor | null => {
    if (el.type === "line" || el.type === "arrow") {
        if (!isPointNearElement(point, el, RESIZE_HANDLE_HIT_RADIUS)) {
            return null;
        }

        const startPoint = { x: el.x1, y: el.y1 };
        const endPoint = { x: el.x2, y: el.y2 };
        const startDistance = distance(point, startPoint);
        const endDistance = distance(point, endPoint);
        const nearest =
            startDistance <= endDistance
                ? { id: "start" as const, point: startPoint }
                : { id: "end" as const, point: endPoint };
        return {
            id: nearest.id,
            point: nearest.point,
            cursorClass: "cursor-move",
        };
    }

    const { minX, minY, maxX, maxY } = getElementBounds(el);
    const tolerance = RESIZE_HANDLE_HIT_RADIUS;
    const nearLeft = Math.abs(point.x - minX) <= tolerance;
    const nearRight = Math.abs(point.x - maxX) <= tolerance;
    const nearTop = Math.abs(point.y - minY) <= tolerance;
    const nearBottom = Math.abs(point.y - maxY) <= tolerance;
    const withinVertical =
        point.y >= minY - tolerance && point.y <= maxY + tolerance;
    const withinHorizontal =
        point.x >= minX - tolerance && point.x <= maxX + tolerance;

    if (nearTop && nearLeft) {
        return {
            id: "nw",
            point: { x: minX, y: minY },
            cursorClass: "cursor-nwse-resize",
        };
    }

    if (nearTop && nearRight) {
        return {
            id: "ne",
            point: { x: maxX, y: minY },
            cursorClass: "cursor-nesw-resize",
        };
    }

    if (nearBottom && nearRight) {
        return {
            id: "se",
            point: { x: maxX, y: maxY },
            cursorClass: "cursor-nwse-resize",
        };
    }

    if (nearBottom && nearLeft) {
        return {
            id: "sw",
            point: { x: minX, y: maxY },
            cursorClass: "cursor-nesw-resize",
        };
    }

    if (nearTop && withinHorizontal) {
        return {
            id: "n",
            point: { x: (minX + maxX) * 0.5, y: minY },
            cursorClass: "cursor-ns-resize",
        };
    }

    if (nearBottom && withinHorizontal) {
        return {
            id: "s",
            point: { x: (minX + maxX) * 0.5, y: maxY },
            cursorClass: "cursor-ns-resize",
        };
    }

    if (nearRight && withinVertical) {
        return {
            id: "e",
            point: { x: maxX, y: (minY + maxY) * 0.5 },
            cursorClass: "cursor-ew-resize",
        };
    }

    if (nearLeft && withinVertical) {
        return {
            id: "w",
            point: { x: minX, y: (minY + maxY) * 0.5 },
            cursorClass: "cursor-ew-resize",
        };
    }

    return null;
};

const mapAxisCoordinate = (
    value: number,
    fromStart: number,
    fromEnd: number,
    toStart: number,
    toEnd: number
): number => {
    const fromSize = fromEnd - fromStart;
    if (Math.abs(fromSize) < 0.00001) {
        return value + (toStart - fromStart);
    }

    const ratio = (value - fromStart) / fromSize;
    return toStart + ratio * (toEnd - toStart);
};

const scaleElementToBounds = (
    el: DrawingElement,
    fromBounds: { minX: number; minY: number; maxX: number; maxY: number },
    toBounds: { minX: number; minY: number; maxX: number; maxY: number }
): DrawingElement => {
    const mapX = (value: number) =>
        mapAxisCoordinate(
            value,
            fromBounds.minX,
            fromBounds.maxX,
            toBounds.minX,
            toBounds.maxX
        );
    const mapY = (value: number) =>
        mapAxisCoordinate(
            value,
            fromBounds.minY,
            fromBounds.maxY,
            toBounds.minY,
            toBounds.maxY
        );

    if (el.type === "pen") {
        return {
            ...el,
            points: el.points.map((point) => ({
                ...point,
                x: mapX(point.x),
                y: mapY(point.y),
            })),
        };
    }

    return {
        ...el,
        x1: mapX(el.x1),
        y1: mapY(el.y1),
        x2: mapX(el.x2),
        y2: mapY(el.y2),
    };
};

const resizeElementFromHandle = (
    initialElement: DrawingElement,
    handle: ResizeHandle,
    pointer: Point
): DrawingElement => {
    if (
        (handle === "start" || handle === "end") &&
        (initialElement.type === "line" || initialElement.type === "arrow")
    ) {
        if (handle === "start") {
            return {
                ...initialElement,
                x1: pointer.x,
                y1: pointer.y,
            };
        }

        return {
            ...initialElement,
            x2: pointer.x,
            y2: pointer.y,
        };
    }

    const initialBounds = getElementBounds(initialElement);
    let nextMinX = initialBounds.minX;
    let nextMinY = initialBounds.minY;
    let nextMaxX = initialBounds.maxX;
    let nextMaxY = initialBounds.maxY;

    switch (handle) {
        case "n": {
            nextMinY = pointer.y;
            break;
        }
        case "ne": {
            nextMinY = pointer.y;
            nextMaxX = pointer.x;
            break;
        }
        case "e": {
            nextMaxX = pointer.x;
            break;
        }
        case "se": {
            nextMaxX = pointer.x;
            nextMaxY = pointer.y;
            break;
        }
        case "s": {
            nextMaxY = pointer.y;
            break;
        }
        case "sw": {
            nextMinX = pointer.x;
            nextMaxY = pointer.y;
            break;
        }
        case "w": {
            nextMinX = pointer.x;
            break;
        }
        case "nw": {
            nextMinX = pointer.x;
            nextMinY = pointer.y;
            break;
        }
        default: {
            break;
        }
    }

    return scaleElementToBounds(initialElement, initialBounds, {
        minX: nextMinX,
        minY: nextMinY,
        maxX: nextMaxX,
        maxY: nextMaxY,
    });
};

const isPointNearElement = (
    point: Point,
    el: DrawingElement,
    tolerance = 8
): boolean => {
    const threshold = Math.max(tolerance, el.thickness * 1.5);

    if (el.type === "text") {
        const { minX, minY, maxX, maxY } = normalizeRect(el);
        return (
            point.x >= minX - threshold &&
            point.x <= maxX + threshold &&
            point.y >= minY - threshold &&
            point.y <= maxY + threshold
        );
    }

    if (el.type === "line" || el.type === "arrow") {
        return (
            distanceToSegment(
                point,
                { x: el.x1, y: el.y1 },
                { x: el.x2, y: el.y2 }
            ) <= threshold
        );
    }

    if (el.type === "rect") {
        const { minX, minY, maxX, maxY } = normalizeRect(el);
        if (
            point.x >= minX &&
            point.x <= maxX &&
            point.y >= minY &&
            point.y <= maxY
        ) {
            return true;
        }

        return (
            distanceToSegment(
                point,
                { x: minX, y: minY },
                { x: maxX, y: minY }
            ) <= threshold ||
            distanceToSegment(
                point,
                { x: maxX, y: minY },
                { x: maxX, y: maxY }
            ) <= threshold ||
            distanceToSegment(
                point,
                { x: maxX, y: maxY },
                { x: minX, y: maxY }
            ) <= threshold ||
            distanceToSegment(
                point,
                { x: minX, y: maxY },
                { x: minX, y: minY }
            ) <= threshold
        );
    }

    if (el.type === "diamond") {
        const cx = (el.x1 + el.x2) / 2;
        const cy = (el.y1 + el.y2) / 2;
        const halfWidth = Math.abs(el.x2 - el.x1) / 2;
        const halfHeight = Math.abs(el.y2 - el.y1) / 2;

        if (halfWidth > 0 && halfHeight > 0) {
            const normalizedX = Math.abs((point.x - cx) / halfWidth);
            const normalizedY = Math.abs((point.y - cy) / halfHeight);
            if (normalizedX + normalizedY <= 1) {
                return true;
            }
        }

        const points: Point[] = [
            { x: cx, y: Math.min(el.y1, el.y2) },
            { x: Math.max(el.x1, el.x2), y: cy },
            { x: cx, y: Math.max(el.y1, el.y2) },
            { x: Math.min(el.x1, el.x2), y: cy },
        ];

        return points.some((p, i) => {
            const next = points[(i + 1) % points.length];
            if (!next) return false;
            return distanceToSegment(point, p, next) <= threshold;
        });
    }

    if (el.type === "ellipse") {
        const { minX, minY, width, height } = normalizeRect(el);
        if (width < 2 || height < 2) {
            return false;
        }

        const cx = minX + width / 2;
        const cy = minY + height / 2;
        const rx = width / 2;
        const ry = height / 2;
        const dx = (point.x - cx) / rx;
        const dy = (point.y - cy) / ry;
        const value = Math.sqrt(dx * dx + dy * dy);
        if (value <= 1) {
            return true;
        }

        const ring = threshold / Math.max(4, Math.min(rx, ry));
        return Math.abs(value - 1) <= ring;
    }

    if (el.type !== "pen") {
        return false;
    }

    for (let i = 0; i < el.points.length - 1; i += 1) {
        const p1 = el.points[i];
        const p2 = el.points[i + 1];

        if (p1 && p2 && distanceToSegment(point, p1, p2) <= threshold) {
            return true;
        }
    }

    return false;
};

const drawShape = (ctx: CanvasRenderingContext2D, el: ShapeElement): void => {
    ctx.beginPath();

    switch (el.type) {
        case "line": {
            ctx.moveTo(el.x1, el.y1);
            ctx.lineTo(el.x2, el.y2);
            break;
        }
        case "arrow": {
            ctx.moveTo(el.x1, el.y1);
            ctx.lineTo(el.x2, el.y2);

            const angle = Math.atan2(el.y2 - el.y1, el.x2 - el.x1);
            const headLength = Math.max(10, el.thickness * 3.5);
            const left = {
                x: el.x2 - headLength * Math.cos(angle - Math.PI / 7),
                y: el.y2 - headLength * Math.sin(angle - Math.PI / 7),
            };
            const right = {
                x: el.x2 - headLength * Math.cos(angle + Math.PI / 7),
                y: el.y2 - headLength * Math.sin(angle + Math.PI / 7),
            };

            ctx.moveTo(el.x2, el.y2);
            ctx.lineTo(left.x, left.y);
            ctx.moveTo(el.x2, el.y2);
            ctx.lineTo(right.x, right.y);
            break;
        }
        case "rect": {
            const { minX, minY, width, height } = normalizeRect(el);
            ctx.rect(minX, minY, width, height);
            break;
        }
        case "ellipse": {
            const { minX, minY, width, height } = normalizeRect(el);
            ctx.ellipse(
                minX + width / 2,
                minY + height / 2,
                Math.max(1, width / 2),
                Math.max(1, height / 2),
                0,
                0,
                Math.PI * 2
            );
            break;
        }
        case "diamond": {
            const cx = (el.x1 + el.x2) / 2;
            const cy = (el.y1 + el.y2) / 2;
            const topY = Math.min(el.y1, el.y2);
            const bottomY = Math.max(el.y1, el.y2);
            const leftX = Math.min(el.x1, el.x2);
            const rightX = Math.max(el.x1, el.x2);

            ctx.moveTo(cx, topY);
            ctx.lineTo(rightX, cy);
            ctx.lineTo(cx, bottomY);
            ctx.lineTo(leftX, cy);
            ctx.closePath();
            break;
        }
        default: {
            break;
        }
    }

    if (el.fill && isFillableShapeType(el.type)) {
        ctx.fillStyle = el.fill;
        ctx.fill();
    }

    ctx.stroke();
};

const drawTextElement = (
    ctx: CanvasRenderingContext2D,
    el: TextElement
): void => {
    const { minX, minY, width, height } = normalizeRect(el);
    if (width < 2 || height < 2) {
        return;
    }

    const lines = splitTextLines(el.text);
    const lineCount = Math.max(1, lines.length);
    const contentWidth = Math.max(1, width - TEXT_PADDING_X * 2);
    const contentHeight = Math.max(1, height - TEXT_PADDING_Y * 2);
    const lineHeight = contentHeight / lineCount;
    const fontSize = Math.max(10, lineHeight * TEXT_FONT_RATIO);

    ctx.save();
    ctx.fillStyle = el.color;
    ctx.font = `${fontSize}px ${TEXT_FONT_FAMILY}`;
    ctx.textBaseline = "top";

    for (let i = 0; i < lineCount; i += 1) {
        const line = lines[i] ?? "";
        const measuredWidth = Math.max(1, ctx.measureText(line || " ").width);
        const horizontalScale = Math.min(1, contentWidth / measuredWidth);
        ctx.save();
        ctx.translate(
            minX + TEXT_PADDING_X,
            minY + TEXT_PADDING_Y + i * lineHeight
        );
        ctx.scale(horizontalScale, 1);
        ctx.fillText(line, 0, 0);
        ctx.restore();
    }

    ctx.restore();
};

const drawElement = (
    ctx: CanvasRenderingContext2D,
    el: DrawingElement
): void => {
    ctx.strokeStyle = el.color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (el.type === "text") {
        drawTextElement(ctx, el);
        return;
    }

    if (el.type === "pen") {
        if (el.points.length === 0) {
            return;
        }

        if (el.points.length === 1) {
            const point = el.points[0];
            if (!point) return;
            ctx.beginPath();
            ctx.fillStyle = el.color;
            ctx.arc(
                point.x,
                point.y,
                Math.max(1.4, el.thickness * 0.5),
                0,
                Math.PI * 2
            );
            ctx.fill();
            return;
        }

        const points = el.points;
        let previousWidth = el.thickness * 0.95;
        for (let i = 1; i < points.length; i += 1) {
            const previous = points[i - 1];
            const current = points[i];
            const next = points[i + 1] ?? current;

            if (!previous || !current || !next) {
                continue;
            }
            const start = {
                x: (previous.x + current.x) * 0.5,
                y: (previous.y + current.y) * 0.5,
            };
            const end = {
                x: (current.x + next.x) * 0.5,
                y: (current.y + next.y) * 0.5,
            };

            const targetWidth = getSegmentWidth(
                previous,
                current,
                el.thickness
            );
            const segmentWidth = previousWidth * 0.65 + targetWidth * 0.35;
            previousWidth = segmentWidth;
            ctx.lineWidth = segmentWidth;
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.quadraticCurveTo(current.x, current.y, end.x, end.y);
            ctx.stroke();
        }

        return;
    }

    ctx.lineWidth = el.thickness;
    drawShape(ctx, el);
};

const moveElement = (
    el: DrawingElement,
    deltaX: number,
    deltaY: number
): DrawingElement => {
    if (el.type === "pen") {
        return {
            ...el,
            points: el.points.map((p) => ({
                ...p,
                x: p.x + deltaX,
                y: p.y + deltaY,
            })),
        };
    }

    return {
        ...el,
        x1: el.x1 + deltaX,
        y1: el.y1 + deltaY,
        x2: el.x2 + deltaX,
        y2: el.y2 + deltaY,
    };
};

const buildId = (): string => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const buildTextElement = (
    position: Point,
    text: string,
    color: string,
    thickness: number
): TextElement => {
    const { width, height } = estimateTextBounds(text, thickness);
    return {
        id: buildId(),
        type: "text",
        color,
        thickness,
        text,
        x1: position.x,
        y1: position.y,
        x2: position.x + width,
        y2: position.y + height,
    };
};

const minDrawableSize = 2;

export default function Home() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const textInputRef = useRef<HTMLTextAreaElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const panRef = useRef<Point>({ x: 0, y: 0 });
    const elementsRef = useRef<DrawingElement[]>([]);
    const draftRef = useRef<DrawingElement | null>(null);
    const pointerStateRef = useRef<PointerState | null>(null);
    const selectedIdRef = useRef<string | null>(null);
    const textEditorRef = useRef<ActiveTextEditor | null>(null);

    const [tool, setTool] = useState<Tool>("select");
    const [color, setColor] = useState<string>(COLOR_PALETTE[0] ?? "#000000");
    const [thickness, setThickness] = useState<number>(3);
    const [fillDropperActive, setFillDropperActive] = useState<boolean>(false);
    const [hoverCursorClass, setHoverCursorClass] = useState<string | null>(
        null
    );
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [textEditor, setTextEditor] = useState<ActiveTextEditor | null>(null);

    useEffect(() => {
        selectedIdRef.current = selectedId;
    }, [selectedId]);

    useEffect(() => {
        textEditorRef.current = textEditor;
    }, [textEditor]);

    const scheduleDraw = useCallback(() => {
        if (rafRef.current !== null) {
            return;
        }

        rafRef.current = window.requestAnimationFrame(() => {
            rafRef.current = null;
            const canvas = canvasRef.current;
            if (!canvas) {
                return;
            }

            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const nextWidth = Math.round(rect.width * dpr);
            const nextHeight = Math.round(rect.height * dpr);

            if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
                canvas.width = nextWidth;
                canvas.height = nextHeight;
            }

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                return;
            }

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.fillStyle = "#f6f7fb";
            ctx.fillRect(0, 0, rect.width, rect.height);

            const grid = 24;
            const pan = panRef.current;
            const offsetX = ((pan.x % grid) + grid) % grid;
            const offsetY = ((pan.y % grid) + grid) % grid;
            ctx.strokeStyle = "rgba(15, 23, 42, 0.08)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let x = offsetX; x <= rect.width; x += grid) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, rect.height);
            }
            for (let y = offsetY; y <= rect.height; y += grid) {
                ctx.moveTo(0, y);
                ctx.lineTo(rect.width, y);
            }
            ctx.stroke();

            ctx.save();
            ctx.translate(pan.x, pan.y);
            const editingElementId = textEditorRef.current?.elementId ?? null;

            for (const el of elementsRef.current) {
                if (editingElementId && el.id === editingElementId) {
                    continue;
                }
                drawElement(ctx, el);
            }

            if (draftRef.current) {
                drawElement(ctx, draftRef.current);
            }

            if (selectedIdRef.current) {
                const selectedElement = elementsRef.current.find(
                    (el) => el.id === selectedIdRef.current
                );

                if (
                    selectedElement &&
                    selectedElement.id !== editingElementId
                ) {
                    const { minX, minY, maxX, maxY } =
                        getElementBounds(selectedElement);
                    ctx.setLineDash([6, 4]);
                    ctx.strokeStyle = "#2563eb";
                    ctx.lineWidth = 1;
                    ctx.strokeRect(
                        minX - 6,
                        minY - 6,
                        maxX - minX + 12,
                        maxY - minY + 12
                    );
                    ctx.setLineDash([]);
                }
            }

            ctx.restore();
        });
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        scheduleDraw();

        const observer = new ResizeObserver(() => {
            scheduleDraw();
        });
        observer.observe(canvas);

        return () => {
            observer.disconnect();
            if (rafRef.current !== null) {
                window.cancelAnimationFrame(rafRef.current);
            }
        };
    }, [scheduleDraw]);

    useEffect(() => {
        scheduleDraw();
    }, [tool, color, thickness, selectedId, scheduleDraw]);

    const getPoints = useCallback(
        (event: React.PointerEvent<HTMLCanvasElement>) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const screen = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
            };
            const world = {
                x: screen.x - panRef.current.x,
                y: screen.y - panRef.current.y,
            };
            return { world, screen };
        },
        []
    );

    const getElementAtPoint = useCallback(
        (point: Point): DrawingElement | null => {
            const elements = elementsRef.current;
            for (let i = elements.length - 1; i >= 0; i -= 1) {
                const el = elements[i];
                if (el && isPointNearElement(point, el)) {
                    return el;
                }
            }
            return null;
        },
        []
    );

    const startTextEditor = useCallback((nextEditor: ActiveTextEditor) => {
        setTextEditor(nextEditor);
        window.requestAnimationFrame(() => {
            const input = textInputRef.current;
            if (!input) {
                return;
            }

            input.focus();
            const length = input.value.length;
            input.setSelectionRange(length, length);
        });
    }, []);

    const openTextEditorForElement = useCallback(
        (el: TextElement) => {
            const { minX, minY, width, height } = normalizeRect(el);
            const pan = panRef.current;
            startTextEditor({
                x: minX,
                y: minY,
                screenX: minX + pan.x,
                screenY: minY + pan.y,
                elementId: el.id,
                width,
                height,
                text: el.text,
                color: el.color,
                thickness: el.thickness,
            });
            selectedIdRef.current = el.id;
            setSelectedId(el.id);
            setHoverCursorClass(null);
            setFillDropperActive(false);
        },
        [startTextEditor]
    );

    const eraseAtPoint = useCallback(
        (point: Point) => {
            const index = [...elementsRef.current]
                .map((el, i) => ({ el, i }))
                .reverse()
                .find(({ el }) => isPointNearElement(point, el, 14))?.i;

            if (index === undefined) {
                return;
            }

            const next = [...elementsRef.current];
            const [removed] = next.splice(index, 1);
            elementsRef.current = next;

            if (removed && removed.id === selectedIdRef.current) {
                selectedIdRef.current = null;
                setSelectedId(null);
            }
        },
        [setSelectedId]
    );

    const commitTextEditor = useCallback(
        (switchToSelect = false) => {
            const activeEditor = textEditorRef.current;
            if (!activeEditor) {
                if (switchToSelect) {
                    setTool("select");
                    setHoverCursorClass(null);
                }
                return;
            }

            const normalizedText = activeEditor.text.replace(/\r\n/g, "\n");
            const hasText = normalizedText.trim().length > 0;

            if (activeEditor.elementId) {
                const existingElement = elementsRef.current.find(
                    (el) => el.id === activeEditor.elementId
                );

                if (existingElement?.type === "text") {
                    if (!hasText) {
                        elementsRef.current = elementsRef.current.filter(
                            (el) => el.id !== activeEditor.elementId
                        );
                        if (selectedIdRef.current === activeEditor.elementId) {
                            selectedIdRef.current = null;
                            setSelectedId(null);
                        }
                    } else {
                        const nextWidth =
                            activeEditor.width ??
                            Math.abs(existingElement.x2 - existingElement.x1);
                        const nextHeight =
                            activeEditor.height ??
                            Math.abs(existingElement.y2 - existingElement.y1);

                        elementsRef.current = elementsRef.current.map((el) => {
                            if (
                                el.id !== activeEditor.elementId ||
                                el.type !== "text"
                            ) {
                                return el;
                            }

                            return {
                                ...el,
                                text: normalizedText,
                                color: activeEditor.color,
                                thickness: activeEditor.thickness,
                                x1: activeEditor.x,
                                y1: activeEditor.y,
                                x2: activeEditor.x + nextWidth,
                                y2: activeEditor.y + nextHeight,
                            };
                        });
                        selectedIdRef.current = activeEditor.elementId;
                        setSelectedId(activeEditor.elementId);
                    }
                }
            } else if (hasText) {
                const textElement = buildTextElement(
                    { x: activeEditor.x, y: activeEditor.y },
                    normalizedText,
                    activeEditor.color,
                    activeEditor.thickness
                );
                elementsRef.current = [...elementsRef.current, textElement];
                selectedIdRef.current = textElement.id;
                setSelectedId(textElement.id);
            }

            setTextEditor(null);
            if (switchToSelect) {
                setTool("select");
                setHoverCursorClass(null);
            }
            scheduleDraw();
        },
        [scheduleDraw]
    );

    const cancelTextEditor = useCallback(
        (switchToSelect = false) => {
            if (!textEditorRef.current) {
                if (switchToSelect) {
                    setTool("select");
                    setHoverCursorClass(null);
                }
                return;
            }

            setTextEditor(null);
            if (switchToSelect) {
                setTool("select");
                setHoverCursorClass(null);
            }
            scheduleDraw();
        },
        [scheduleDraw]
    );

    const toggleFill = useCallback(() => {
        commitTextEditor(false);
        setTool("select");
        setHoverCursorClass(null);
        setFillDropperActive((prev) => !prev);
    }, [commitTextEditor]);

    const handlePointerDown = useCallback(
        (event: React.PointerEvent<HTMLCanvasElement>) => {
            event.preventDefault();
            const canvas = event.currentTarget;
            const { world, screen } = getPoints(event);

            if (textEditorRef.current && tool !== "text") {
                commitTextEditor(false);
            }

            if (fillDropperActive) {
                const target = getElementAtPoint(world);
                if (target && isFillableShape(target)) {
                    const fillColor = toFillColor(color, FILL_ALPHA);
                    elementsRef.current = elementsRef.current.map((el) => {
                        if (el.id === target.id && isFillableShape(el)) {
                            return { ...el, fill: fillColor };
                        }
                        return el;
                    });
                    selectedIdRef.current = target.id;
                    setSelectedId(target.id);
                    setFillDropperActive(false);
                    scheduleDraw();
                }

                return;
            }

            if (tool === "text") {
                commitTextEditor(false);
                pointerStateRef.current = null;
                setHoverCursorClass(null);
                setFillDropperActive(false);

                const target = getElementAtPoint(world);
                if (target?.type === "text") {
                    openTextEditorForElement(target);
                    scheduleDraw();
                    return;
                }

                selectedIdRef.current = null;
                setSelectedId(null);
                startTextEditor({
                    x: world.x,
                    y: world.y,
                    screenX: screen.x,
                    screenY: screen.y,
                    text: "",
                    color,
                    thickness,
                });
                return;
            }

            canvas.setPointerCapture(event.pointerId);

            if (tool === "hand") {
                pointerStateRef.current = {
                    mode: "panning",
                    pointerId: event.pointerId,
                    lastWorld: world,
                    lastScreen: screen,
                };
                return;
            }

            if (tool === "eraser") {
                eraseAtPoint(world);
                pointerStateRef.current = {
                    mode: "erasing",
                    pointerId: event.pointerId,
                    lastWorld: world,
                    lastScreen: screen,
                };
                scheduleDraw();
                return;
            }

            if (tool === "select") {
                const selectedElementId = selectedIdRef.current;
                const selectedElement = selectedElementId
                    ? (elementsRef.current.find(
                          (el) => el.id === selectedElementId
                      ) ?? null)
                    : null;

                if (selectedElement) {
                    const resizeHandle = getResizeHandleAtPoint(
                        world,
                        selectedElement
                    );
                    if (resizeHandle) {
                        pointerStateRef.current = {
                            mode: "resizing",
                            pointerId: event.pointerId,
                            lastWorld: world,
                            lastScreen: screen,
                            elementId: selectedElement.id,
                            resizeHandle: resizeHandle.id,
                            originElement: selectedElement,
                        };
                        setHoverCursorClass(resizeHandle.cursorClass);
                        scheduleDraw();
                        return;
                    }
                }

                const target = getElementAtPoint(world);

                if (target) {
                    selectedIdRef.current = target.id;
                    setSelectedId(target.id);
                    pointerStateRef.current = {
                        mode: "moving",
                        pointerId: event.pointerId,
                        lastWorld: world,
                        lastScreen: screen,
                        elementId: target.id,
                    };
                } else {
                    selectedIdRef.current = null;
                    setSelectedId(null);
                    pointerStateRef.current = null;
                    setHoverCursorClass(null);
                }

                scheduleDraw();
                return;
            }

            if (tool === "pen") {
                const initialPoint = toStrokePoint(world, event);
                draftRef.current = {
                    id: buildId(),
                    type: "pen",
                    color,
                    thickness,
                    points: [initialPoint],
                };
            } else {
                const shapeType = tool as ShapeType;
                draftRef.current = {
                    id: buildId(),
                    type: shapeType,
                    color,
                    thickness,
                    fill: null,
                    x1: world.x,
                    y1: world.y,
                    x2: world.x,
                    y2: world.y,
                } as ShapeElement;
            }

            pointerStateRef.current = {
                mode: "drawing",
                pointerId: event.pointerId,
                lastWorld: world,
                lastScreen: screen,
            };
            selectedIdRef.current = null;
            setSelectedId(null);
            setHoverCursorClass(null);
            setFillDropperActive(false);
            scheduleDraw();
        },
        [
            color,
            commitTextEditor,
            eraseAtPoint,
            fillDropperActive,
            getElementAtPoint,
            getPoints,
            openTextEditorForElement,
            scheduleDraw,
            startTextEditor,
            thickness,
            tool,
        ]
    );

    const handleDoubleClick = useCallback(
        (event: React.MouseEvent<HTMLCanvasElement>) => {
            if (fillDropperActive) {
                return;
            }

            const rect = event.currentTarget.getBoundingClientRect();
            const world = {
                x: event.clientX - rect.left - panRef.current.x,
                y: event.clientY - rect.top - panRef.current.y,
            };
            const target = getElementAtPoint(world);
            if (target?.type !== "text") {
                return;
            }

            event.preventDefault();
            commitTextEditor(false);
            pointerStateRef.current = null;
            openTextEditorForElement(target);
            scheduleDraw();
        },
        [
            commitTextEditor,
            fillDropperActive,
            getElementAtPoint,
            openTextEditorForElement,
            scheduleDraw,
        ]
    );

    const handlePointerMove = useCallback(
        (event: React.PointerEvent<HTMLCanvasElement>) => {
            const { world, screen } = getPoints(event);
            const pointer = pointerStateRef.current;
            if (!pointer || pointer.pointerId !== event.pointerId) {
                if (tool === "select" && !fillDropperActive) {
                    const selectedElementId = selectedIdRef.current;
                    const selectedElement = selectedElementId
                        ? (elementsRef.current.find(
                              (el) => el.id === selectedElementId
                          ) ?? null)
                        : null;
                    const hoverHandle = selectedElement
                        ? getResizeHandleAtPoint(world, selectedElement)
                        : null;
                    const cursorClass = hoverHandle?.cursorClass ?? null;
                    setHoverCursorClass((current) =>
                        current === cursorClass ? current : cursorClass
                    );
                }
                return;
            }

            if (pointer.mode === "panning") {
                panRef.current = {
                    x: panRef.current.x + (screen.x - pointer.lastScreen.x),
                    y: panRef.current.y + (screen.y - pointer.lastScreen.y),
                };
                pointerStateRef.current = {
                    ...pointer,
                    lastScreen: screen,
                    lastWorld: world,
                };
                scheduleDraw();
                return;
            }

            if (pointer.mode === "erasing") {
                eraseAtPoint(world);
                pointerStateRef.current = {
                    ...pointer,
                    lastScreen: screen,
                    lastWorld: world,
                };
                scheduleDraw();
                return;
            }

            if (
                pointer.mode === "resizing" &&
                pointer.elementId &&
                pointer.resizeHandle &&
                pointer.originElement
            ) {
                const resizedElement = resizeElementFromHandle(
                    pointer.originElement,
                    pointer.resizeHandle,
                    world
                );
                elementsRef.current = elementsRef.current.map((el) =>
                    el.id === pointer.elementId ? resizedElement : el
                );
                pointerStateRef.current = {
                    ...pointer,
                    lastWorld: world,
                    lastScreen: screen,
                };
                scheduleDraw();
                return;
            }

            if (pointer.mode === "moving" && pointer.elementId) {
                const dx = world.x - pointer.lastWorld.x;
                const dy = world.y - pointer.lastWorld.y;

                if (dx !== 0 || dy !== 0) {
                    elementsRef.current = elementsRef.current.map((el) =>
                        el.id === pointer.elementId
                            ? moveElement(el, dx, dy)
                            : el
                    );
                    pointerStateRef.current = {
                        ...pointer,
                        lastWorld: world,
                        lastScreen: screen,
                    };
                    scheduleDraw();
                }

                return;
            }

            if (pointer.mode !== "drawing" || !draftRef.current) {
                return;
            }

            if (draftRef.current.type === "pen") {
                const points = draftRef.current.points;
                const last = points[points.length - 1];
                if (!last) return;
                const nextRawPoint = toStrokePoint(world, event);
                const nextPoint = smoothStrokePoint(last, nextRawPoint);

                if (distance(last, nextPoint) >= 0.4) {
                    draftRef.current = {
                        ...draftRef.current,
                        points: [...points, nextPoint],
                    };
                    pointerStateRef.current = {
                        ...pointer,
                        lastWorld: world,
                        lastScreen: screen,
                    };
                    scheduleDraw();
                }

                return;
            }

            draftRef.current = {
                ...draftRef.current,
                x2: world.x,
                y2: world.y,
            };
            pointerStateRef.current = {
                ...pointer,
                lastWorld: world,
                lastScreen: screen,
            };
            scheduleDraw();
        },
        [eraseAtPoint, fillDropperActive, getPoints, scheduleDraw, tool]
    );

    const handlePointerUp = useCallback(
        (event: React.PointerEvent<HTMLCanvasElement>) => {
            const pointer = pointerStateRef.current;
            if (!pointer || pointer.pointerId !== event.pointerId) {
                return;
            }

            let completedDrawing = false;
            if (pointer.mode === "drawing" && draftRef.current) {
                const draft = draftRef.current;

                if (draft.type === "pen") {
                    if (draft.points.length > 0) {
                        elementsRef.current = [...elementsRef.current, draft];
                    }
                } else {
                    const width = Math.abs(draft.x2 - draft.x1);
                    const height = Math.abs(draft.y2 - draft.y1);
                    if (width >= minDrawableSize || height >= minDrawableSize) {
                        elementsRef.current = [...elementsRef.current, draft];
                        completedDrawing = true;
                    }
                }

                draftRef.current = null;
            }

            if (completedDrawing) {
                setTool("select");
                setHoverCursorClass(null);
            }

            pointerStateRef.current = null;
            if (tool === "select") {
                setHoverCursorClass(null);
            }

            try {
                event.currentTarget.releasePointerCapture(event.pointerId);
            } catch {
                // Ignore if pointer capture has already been released.
            }

            scheduleDraw();
        },
        [scheduleDraw, tool]
    );

    const clearCanvas = useCallback(() => {
        elementsRef.current = [];
        draftRef.current = null;
        pointerStateRef.current = null;
        selectedIdRef.current = null;
        setTextEditor(null);
        setFillDropperActive(false);
        setHoverCursorClass(null);
        setSelectedId(null);
        scheduleDraw();
    }, [scheduleDraw]);

    const canvasCursorClass =
        tool === "hand"
            ? "cursor-grab"
            : fillDropperActive
              ? "cursor-cell"
              : tool === "select"
                ? (hoverCursorClass ?? "cursor-default")
                : tool === "text"
                  ? "cursor-text"
                  : tool === "eraser"
                    ? "cursor-cell"
                    : "cursor-crosshair";
    const textEditorLines = textEditor ? splitTextLines(textEditor.text) : [];
    const textEditorMaxChars = textEditor
        ? textEditorLines.reduce((max, line) => Math.max(max, line.length), 1)
        : 1;
    const textEditorFontSize = textEditor
        ? getTextBaseSize(textEditor.thickness)
        : 16;
    const textEditorLineHeight = textEditorFontSize * 1.28;
    const autoTextEditorWidth = Math.max(
        140,
        textEditorMaxChars * textEditorFontSize * 0.62 + TEXT_PADDING_X * 2 + 8
    );
    const autoTextEditorHeight = Math.max(
        textEditorLineHeight + TEXT_PADDING_Y * 2,
        Math.max(1, textEditorLines.length) * textEditorLineHeight +
            TEXT_PADDING_Y * 2 +
            4
    );
    const textEditorWidth = textEditor?.width ?? autoTextEditorWidth;
    const textEditorHeight = textEditor?.height ?? autoTextEditorHeight;

    return (
        <main className="relative h-screen w-screen overflow-hidden bg-slate-100 text-slate-900">
            <section
                className="absolute inset-x-3 top-3 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-slate-300/80 bg-white/90 p-2 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-white/75"
                aria-label="Drawing controls"
            >
                <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100/90 p-1">
                    {TOOLBAR_TOOLS.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={`rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide transition ${
                                tool === item.id
                                    ? "bg-slate-900 text-white shadow-sm"
                                    : "text-slate-700 hover:bg-white"
                            }`}
                            onClick={() => {
                                if (item.id !== "text") {
                                    commitTextEditor(false);
                                }
                                setTool(item.id);
                                setFillDropperActive(false);
                                setHoverCursorClass(null);
                            }}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-1 rounded-lg bg-slate-100/90 p-1">
                    {COLOR_PALETTE.map((swatch) => (
                        <button
                            key={swatch}
                            type="button"
                            className={`h-7 w-7 rounded-full border-2 transition hover:scale-105 ${
                                color === swatch
                                    ? "border-slate-900 ring-2 ring-slate-300"
                                    : "border-white/80"
                            }`}
                            style={{ background: swatch }}
                            aria-label={`Set color ${swatch}`}
                            aria-pressed={color === swatch}
                            onClick={() => {
                                setColor(swatch);
                                setTextEditor((current) =>
                                    current
                                        ? {
                                              ...current,
                                              color: swatch,
                                          }
                                        : current
                                );
                            }}
                        />
                    ))}
                </div>

                <div className="flex items-center rounded-lg bg-slate-100/90 p-1">
                    <button
                        type="button"
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                            fillDropperActive
                                ? "bg-slate-900 text-white shadow-sm"
                                : "text-slate-700 hover:bg-white"
                        }`}
                        aria-pressed={fillDropperActive}
                        onClick={toggleFill}
                    >
                        Fill
                    </button>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-slate-100/90 px-3 py-2">
                    <label
                        htmlFor="thickness"
                        className="text-xs font-semibold text-slate-700"
                    >
                        Thickness
                    </label>
                    <input
                        id="thickness"
                        type="range"
                        min={1}
                        max={16}
                        value={thickness}
                        className="w-28 accent-slate-800 sm:w-36"
                        onChange={(event) => {
                            const nextThickness = Number(event.target.value);
                            setThickness(nextThickness);
                            setTextEditor((current) =>
                                current
                                    ? {
                                          ...current,
                                          thickness: nextThickness,
                                      }
                                    : current
                            );
                        }}
                    />
                    <span className="w-10 text-right text-xs font-semibold text-slate-700">
                        {thickness}px
                    </span>
                </div>

                <div className="ml-auto">
                    <button
                        type="button"
                        className="rounded-md bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-600"
                        onClick={clearCanvas}
                    >
                        Clear
                    </button>
                </div>

                <div className="rounded-lg bg-slate-100/90 px-3 py-1.5 text-xs font-medium text-slate-600">
                    <span className="font-mono">
                        Selected: {selectedId ? selectedId.slice(0, 8) : "none"}
                    </span>
                </div>
            </section>

            {textEditor ? (
                <textarea
                    ref={textInputRef}
                    value={textEditor.text}
                    spellCheck={false}
                    rows={Math.max(1, textEditorLines.length)}
                    className="absolute z-30 resize-none bg-transparent px-0 py-0 leading-tight outline-none"
                    style={{
                        left: textEditor.screenX,
                        top: textEditor.screenY,
                        width: textEditorWidth,
                        height: textEditorHeight,
                        color: textEditor.color,
                        fontSize: `${textEditorFontSize}px`,
                        fontFamily: TEXT_FONT_FAMILY,
                    }}
                    onChange={(event) =>
                        setTextEditor((current) =>
                            current
                                ? {
                                      ...current,
                                      text: event.target.value,
                                  }
                                : current
                        )
                    }
                    onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            commitTextEditor(true);
                            return;
                        }

                        if (event.key === "Escape") {
                            event.preventDefault();
                            cancelTextEditor(true);
                        }
                    }}
                    onBlur={() => {
                        commitTextEditor(false);
                    }}
                />
            ) : null}

            <canvas
                ref={canvasRef}
                className={`block h-full w-full touch-none ${canvasCursorClass}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onDoubleClick={handleDoubleClick}
            />
        </main>
    );
}

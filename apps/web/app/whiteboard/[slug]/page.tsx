"use client";

import {
    MousePointer2,
    Hand,
    Pencil,
    Eraser,
    Minus as MinusIcon,
    ArrowUpRight,
    Square,
    Circle,
    Diamond,
    Type,
    HelpCircle,
    Plus,
    Minus,
    Undo,
    Redo,
    ArrowLeft,
    Bold,
    Italic,
    Underline,
} from "lucide-react";

import { useParams, useRouter } from "next/navigation";

import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
    useSyncExternalStore,
} from "react";

import { AuthGuard } from "../../../components/AuthGuard";
import { useWhiteboardStore } from "../../../lib/use-whiteboard-store";

import type {
    Point,
    StrokePoint,
    Tool,
    ShapeType,
    FillableShapeType,
    DrawableType,
    ShapeElement,
    PenElement,
    TextElement,
    ActiveTextEditor,
    DrawingElement,
    PointerMode,
    ResizeHandle,
    ResizeHandleDescriptor,
    PointerState,
} from "../../../lib/types";

const TOOLBAR_TOOLS: Array<{
    id: Tool;
    label: string;
    icon: React.ElementType;
}> = [
    { id: "select", label: "Select", icon: MousePointer2 },
    { id: "hand", label: "Hand", icon: Hand },
    { id: "pen", label: "Pen", icon: Pencil },
    { id: "eraser", label: "Eraser", icon: Eraser },
    { id: "line", label: "Line", icon: MinusIcon },
    { id: "arrow", label: "Arrow", icon: ArrowUpRight },
    { id: "rect", label: "Rectangle", icon: Square },
    { id: "ellipse", label: "Ellipse", icon: Circle },
    { id: "diamond", label: "Diamond", icon: Diamond },
    { id: "text", label: "Text", icon: Type },
];

const COLOR_PALETTE = [
    "#6b7280",
    "#000000",
    "#ec4899",
    "#ef4444",
    "#F87777",
    "#f59e0b",
    "#099268",
    "#10b981",
    "#4565E9",
    "#4BA1F1",
    "#9333ea",
    "#ffffff",
];

const DARK_CANVAS_INK = "#111827";
const LIGHT_CANVAS_INK = "#ffffff";

const normalizeHexColor = (value: string): string | null => {
    const match = value
        .trim()
        .toLowerCase()
        .match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
    if (!match) {
        return null;
    }

    const hex = match[1];
    if (!hex) {
        return null;
    }

    if (hex.length === 3) {
        return `#${hex
            .split("")
            .map((part) => `${part}${part}`)
            .join("")}`;
    }

    return `#${hex}`;
};

const parseRgbColor = (
    value: string
): { r: number; g: number; b: number; a?: number } | null => {
    const match = value
        .trim()
        .toLowerCase()
        .match(
            /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([01](?:\.\d+)?|0?\.\d+))?\s*\)$/
        );

    if (!match) {
        return null;
    }

    const r = Number(match[1]);
    const g = Number(match[2]);
    const b = Number(match[3]);
    const alphaRaw = match[4];

    if (
        Number.isNaN(r) ||
        Number.isNaN(g) ||
        Number.isNaN(b) ||
        r < 0 ||
        r > 255 ||
        g < 0 ||
        g > 255 ||
        b < 0 ||
        b > 255
    ) {
        return null;
    }

    if (alphaRaw === undefined) {
        return { r, g, b };
    }

    const a = Number(alphaRaw);
    if (Number.isNaN(a) || a < 0 || a > 1) {
        return null;
    }

    return { r, g, b, a };
};

const getThemeAwareCanvasColor = (color: string, isDark: boolean): string => {
    const normalizedHex = normalizeHexColor(color);

    if (normalizedHex) {
        const isDarkInkHex =
            normalizedHex === DARK_CANVAS_INK || normalizedHex === "#000000";

        if (isDark && isDarkInkHex) {
            return LIGHT_CANVAS_INK;
        }

        if (!isDark && normalizedHex === LIGHT_CANVAS_INK) {
            return DARK_CANVAS_INK;
        }

        return color;
    }

    const rgb = parseRgbColor(color);
    if (!rgb) {
        return color;
    }

    const isDarkInkRgb =
        (rgb.r === 17 && rgb.g === 24 && rgb.b === 39) ||
        (rgb.r === 0 && rgb.g === 0 && rgb.b === 0);
    const isLightInkRgb = rgb.r === 255 && rgb.g === 255 && rgb.b === 255;

    if (isDark && isDarkInkRgb) {
        return rgb.a === undefined
            ? LIGHT_CANVAS_INK
            : `rgba(255, 255, 255, ${rgb.a})`;
    }

    if (!isDark && isLightInkRgb) {
        return rgb.a === undefined
            ? DARK_CANVAS_INK
            : `rgba(17, 24, 39, ${rgb.a})`;
    }

    return color;
};

const FILL_ALPHA = 0.2;
const RESIZE_HANDLE_HIT_RADIUS = 10;
const TEXT_PADDING_X = 6;
const TEXT_PADDING_Y = 4;
const TEXT_FONT_RATIO = 0.82;
const FONT_OPTIONS = [
    {
        label: "Comic",
        value: `"Comic Sans MS", "Chalkboard SE", "Comic Neue", sans-serif`,
    },
    { label: "Mono", value: `"Menlo", "Monaco", "Courier New", monospace` },
    {
        label: "Sans",
        value: `"Inter", "Helvetica Neue", "Arial", sans-serif`,
    },
];
const DEFAULT_FONT_FAMILY = FONT_OPTIONS[0]?.value ?? "sans-serif";

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
            points: el.points.map((point: StrokePoint) => ({
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

    if (el.points.length < 2) {
        const p = el.points[0];
        return p ? distance(point, p) <= threshold : false;
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

const drawShape = (
    ctx: CanvasRenderingContext2D,
    el: ShapeElement,
    isDark: boolean
): void => {
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
        ctx.fillStyle = getThemeAwareCanvasColor(el.fill, isDark);
        ctx.fill();
    }

    ctx.stroke();
};

const drawTextElement = (
    ctx: CanvasRenderingContext2D,
    el: TextElement,
    isDark: boolean
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
    ctx.fillStyle = getThemeAwareCanvasColor(el.color, isDark);

    // Construct font string with weight and style
    const weight = el.fontWeight || "normal";
    const style = el.fontStyle || "normal";
    ctx.font = `${style} ${weight} ${fontSize}px ${el.fontFamily}`;

    ctx.textBaseline = "top";

    for (let i = 0; i < lineCount; i += 1) {
        const line = lines[i] ?? "";
        const measuredWidth = Math.max(1, ctx.measureText(line || " ").width);
        const horizontalScale = Math.min(1, contentWidth / measuredWidth);
        const y = minY + TEXT_PADDING_Y + i * lineHeight;

        ctx.save();
        ctx.translate(minX + TEXT_PADDING_X, y);
        ctx.scale(horizontalScale, 1);
        ctx.fillText(line, 0, 0);

        // Manual underline rendering
        if (el.textDecoration === "underline") {
            const underlineY = fontSize * 1.1; // Slightly below text
            ctx.beginPath();
            ctx.moveTo(0, underlineY);
            ctx.lineTo(measuredWidth, underlineY);
            ctx.lineWidth = fontSize * 0.05; // Relative thickness
            ctx.stroke();
        }

        ctx.restore();
    }

    ctx.restore();
    ctx.restore();
};

const drawEraserTrail = (
    ctx: CanvasRenderingContext2D,
    el: DrawingElement,
    isDark: boolean
): void => {
    if (el.type !== "pen" || el.points.length < 2) return;

    const points = el.points;
    const tailLength = points.length;

    // Calculate ribbon points
    const leftPoints: { x: number; y: number }[] = [];
    const rightPoints: { x: number; y: number }[] = [];

    for (let i = 0; i < tailLength - 1; i++) {
        const curr = points[i];
        const next = points[i + 1];
        if (!curr || !next) continue;

        // Calculate direction vector
        const dx = next.x - curr.x;
        const dy = next.y - curr.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) continue;

        // Normalized normal vector
        const nx = -dy / len;
        const ny = dx / len;

        // Taper thickness based on index
        const progress = i / tailLength; // 0 to near 1
        // We want the tail (start of array?) wait.
        // Array tracks points as they are added.
        // points[0] is the oldest point (tail tip). points[length-1] is the newest (cursor).
        // So points[0] should be thin (0), points[length-1] should be thick.

        const thickness = Math.max(0.01, el.thickness * progress);
        const halfWidth = thickness / 2;

        leftPoints.push({
            x: curr.x + nx * halfWidth,
            y: curr.y + ny * halfWidth,
        });
        rightPoints.push({
            x: curr.x - nx * halfWidth,
            y: curr.y - ny * halfWidth,
        });
    }

    // Add final point (cursor position)
    const last = points[tailLength - 1];
    if (last) {
        // Use normal of last segment
        // Or just the point itself for a sharp tip?
        // Let's use the point itself for the very tip of the cursor
        leftPoints.push({ x: last.x, y: last.y });
        rightPoints.push({ x: last.x, y: last.y });
    }

    if (leftPoints.length === 0) return;

    ctx.beginPath();
    const firstPoint = leftPoints[0];
    if (firstPoint) {
        ctx.moveTo(firstPoint.x, firstPoint.y);
    }

    // Forward along left side
    for (let i = 1; i < leftPoints.length; i++) {
        const p = leftPoints[i];
        if (p) {
            ctx.lineTo(p.x, p.y);
        }
    }

    // Backward along right side
    for (let i = rightPoints.length - 1; i >= 0; i--) {
        const p = rightPoints[i];
        if (p) {
            ctx.lineTo(p.x, p.y);
        }
    }

    ctx.closePath();

    ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.2)";
    // User requested "oklch(87% 0 0)" which is light gray.
    // And "smooth color".
    // Let's use a solid but slightly transparent fill to look like a trail.
    // Or maybe a gradient?
    // A gradient along the path is hard.
    // Let's use the user's color if possible, or a standard trail color.
    // The user's code had `oklch(87% 0 0)` for light mode.

    if (!isDark) {
        ctx.fillStyle = "oklch(87% 0 0)";
    }

    ctx.fill();
};

const drawElement = (
    ctx: CanvasRenderingContext2D,
    el: DrawingElement,
    isDark: boolean
): void => {
    const strokeColor = getThemeAwareCanvasColor(el.color, isDark);
    ctx.strokeStyle = strokeColor;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (el.type === "text") {
        drawTextElement(ctx, el, isDark);
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
            ctx.fillStyle = strokeColor;
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
    drawShape(ctx, el, isDark);
};

const moveElement = (
    el: DrawingElement,
    deltaX: number,
    deltaY: number
): DrawingElement => {
    if (el.type === "pen") {
        return {
            ...el,
            points: el.points.map((p: StrokePoint) => ({
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
    point: Point,
    text: string,
    color: string,
    thickness: number,
    fontFamily: string,
    fontWeight = "normal",
    fontStyle = "normal",
    textDecoration = "none"
): TextElement => {
    const { width, height } = estimateTextBounds(text, thickness);
    return {
        id: buildId(),
        type: "text",
        x1: point.x,
        y1: point.y,
        x2: point.x + width,
        y2: point.y + height,
        text,
        color,
        thickness,
        fontFamily,
        fontWeight,
        fontStyle,
        textDecoration,
    };
};

const minDrawableSize = 2;

const subscribeToTheme = (callback: () => void) => {
    const observer = new MutationObserver(callback);
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
    });
    return () => observer.disconnect();
};

const getThemeSnapshot = () => {
    return document.documentElement.classList.contains("dark");
};

const getThemeServerSnapshot = () => {
    return false;
};

function WhiteboardCanvas({ slug }: { slug: string }) {
    const router = useRouter();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const textInputRef = useRef<HTMLTextAreaElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const panRef = useRef<Point>({ x: 0, y: 0 });
    const elementsRef = useRef<DrawingElement[]>([]);
    const elementsStateRef = useRef<DrawingElement[]>([]);

    const {
        elements,
        addElement,
        updateElement,
        deleteElement,
        undo,
        redo,
        canUndo,
        canRedo,
    } = useWhiteboardStore(slug);

    elementsStateRef.current = elements;

    const draftRef = useRef<DrawingElement | null>(null);
    const pointerStateRef = useRef<PointerState | null>(null);
    const selectedIdRef = useRef<string | null>(null);
    const textEditorRef = useRef<ActiveTextEditor | null>(null);

    const [tool, setTool] = useState<Tool>("pen");
    const [color, setColor] = useState<string>(COLOR_PALETTE[0] ?? "#6b7280");
    const [thickness, setThickness] = useState<number>(3);
    const [fontFamily, setFontFamily] = useState<string>(DEFAULT_FONT_FAMILY);
    const [fontWeight, setFontWeight] = useState<string>("normal");
    const [fontStyle, setFontStyle] = useState<string>("normal");
    const [textDecoration, setTextDecoration] = useState<string>("none");
    const [fillDropperActive, setFillDropperActive] = useState<boolean>(false);
    const [hoverCursorClass, setHoverCursorClass] = useState<string | null>(
        null
    );
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [textEditor, setTextEditor] = useState<ActiveTextEditor | null>(null);

    const isDark = useSyncExternalStore(
        subscribeToTheme,
        getThemeSnapshot,
        getThemeServerSnapshot
    );

    const [zoom, setZoom] = useState(100);
    const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
    const canvasBg = isDark ? "#171717" : "#ffffff";

    const applyElementPreview = useCallback((nextElement: DrawingElement) => {
        elementsRef.current = elementsRef.current.map((element) =>
            element.id === nextElement.id ? nextElement : element
        );
    }, []);

    useEffect(() => {
        selectedIdRef.current = selectedId;
    }, [selectedId]);

    useEffect(() => {
        textEditorRef.current = textEditor;
    }, [textEditor]);

    const scheduleDraw = useCallback(() => {
        const runDraw = () => {
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
            ctx.scale(zoom / 100, zoom / 100);
            ctx.fillStyle = canvasBg;
            const scale = zoom / 100;
            ctx.fillRect(0, 0, rect.width / scale, rect.height / scale);

            ctx.save();
            const currentPan = panRef.current;
            ctx.translate(currentPan.x, currentPan.y);
            const editingElementId = textEditorRef.current?.elementId ?? null;

            const pointerMode = pointerStateRef.current?.mode;
            const drawElements =
                pointerMode === "moving" || pointerMode === "resizing"
                    ? elementsRef.current
                    : elementsStateRef.current;

            for (const el of drawElements) {
                if (editingElementId && el.id === editingElementId) {
                    continue;
                }
                drawElement(ctx, el, isDark);
            }

            if (draftRef.current) {
                if (tool === "eraser") {
                    drawEraserTrail(ctx, draftRef.current, isDark);
                } else {
                    drawElement(ctx, draftRef.current, isDark);
                }
            }

            if (selectedIdRef.current) {
                const selectedElement = drawElements.find(
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
        };

        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
        }
        rafRef.current = window.requestAnimationFrame(runDraw);
    }, [zoom, canvasBg, isDark, tool]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input or textarea (except our canvas text editor handled separately or if manually focused)
            // But if textEditor is active, we might want to let it handle keys.
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                (e.target instanceof HTMLDivElement &&
                    e.target.isContentEditable)
            ) {
                return;
            }

            switch (e.key.toLowerCase()) {
                case "v":
                case "1": // Excalidraw often uses numbers too, but let's stick to letters or common standards
                    setTool("select");
                    break;
                case "h":
                    setTool("hand");
                    break;
                case "p":
                    setTool("pen");
                    break;
                case "e":
                    setTool("eraser");
                    break;
                case "t":
                    setTool("text");
                    break;
                case "r": // Rectangle
                    setTool("rect");
                    break;
                case "c":
                    setTool("ellipse");
                    break;
                case "d": // Diamond
                    setTool("diamond");
                    break;
                case "z": {
                    if (e.metaKey || e.ctrlKey) {
                        if (e.shiftKey) {
                            redo();
                        } else {
                            undo();
                        }
                        e.preventDefault();
                    }
                    break;
                }
                case "y": {
                    if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
                        redo();
                        e.preventDefault();
                    }
                    break;
                }
                case "l": // Line
                    setTool("line");
                    break;
                case "a": // Arrow
                    setTool("arrow");
                    break;
                case "backspace":
                case "delete": {
                    if (selectedIdRef.current) {
                        deleteElement(selectedIdRef.current);
                        selectedIdRef.current = null;
                        setSelectedId(null);
                        scheduleDraw();
                    }
                    break;
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [deleteElement, scheduleDraw, undo, redo]);

    useEffect(() => {
        if (!pointerStateRef.current) {
            elementsRef.current = elements;
        }
        scheduleDraw();
    }, [elements, scheduleDraw]);

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
            const scale = zoom / 100;
            const world = {
                x: screen.x / scale - panRef.current.x,
                y: screen.y / scale - panRef.current.y,
            };
            return { world, screen };
        },
        [zoom]
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
                fontFamily: el.fontFamily,
                fontWeight: el.fontWeight,
                fontStyle: el.fontStyle,
                textDecoration: el.textDecoration,
            });
            selectedIdRef.current = el.id;
            setSelectedId(el.id);
            setFontFamily(el.fontFamily);
            setFontWeight(el.fontWeight || "normal");
            setFontStyle(el.fontStyle || "normal");
            setTextDecoration(el.textDecoration || "none");
            setThickness(el.thickness);
            setColor(el.color);
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

            const removed = elementsRef.current[index];
            if (!removed) return;
            deleteElement(removed.id);

            if (removed && removed.id === selectedIdRef.current) {
                selectedIdRef.current = null;
                setSelectedId(null);
            }
        },
        [deleteElement, setSelectedId]
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
                        deleteElement(activeEditor.elementId);
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

                        const existing = elementsRef.current.find(
                            (el) => el.id === activeEditor.elementId
                        );
                        if (existing && existing.type === "text") {
                            updateElement({
                                ...existing,
                                text: normalizedText,
                                color: activeEditor.color,
                                thickness: activeEditor.thickness,
                                fontFamily: activeEditor.fontFamily,
                                fontWeight: activeEditor.fontWeight,
                                fontStyle: activeEditor.fontStyle,
                                textDecoration: activeEditor.textDecoration,
                                x1: activeEditor.x,
                                y1: activeEditor.y,
                                x2: activeEditor.x + nextWidth,
                                y2: activeEditor.y + nextHeight,
                            });
                        }
                        selectedIdRef.current = activeEditor.elementId;
                        setSelectedId(activeEditor.elementId);
                    }
                }
            } else if (hasText) {
                const textElement = buildTextElement(
                    { x: activeEditor.x, y: activeEditor.y },
                    normalizedText,
                    activeEditor.color,
                    activeEditor.thickness,
                    activeEditor.fontFamily,
                    activeEditor.fontWeight,
                    activeEditor.fontStyle,
                    activeEditor.textDecoration
                );
                addElement(textElement);
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
        [scheduleDraw, addElement, updateElement, deleteElement]
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
            // Removed commentMode check
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
                    const updatedTarget = elementsRef.current.find(
                        (el) => el.id === target.id
                    );
                    if (updatedTarget && isFillableShape(updatedTarget)) {
                        updateElement({ ...updatedTarget, fill: fillColor });
                    }
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
                    // Also update formatting state
                    setFontFamily(target.fontFamily);
                    setFontWeight(target.fontWeight || "normal");
                    setFontStyle(target.fontStyle || "normal");
                    setTextDecoration(target.textDecoration || "none");
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
                    fontFamily,
                    fontWeight,
                    fontStyle,
                    textDecoration,
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
                const initialPoint = toStrokePoint(world, event);
                draftRef.current = {
                    id: buildId(),
                    type: "pen",
                    color: "rgba(115, 115, 115, 0.5)", // Neutral-500 with opacity
                    thickness: thickness * 2, // Thicker for eraser visualization
                    points: [initialPoint],
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
                    setColor(target.color);
                    setThickness(target.thickness);
                    setThickness(target.thickness);
                    if (target.type === "text") {
                        setFontFamily(target.fontFamily);
                        setFontWeight(target.fontWeight || "normal");
                        setFontStyle(target.fontStyle || "normal");
                        setTextDecoration(target.textDecoration || "none");
                    }

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
            fontFamily,
            getElementAtPoint,
            getPoints,
            openTextEditorForElement,
            scheduleDraw,
            startTextEditor,
            thickness,
            tool,
            updateElement,
            zoom,
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
                const newPan = {
                    x: panRef.current.x + (screen.x - pointer.lastScreen.x),
                    y: panRef.current.y + (screen.y - pointer.lastScreen.y),
                };
                panRef.current = newPan;
                setPan(newPan);
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

                if (draftRef.current && draftRef.current.type === "pen") {
                    const points = draftRef.current.points;
                    const last = points[points.length - 1];
                    if (last) {
                        const nextRawPoint = toStrokePoint(world, event);
                        const nextPoint = smoothStrokePoint(last, nextRawPoint);
                        if (distance(last, nextPoint) >= 0.4) {
                            let newPoints = [...points, nextPoint];
                            if (newPoints.length > 20) {
                                newPoints = newPoints.slice(-20);
                            }
                            draftRef.current = {
                                ...draftRef.current,
                                points: newPoints,
                            };
                        }
                    }
                }

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
                applyElementPreview(resizedElement);
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
                    const movedEl = elementsRef.current.find(
                        (el) => el.id === pointer.elementId
                    );
                    if (movedEl) {
                        applyElementPreview(moveElement(movedEl, dx, dy));
                    }
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
        [
            eraseAtPoint,
            fillDropperActive,
            getPoints,
            applyElementPreview,
            scheduleDraw,
            tool,
        ]
    );

    const handlePointerUp = useCallback(
        (event: React.PointerEvent<HTMLCanvasElement>) => {
            const pointer = pointerStateRef.current;
            if (!pointer || pointer.pointerId !== event.pointerId) {
                return;
            }

            if (pointer.mode === "erasing") {
                draftRef.current = null;
            }

            let completedDrawing = false;
            if (pointer.mode === "drawing" && draftRef.current) {
                const draft = draftRef.current;

                if (draft.type === "pen") {
                    if (draft.points.length > 0) {
                        const next = [...elementsStateRef.current, draft];
                        elementsStateRef.current = next;
                        elementsRef.current = next;
                        addElement(draft);
                    }
                } else {
                    const width = Math.abs(draft.x2 - draft.x1);
                    const height = Math.abs(draft.y2 - draft.y1);
                    if (width >= minDrawableSize || height >= minDrawableSize) {
                        const next = [...elementsStateRef.current, draft];
                        elementsStateRef.current = next;
                        elementsRef.current = next;
                        addElement(draft);
                        completedDrawing = true;
                    }
                }

                draftRef.current = null;
            }

            if (
                (pointer.mode === "moving" || pointer.mode === "resizing") &&
                pointer.elementId
            ) {
                const finalizedElement = elementsRef.current.find(
                    (element) => element.id === pointer.elementId
                );
                if (finalizedElement) {
                    updateElement(finalizedElement);
                }
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
            } catch {}

            scheduleDraw();
        },
        [scheduleDraw, tool, addElement, updateElement]
    );

    const clearCanvas = useCallback(() => {
        for (const el of elementsRef.current) {
            deleteElement(el.id);
        }
        draftRef.current = null;
        pointerStateRef.current = null;
        selectedIdRef.current = null;
        setTextEditor(null);
        setFillDropperActive(false);
        setHoverCursorClass(null);
        setSelectedId(null);
        scheduleDraw();
    }, [scheduleDraw, deleteElement]);

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

    const leaveRoom = useCallback(() => {
        router.push("/rooms");
    }, [router]);

    return (
        <main
            className="relative h-screen w-screen overflow-hidden text-slate-900 dark:text-neutral-100"
            style={{ background: canvasBg }}
        >
            <header className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-3 py-2 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
                <div className="flex min-w-0 items-center gap-2">
                    <button
                        type="button"
                        onClick={leaveRoom}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    >
                        <ArrowLeft size={16} />
                        Rooms
                    </button>
                    <span className="text-slate-300 dark:text-neutral-600">
                        |
                    </span>
                    <span className="truncate text-sm font-medium text-slate-800 dark:text-neutral-100">
                        {slug || "room"}
                    </span>
                </div>
            </header>
            <section
                className="absolute left-1/2 bottom-5 z-20 -translate-x-1/2 flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-1 py-1.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                aria-label="Drawing tools"
            >
                {TOOLBAR_TOOLS.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        title={item.label}
                        className={`flex h-11 w-11 mx-px p-2 items-center justify-center rounded-full transition ${
                            tool === item.id
                                ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"
                                : "text-slate-600 hover:bg-slate-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
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
                        <item.icon size={18} strokeWidth={1.75} />
                    </button>
                ))}

                <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-neutral-800" />

                <button
                    type="button"
                    title="Undo (Ctrl+Z)"
                    className={`flex h-11 w-11 mx-px p-2 items-center justify-center rounded-full transition ${
                        canUndo
                            ? "text-slate-600 hover:bg-slate-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                            : "text-slate-300 dark:text-neutral-700 cursor-not-allowed"
                    }`}
                    onClick={undo}
                    disabled={!canUndo}
                >
                    <Undo size={18} strokeWidth={1.75} />
                </button>
                <button
                    type="button"
                    title="Redo (Ctrl+Shift+Z)"
                    className={`flex h-11 w-11 mx-px p-2 items-center justify-center rounded-full transition ${
                        canRedo
                            ? "text-slate-600 hover:bg-slate-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                            : "text-slate-300 dark:text-neutral-700 cursor-not-allowed"
                    }`}
                    onClick={redo}
                    disabled={!canRedo}
                >
                    <Redo size={18} strokeWidth={1.75} />
                </button>
            </section>

            {((tool !== "select" && tool !== "hand") || selectedId) && (
                <aside className="absolute left-3 top-14 z-20 w-52 space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
                    <div>
                        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                            Stroke
                        </span>
                        <div className="grid grid-cols-4 gap-4 p-2">
                            {COLOR_PALETTE.map((swatch) => (
                                <button
                                    key={swatch}
                                    type="button"
                                    className={`h-6 w-6 rounded-full border transition hover:scale-110 ${
                                        color === swatch
                                            ? "border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-500/30"
                                            : "border-slate-200 dark:border-neutral-700"
                                    }`}
                                    style={{ background: swatch }}
                                    onClick={() => {
                                        setColor(swatch);
                                        // Update selected element if exists
                                        if (selectedId) {
                                            const el = elementsRef.current.find(
                                                (e) => e.id === selectedId
                                            );
                                            if (el) {
                                                updateElement({
                                                    ...el,
                                                    color: swatch,
                                                });
                                            }
                                        }
                                        setTextEditor(
                                            (
                                                current: ActiveTextEditor | null
                                            ) =>
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
                    </div>

                    <div>
                        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                            Background
                        </span>
                        <button
                            type="button"
                            className={`rounded-md border px-3 py-1 text-xs font-medium shadow-inner shadow-slate-200 transition ${
                                fillDropperActive
                                    ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"
                                    : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                            }`}
                            onClick={toggleFill}
                        >
                            {fillDropperActive ? "Click shape to fill" : "Fill"}
                        </button>
                    </div>

                    <div>
                        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                            Stroke width
                        </span>
                        <div className="flex items-center gap-2">
                            {[
                                { label: "S", value: 4 },
                                { label: "M", value: 8 },
                                { label: "L", value: 12 },
                                { label: "XL", value: 18 },
                            ].map((btn) => (
                                <button
                                    key={btn.value}
                                    type="button"
                                    className={`flex h-8 w-8 items-center justify-center rounded-md border text-xs font-medium transition ${
                                        thickness === btn.value
                                            ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"
                                            : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                    }`}
                                    onClick={() => {
                                        setThickness(btn.value);
                                        // Update selected element if exists
                                        if (selectedId) {
                                            const el = elementsRef.current.find(
                                                (e) => e.id === selectedId
                                            );
                                            if (el) {
                                                updateElement({
                                                    ...el,
                                                    thickness: btn.value,
                                                });
                                            }
                                        }
                                        setTextEditor(
                                            (
                                                current: ActiveTextEditor | null
                                            ) =>
                                                current
                                                    ? {
                                                          ...current,
                                                          thickness: btn.value,
                                                      }
                                                    : current
                                        );
                                    }}
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {(tool === "text" ||
                        (selectedId &&
                            elementsRef.current.find(
                                (el) => el.id === selectedId
                            )?.type === "text")) && (
                        <div>
                            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                                Font family
                            </span>
                            <div className="flex flex-col gap-1">
                                {FONT_OPTIONS.map((font) => (
                                    <button
                                        key={font.label}
                                        type="button"
                                        className={`rounded-md px-2.5 py-1 text-left text-xs font-medium transition ${
                                            fontFamily === font.value
                                                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"
                                                : "text-slate-600 hover:bg-slate-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                        }`}
                                        onClick={() => {
                                            setFontFamily(font.value);
                                            setTextEditor(
                                                (
                                                    current: ActiveTextEditor | null
                                                ) =>
                                                    current
                                                        ? {
                                                              ...current,
                                                              fontFamily:
                                                                  font.value,
                                                          }
                                                        : current
                                            );
                                            const selId = selectedIdRef.current;
                                            if (selId) {
                                                const el =
                                                    elementsRef.current.find(
                                                        (e) => e.id === selId
                                                    );
                                                if (el && el.type === "text") {
                                                    updateElement({
                                                        ...el,
                                                        fontFamily: font.value,
                                                    });
                                                }
                                                scheduleDraw();
                                            }
                                        }}
                                    >
                                        {font.label}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-2  flex items-center gap-3">
                                <button
                                    type="button"
                                    className={`flex py-2 flex-1 cursor-pointer  items-center justify-center rounded-md border text-xs font-medium transition ${
                                        fontWeight === "bold"
                                            ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"
                                            : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                    }`}
                                    onClick={() => {
                                        const newWeight =
                                            fontWeight === "bold"
                                                ? "normal"
                                                : "bold";
                                        setFontWeight(newWeight);
                                        setTextEditor(
                                            (
                                                current: ActiveTextEditor | null
                                            ) =>
                                                current
                                                    ? {
                                                          ...current,
                                                          fontWeight: newWeight,
                                                      }
                                                    : current
                                        );
                                        const selId = selectedIdRef.current;
                                        if (selId) {
                                            const el = elementsRef.current.find(
                                                (e) => e.id === selId
                                            );
                                            if (el && el.type === "text") {
                                                updateElement({
                                                    ...el,
                                                    fontWeight: newWeight,
                                                });
                                            }
                                            scheduleDraw();
                                        }
                                    }}
                                    title="Bold"
                                >
                                    <Bold size={14} />
                                </button>
                                <button
                                    type="button"
                                    className={`flex  flex-1 cursor-pointer py-2 items-center justify-center rounded-md border text-xs font-medium transition ${
                                        fontStyle === "italic"
                                            ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"
                                            : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                    }`}
                                    onClick={() => {
                                        const newStyle =
                                            fontStyle === "italic"
                                                ? "normal"
                                                : "italic";
                                        setFontStyle(newStyle);
                                        setTextEditor(
                                            (
                                                current: ActiveTextEditor | null
                                            ) =>
                                                current
                                                    ? {
                                                          ...current,
                                                          fontStyle: newStyle,
                                                      }
                                                    : current
                                        );
                                        const selId = selectedIdRef.current;
                                        if (selId) {
                                            const el = elementsRef.current.find(
                                                (e) => e.id === selId
                                            );
                                            if (el && el.type === "text") {
                                                updateElement({
                                                    ...el,
                                                    fontStyle: newStyle,
                                                });
                                            }
                                            scheduleDraw();
                                        }
                                    }}
                                    title="Italic"
                                >
                                    <Italic size={14} />
                                </button>
                                <button
                                    type="button"
                                    className={`flex flex-1 cursor-pointer py-2 items-center justify-center rounded-md border text-xs font-medium transition ${
                                        textDecoration === "underline"
                                            ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"
                                            : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                    }`}
                                    onClick={() => {
                                        const newDecoration =
                                            textDecoration === "underline"
                                                ? "none"
                                                : "underline";
                                        setTextDecoration(newDecoration);
                                        setTextEditor(
                                            (
                                                current: ActiveTextEditor | null
                                            ) =>
                                                current
                                                    ? {
                                                          ...current,
                                                          textDecoration:
                                                              newDecoration,
                                                      }
                                                    : current
                                        );
                                        const selId = selectedIdRef.current;
                                        if (selId) {
                                            const el = elementsRef.current.find(
                                                (e) => e.id === selId
                                            );
                                            if (el && el.type === "text") {
                                                updateElement({
                                                    ...el,
                                                    textDecoration:
                                                        newDecoration,
                                                });
                                            }
                                            scheduleDraw();
                                        }
                                    }}
                                    title="Underline"
                                >
                                    <Underline size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </aside>
            )}
            <div className="absolute bottom-3 left-3 z-20 flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-l-lg text-slate-600 transition hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    onClick={() => setZoom((z) => Math.max(10, z - 10))}
                    aria-label="Zoom out"
                >
                    <Minus size={16} />
                </button>
                <button
                    type="button"
                    className="flex h-8 min-w-[52px] items-center justify-center border-x border-slate-200 px-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    onClick={() => setZoom(100)}
                >
                    {zoom}%
                </button>
                <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-r-lg text-slate-600 transition hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    onClick={() => setZoom((z) => Math.min(500, z + 10))}
                    aria-label="Zoom in"
                >
                    <Plus size={16} />
                </button>
            </div>
            <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
                <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-indigo-500 shadow-sm transition hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-indigo-300 dark:hover:bg-neutral-800"
                    aria-label="Help"
                >
                    <HelpCircle size={18} />
                </button>
            </div>
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
                        width: textEditor.width ?? undefined,
                        height: textEditor.height ?? undefined,
                        color: getThemeAwareCanvasColor(
                            textEditor.color,
                            isDark
                        ),
                        fontSize: `${Math.max(
                            1,
                            textEditor.thickness * 5 * (zoom / 100)
                        )}px`,
                        fontFamily: textEditor.fontFamily,
                        fontWeight: textEditor.fontWeight,
                        fontStyle: textEditor.fontStyle,
                        textDecoration: textEditor.textDecoration,
                    }}
                    onChange={(event) =>
                        setTextEditor((current: ActiveTextEditor | null) =>
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


export default function WhiteboardPage() {
    const params = useParams();
    const slug = typeof params.slug === "string" ? params.slug : "";

    return (
        <AuthGuard>
            <WhiteboardCanvas slug={slug} />
        </AuthGuard>
    );
}

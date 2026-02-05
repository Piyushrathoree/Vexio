import rough from "roughjs";
import { Shape } from "../types";
import type { Drawable } from "roughjs/bin/core";

const drawableCache = new Map<string, Drawable>();

export function createElement(
    id: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    type: Shape["type"],
    options: Shape["options"]
): Shape {
    const element: Shape = {
        id,
        type,
        x: x1,
        y: y1,
        width: x2 - x1,
        height: y2 - y1,
        endX: x2,
        endY: y2,
        options,
    };

    if (type === "pencil") {
        element.points = [{ x: x1, y: y1 }];
        element.x = 0;
        element.y = 0;
    }

    drawableCache.delete(id);

    return element;
}

// Generate a cache key based on element properties
function getCacheKey(element: Shape): string {
    if (element.type === "pencil") {
        return `${element.id}-${element.points?.length || 0}`;
    }
    return `${element.id}-${element.x}-${element.y}-${element.width}-${element.height}-${element.endX}-${element.endY}`;
}

// Get or create drawable with caching
function getDrawable(
    generator: any,
    element: Shape
): Drawable | Drawable[] | null {
    const cacheKey = getCacheKey(element);

    // For pencil, we don't cache during drawing (points keep changing)
    if (element.type === "pencil" && element.points) {
        if (element.points.length < 2) return null;
        const points = element.points.map(
            (p) => [p.x, p.y] as [number, number]
        );
        return generator.linearPath(points, {
            ...element.options,
            roughness: 0,
            bowing: 0,
        });
    }

    // Return cached drawable if exists
    if (drawableCache.has(cacheKey)) {
        return drawableCache.get(cacheKey)!;
    }

    const {
        x,
        y,
        width = 0,
        height = 0,
        endX = 0,
        endY = 0,
        options,
    } = element;

    // Use seed based on element id for consistent randomness
    const seed = hashCode(element.id);
    const stableOptions = { ...options, seed, roughness: 1 };

    let drawable: Drawable | Drawable[];

    switch (element.type) {
        case "line":
            drawable = generator.line(x, y, endX, endY, stableOptions);
            break;

        case "arrow": {
            const angle = Math.atan2(endY - y, endX - x);
            const headLength = 15;
            const headAngle = Math.PI / 6;

            const x1 = endX - headLength * Math.cos(angle - headAngle);
            const y1 = endY - headLength * Math.sin(angle - headAngle);
            const x2 = endX - headLength * Math.cos(angle + headAngle);
            const y2 = endY - headLength * Math.sin(angle + headAngle);

            drawable = [
                generator.line(x, y, endX, endY, stableOptions),
                generator.line(endX, endY, x1, y1, stableOptions),
                generator.line(endX, endY, x2, y2, stableOptions),
            ];
            break;
        }

        case "rectangle":
            drawable = generator.rectangle(x, y, width, height, stableOptions);
            break;

        case "diamond": {
            const cx = x + width / 2;
            const cy = y + height / 2;
            const hw = Math.abs(width) / 2;
            const hh = Math.abs(height) / 2;

            const points: [number, number][] = [
                [cx, cy - hh],
                [cx + hw, cy],
                [cx, cy + hh],
                [cx - hw, cy],
            ];

            drawable = generator.polygon(points, stableOptions);
            break;
        }

        case "circle": {
            drawable = generator.ellipse(
                x + width / 2,
                y + height / 2,
                Math.abs(width),
                Math.abs(height),
                stableOptions
            );
            break;
        }

        case "text":
            // Text is not a roughjs drawable, return null and handle separately
            return null;

        default:
            return null;
    }

    // Cache the drawable
    if (Array.isArray(drawable)) {
        // For arrows, cache the main line
        if (drawable[0]) {
            drawableCache.set(cacheKey, drawable[0]);
        }
    } else {
        drawableCache.set(cacheKey, drawable);
    }

    return drawable;
}

// Simple hash function for consistent seed from id
function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

// Smooth freehand drawing like tldraw - single continuous path with bezier curves
function drawSmoothPencil(context: CanvasRenderingContext2D, element: Shape) {
    const points = element.points;
    if (!points || points.length < 2) return;

    const strokeColor = element.options.stroke ?? "#1e1e1e";
    const strokeWidth = element.options.strokeWidth ?? 2;

    context.save();
    context.strokeStyle = strokeColor;
    context.lineWidth = strokeWidth;
    context.lineCap = "round";
    context.lineJoin = "round";

    // Single continuous path for smooth drawing
    context.beginPath();
    context.moveTo(points[0]!.x, points[0]!.y);

    if (points.length === 2) {
        // Just two points - draw a line
        context.lineTo(points[1]!.x, points[1]!.y);
    } else {
        // Smoothing: 0 = sharp/angular, 1 = very smooth
        // 0.5 gives smooth curves for circles while keeping some responsiveness
        const smoothing = 0.5;

        for (let i = 1; i < points.length - 1; i++) {
            const current = points[i]!;
            const next = points[i + 1]!;

            // Calculate control point closer to actual point for sharper curves
            const cpX =
                current.x + (next.x - current.x) * (1 - smoothing) * 0.5;
            const cpY =
                current.y + (next.y - current.y) * (1 - smoothing) * 0.5;

            // End point is between current and next, but closer to current for sharpness
            const endX = current.x + (next.x - current.x) * smoothing;
            const endY = current.y + (next.y - current.y) * smoothing;

            context.quadraticCurveTo(current.x, current.y, endX, endY);
        }

        // Draw final segment directly to last point
        const lastPoint = points[points.length - 1]!;
        context.lineTo(lastPoint.x, lastPoint.y);
    }

    context.stroke();
    context.restore();
}

export function drawElementSimple(
    roughCanvas: any,
    context: CanvasRenderingContext2D,
    element: Shape
) {
    // Handle pencil with smooth custom drawing
    if (element.type === "pencil") {
        drawSmoothPencil(context, element);
        return;
    }

    // Handle text separately (multiline + optional wrap by width)
    if (element.type === "text") {
        context.save();
        const fontSize = element.options.fontSize || 24;
        const fontFamily =
            element.options.fontFamily || "Virgil, Segoe UI Emoji, sans-serif";
        context.font = `${fontSize}px ${fontFamily}`;
        context.fillStyle = element.options.stroke ?? "#1e1e1e";
        context.textBaseline = "top";
        const rawText = element.text || "";
        const maxWidth = element.width ?? 200;
        const lineHeight = fontSize * 1.2;
        const lines: string[] = [];
        for (const paragraph of rawText.split("\n")) {
            const words = paragraph.split(" ");
            let currentLine = "";
            for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                const metrics = context.measureText(testLine);
                if (metrics.width > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) lines.push(currentLine);
        }
        if (lines.length === 0) lines.push("");
        lines.forEach((line, i) => {
            context.fillText(line, element.x, element.y + i * lineHeight);
        });
        context.restore();
        return;
    }

    const generator = roughCanvas.generator;
    const drawable = getDrawable(generator, element);

    if (!drawable) return;

    if (Array.isArray(drawable)) {
        drawable.forEach((d) => roughCanvas.draw(d));
    } else {
        roughCanvas.draw(drawable);
    }
}

// Clear cache for an element (call when element is deleted)
export function clearElementCache(id: string) {
    for (const key of drawableCache.keys()) {
        if (key.startsWith(id)) {
            drawableCache.delete(key);
        }
    }
}

// Clear all cache
export function clearAllCache() {
    drawableCache.clear();
}

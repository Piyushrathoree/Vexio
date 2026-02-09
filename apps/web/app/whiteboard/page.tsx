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
    | "diamond";

type ShapeType = "line" | "arrow" | "rect" | "ellipse" | "diamond";
type DrawableType = ShapeType | "pen";

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
}

interface PenElement extends BaseElement {
    type: "pen";
    points: StrokePoint[];
}

type DrawingElement = ShapeElement | PenElement;

type PointerMode = "drawing" | "panning" | "moving" | "erasing";

interface PointerState {
    mode: PointerMode;
    pointerId: number;
    lastWorld: Point;
    lastScreen: Point;
    elementId?: string;
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

const distance = (a: Point, b: Point): number => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
};

const clamp = (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, value));
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

const normalizeRect = (el: ShapeElement) => {
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

const isPointNearElement = (
    point: Point,
    el: DrawingElement,
    tolerance = 8
): boolean => {
    const threshold = Math.max(tolerance, el.thickness * 1.5);

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

    ctx.stroke();
};

const drawElement = (
    ctx: CanvasRenderingContext2D,
    el: DrawingElement
): void => {
    ctx.strokeStyle = el.color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

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

const minDrawableSize = 2;

export default function Home() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const panRef = useRef<Point>({ x: 0, y: 0 });
    const elementsRef = useRef<DrawingElement[]>([]);
    const draftRef = useRef<DrawingElement | null>(null);
    const pointerStateRef = useRef<PointerState | null>(null);
    const selectedIdRef = useRef<string | null>(null);

    const [tool, setTool] = useState<Tool>("select");
    const [color, setColor] = useState<string>(COLOR_PALETTE[0] ?? "#000000");
    const [thickness, setThickness] = useState<number>(3);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        selectedIdRef.current = selectedId;
    }, [selectedId]);

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

            for (const el of elementsRef.current) {
                drawElement(ctx, el);
            }

            if (draftRef.current) {
                drawElement(ctx, draftRef.current);
            }

            if (selectedIdRef.current) {
                const selectedElement = elementsRef.current.find(
                    (el) => el.id === selectedIdRef.current
                );

                if (selectedElement) {
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
                const element = elements[i];
                if (element && isPointNearElement(point, element)) {
                    return element;
                }
            }
            return null;
        },
        []
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

    const handlePointerDown = useCallback(
        (event: React.PointerEvent<HTMLCanvasElement>) => {
            event.preventDefault();
            const canvas = event.currentTarget;
            canvas.setPointerCapture(event.pointerId);

            const { world, screen } = getPoints(event);

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
                draftRef.current = {
                    id: buildId(),
                    type: tool,
                    color,
                    thickness,
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
            scheduleDraw();
        },
        [
            color,
            eraseAtPoint,
            getElementAtPoint,
            getPoints,
            scheduleDraw,
            thickness,
            tool,
        ]
    );

    const handlePointerMove = useCallback(
        (event: React.PointerEvent<HTMLCanvasElement>) => {
            const pointer = pointerStateRef.current;
            if (!pointer || pointer.pointerId !== event.pointerId) {
                return;
            }

            const { world, screen } = getPoints(event);

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
        [eraseAtPoint, getPoints, scheduleDraw]
    );

    const handlePointerUp = useCallback(
        (event: React.PointerEvent<HTMLCanvasElement>) => {
            const pointer = pointerStateRef.current;
            if (!pointer || pointer.pointerId !== event.pointerId) {
                return;
            }

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
                    }
                }

                draftRef.current = null;
            }

            pointerStateRef.current = null;

            try {
                event.currentTarget.releasePointerCapture(event.pointerId);
            } catch {
                // Ignore if pointer capture has already been released.
            }

            scheduleDraw();
        },
        [scheduleDraw]
    );

    const clearCanvas = useCallback(() => {
        elementsRef.current = [];
        draftRef.current = null;
        pointerStateRef.current = null;
        selectedIdRef.current = null;
        setSelectedId(null);
        scheduleDraw();
    }, [scheduleDraw]);

    const canvasCursorClass =
        tool === "hand"
            ? "cursor-grab"
            : tool === "select"
              ? "cursor-default"
              : tool === "eraser"
                ? "cursor-cell"
                : "cursor-crosshair";

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
                            onClick={() => setTool(item.id)}
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
                            onClick={() => setColor(swatch)}
                        />
                    ))}
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
                        onChange={(event) =>
                            setThickness(Number(event.target.value))
                        }
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

            <canvas
                ref={canvasRef}
                className={`block h-full w-full touch-none ${canvasCursorClass}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            />
        </main>
    );
}

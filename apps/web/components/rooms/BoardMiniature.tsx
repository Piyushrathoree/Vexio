// A real miniature of the board's contents, drawn on the dot grid in the
// board's own stroke colours.
//
// The server ships a capped, geometry-only `preview` (see buildPreview in
// packages/db/src/services/room.ts) precisely so this can exist: up to 80
// elements with x1/y1/x2/y2 corners, plus a decimated polyline for pen strokes.
// Shape construction here mirrors the canvas renderer in
// apps/web/app/whiteboard/[slug]/page.tsx (drawShape / getTriangleVertices /
// getStarVertices) so a thumbnail actually looks like the board it stands for.

import type { PreviewElement, RoomPreview } from "../../lib/rooms-api";

// The sheet's aspect ratio is pinned to this viewBox by CSS (.board-sheet),
// so preserveAspectRatio never has to letterbox.
const VB_W = 320;
const VB_H = 200;
const PAD = 16;

// A lone element scaled to fill the whole sheet reads as a lie about the
// board's density, and huge shapes lose their silhouette. Clamp the zoom.
const MAX_SCALE = 5;

// The canvas maps near-black ink to white on a dark board
// (getThemeAwareCanvasColor). The dashboard is always dark, so do the same
// here or every default-ink board would render as an empty sheet.
const DARK_INK = new Set(["#111827", "#000", "#000000", "rgb(17,24,39)", "rgb(0,0,0)"]);
const LIGHT_INK = "#e8ebf3";

function paint(color: string): string {
    const normalized = color.trim().toLowerCase().replace(/\s+/g, "");
    return DARK_INK.has(normalized) ? LIGHT_INK : color;
}

type Box = { minX: number; minY: number; maxX: number; maxY: number; w: number; h: number };

function box(el: PreviewElement): Box {
    const minX = Math.min(el.x1, el.x2);
    const maxX = Math.max(el.x1, el.x2);
    const minY = Math.min(el.y1, el.y2);
    const maxY = Math.max(el.y1, el.y2);
    return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

function pointsAttr(pts: { x: number; y: number }[]): string {
    return pts.map((p) => `${p.x},${p.y}`).join(" ");
}

const STAR_SPIKES = 5;
const STAR_INNER_RATIO = 0.42;

function starPoints(b: Box): { x: number; y: number }[] {
    const cx = b.minX + b.w / 2;
    const cy = b.minY + b.h / 2;
    const outerX = Math.max(1, b.w / 2);
    const outerY = Math.max(1, b.h / 2);
    const vertices: { x: number; y: number }[] = [];
    for (let i = 0; i < STAR_SPIKES * 2; i += 1) {
        const isOuter = i % 2 === 0;
        const rX = isOuter ? outerX : outerX * STAR_INNER_RATIO;
        const rY = isOuter ? outerY : outerY * STAR_INNER_RATIO;
        const angle = (Math.PI / STAR_SPIKES) * i - Math.PI / 2;
        vertices.push({ x: cx + Math.cos(angle) * rX, y: cy + Math.sin(angle) * rY });
    }
    return vertices;
}

function Element({ el, scale }: { el: PreviewElement; scale: number }) {
    const stroke = paint(el.color);
    const b = box(el);

    // Stroke width is held constant in screen units; anything measured in board
    // units (corner radii, arrowheads) is divided by the fit scale so it stays
    // legible whether the board is 200px or 20,000px across.
    const px = (n: number) => n / scale;

    const line = {
        stroke,
        strokeWidth: 1.35,
        fill: "none",
        vectorEffect: "non-scaling-stroke" as const,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
    };

    switch (el.type) {
        case "rect":
            return (
                <rect
                    x={b.minX}
                    y={b.minY}
                    width={b.w}
                    height={b.h}
                    rx={Math.min(px(3), b.w / 6, b.h / 6)}
                    {...line}
                />
            );

        case "ellipse":
            return (
                <ellipse
                    cx={b.minX + b.w / 2}
                    cy={b.minY + b.h / 2}
                    rx={Math.max(px(0.5), b.w / 2)}
                    ry={Math.max(px(0.5), b.h / 2)}
                    {...line}
                />
            );

        case "diamond": {
            const cx = b.minX + b.w / 2;
            const cy = b.minY + b.h / 2;
            return (
                <polygon
                    points={pointsAttr([
                        { x: cx, y: b.minY },
                        { x: b.maxX, y: cy },
                        { x: cx, y: b.maxY },
                        { x: b.minX, y: cy },
                    ])}
                    {...line}
                />
            );
        }

        case "triangle":
            return (
                <polygon
                    points={pointsAttr([
                        { x: b.minX + b.w / 2, y: b.minY },
                        { x: b.maxX, y: b.maxY },
                        { x: b.minX, y: b.maxY },
                    ])}
                    {...line}
                />
            );

        case "star":
            return <polygon points={pointsAttr(starPoints(b))} {...line} />;

        case "line":
            return <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} {...line} />;

        case "arrow": {
            const angle = Math.atan2(el.y2 - el.y1, el.x2 - el.x1);
            const head = px(7);
            const left = {
                x: el.x2 - head * Math.cos(angle - Math.PI / 7),
                y: el.y2 - head * Math.sin(angle - Math.PI / 7),
            };
            const right = {
                x: el.x2 - head * Math.cos(angle + Math.PI / 7),
                y: el.y2 - head * Math.sin(angle + Math.PI / 7),
            };
            return (
                <path
                    d={`M${el.x1} ${el.y1}L${el.x2} ${el.y2}M${left.x} ${left.y}L${el.x2} ${el.y2}L${right.x} ${right.y}`}
                    {...line}
                />
            );
        }

        case "pen": {
            const pts = el.points;
            if (!pts || pts.length === 0) return null;
            if (pts.length === 1) {
                const p = pts[0]!;
                return <circle cx={p.x} cy={p.y} r={px(1)} fill={stroke} />;
            }
            return <polyline points={pointsAttr(pts)} {...line} />;
        }

        // No text content travels in the preview, and glyphs would be illegible
        // at this size anyway — ruled lines are the drafting convention for
        // "copy goes here".
        case "text": {
            const rows = b.h * scale > 22 ? 3 : b.h * scale > 12 ? 2 : 1;
            const gap = b.h / (rows + 1);
            return (
                <g opacity={0.75}>
                    {Array.from({ length: rows }, (_, i) => (
                        <line
                            key={i}
                            x1={b.minX}
                            y1={b.minY + gap * (i + 1)}
                            x2={b.minX + b.w * (i === rows - 1 ? 0.62 : 1)}
                            y2={b.minY + gap * (i + 1)}
                            {...line}
                        />
                    ))}
                </g>
            );
        }

        case "sticky":
            return (
                <g>
                    <rect
                        x={b.minX}
                        y={b.minY}
                        width={b.w}
                        height={b.h}
                        fill={stroke}
                        opacity={0.18}
                    />
                    <rect
                        x={b.minX}
                        y={b.minY}
                        width={b.w}
                        height={b.h}
                        {...line}
                        opacity={0.7}
                    />
                </g>
            );

        default:
            return (
                <rect
                    x={b.minX}
                    y={b.minY}
                    width={b.w}
                    height={b.h}
                    strokeDasharray={`${px(4)} ${px(3)}`}
                    opacity={0.6}
                    {...line}
                />
            );
    }
}

export function BoardMiniature({ preview }: { preview: RoomPreview | null }) {
    if (!preview || preview.elements.length === 0) return null;

    const { bbox } = preview;

    // A board can legitimately be one horizontal line, in which case the bbox
    // has zero height. Floor both dimensions before they become divisors.
    const bw = Math.max(bbox.x2 - bbox.x1, 1);
    const bh = Math.max(bbox.y2 - bbox.y1, 1);

    const scale = Math.min((VB_W - PAD * 2) / bw, (VB_H - PAD * 2) / bh, MAX_SCALE);
    const tx = (VB_W - bw * scale) / 2 - bbox.x1 * scale;
    const ty = (VB_H - bh * scale) / 2 - bbox.y1 * scale;

    return (
        <svg
            className="board-thumb"
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            role="presentation"
            aria-hidden="true"
        >
            <g transform={`translate(${tx} ${ty}) scale(${scale})`}>
                {preview.elements.map((el, i) => (
                    <Element key={i} el={el} scale={scale} />
                ))}
            </g>
        </svg>
    );
}

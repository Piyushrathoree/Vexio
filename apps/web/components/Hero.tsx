import React from "react";
import Link from "next/link";
import {
    ArrowRight,
    MousePointer2,
    Pencil,
    Square,
    Type,
    Sparkles,
    Hand,
} from "lucide-react";

type CursorProps = {
    name: string;
    color: string;
    /** Small mono coordinate readout shown under the name tag — the
     *  canvas motif, addressed by position, not just by who's there. */
    coord?: string;
    className?: string;
    style?: React.CSSProperties;
};

const Cursor = ({ name, color, coord, className = "", style }: CursorProps) => (
    <div className={`pointer-events-none absolute ${className}`} style={style}>
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            style={{ filter: "drop-shadow(0 3px 6px rgba(0,0,0,.55))" }}
        >
            <path
                d="M4 2.5 11.5 20 14 13 21 10.5 4 2.5Z"
                fill={color}
                stroke="#0a0c12"
                strokeWidth="1.2"
                strokeLinejoin="round"
            />
        </svg>
        <div className="absolute left-4 top-4 flex flex-col items-start gap-1">
            <span className="cursor-tag" style={{ background: color }}>
                {name}
            </span>
            {coord && (
                <span className="coord rounded bg-[#0a0c12]/80 px-1.5 py-0.5">
                    {coord}
                </span>
            )}
        </div>
    </div>
);

const tools = [
    { icon: MousePointer2, label: "Select", active: false },
    { icon: Pencil, label: "Draw", active: true },
    { icon: Square, label: "Shape", active: false },
    { icon: Type, label: "Text", active: false },
    { icon: Sparkles, label: "AI", active: false },
];

const Hero = () => {
    return (
        <section className="relative z-10 px-4 pb-20 pt-14 md:pt-20">
            <div className="mx-auto max-w-5xl text-center">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-hairline bg-white/[0.03] px-3 py-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-mint)] opacity-70" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-mint)]" />
                    </span>
                    <span className="font-mono text-xs tracking-tight text-ink-dim">
                        LIVE · multiplayer canvas
                    </span>
                </div>

                <h1 className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight text-ink sm:text-6xl md:text-7xl">
                    The canvas where teams
                    <br />
                    <span className="relative inline-block">
                        think out loud
                        <svg
                            className="absolute -bottom-2 left-0 w-full"
                            height="14"
                            viewBox="0 0 300 14"
                            fill="none"
                            preserveAspectRatio="none"
                            aria-hidden
                        >
                            <path
                                className="hand-mark"
                                style={{ ["--len" as string]: "320", ["--d" as string]: "700ms" }}
                                d="M3 8C48 3 108 3 150 6C196 9 252 10 297 5"
                                stroke="var(--color-coral)"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />
                        </svg>
                    </span>
                    .
                </h1>

                <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-ink-dim">
                    Sketch together in real time, watch every cursor move, and
                    turn a plain-language prompt into a clean SVG — synced to
                    the pixel, for everyone in the room.
                </p>

                <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link
                        href="/signup"
                        className="btn-primary group inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-indigo)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]"
                    >
                        <Pencil className="h-[18px] w-[18px]" />
                        Start a board
                        <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-1" />
                    </Link>
                    <a
                        href="#collaborate"
                        className="btn-ghost inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-indigo)]"
                    >
                        <Hand className="h-[18px] w-[18px]" />
                        See it move
                    </a>
                </div>

                <p className="mt-6 font-mono text-xs text-ink-faint">
                    free to start · no credit card · unlimited boards
                </p>
            </div>

            {/* The living canvas — the product, rendering itself. Purely
                illustrative: the headline, sub-deck, and CTAs above already
                carry the message, so this is hidden from assistive tech
                rather than read aloud as real content. */}
            <div className="relative mx-auto mt-16 max-w-6xl" aria-hidden="true">
                <div className="aurora inset-x-10 -top-10 h-72 bg-[radial-gradient(circle,var(--color-violet),transparent_60%)]" />
                <div className="aurora inset-x-24 top-20 h-72 bg-[radial-gradient(circle,var(--color-indigo),transparent_60%)]" />

                <div className="artboard relative overflow-hidden">
                    {/* Top chrome */}
                    <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1.5">
                                <span className="h-3 w-3 rounded-full bg-[var(--color-coral)]/70" />
                                <span className="h-3 w-3 rounded-full bg-[var(--color-amber)]/70" />
                                <span className="h-3 w-3 rounded-full bg-[var(--color-mint)]/70" />
                            </div>
                            <span className="coord hidden sm:inline">
                                vexio / board · product-roadmap
                            </span>
                        </div>
                        <div className="flex items-center gap-2 rounded-full border border-hairline bg-white/[0.03] px-3 py-1">
                            <span className="flex -space-x-2">
                                {[
                                    "var(--color-indigo)",
                                    "var(--color-coral)",
                                    "var(--color-mint)",
                                ].map((c, i) => (
                                    <span
                                        key={i}
                                        className="grid h-5 w-5 place-items-center rounded-full border border-[#0a0c12] text-[9px] font-bold text-[#0a0c12]"
                                        style={{ background: c }}
                                    >
                                        {["A", "S", "J"][i]}
                                    </span>
                                ))}
                            </span>
                            <span className="font-mono text-[11px] text-ink-dim">
                                3 online
                            </span>
                        </div>
                    </div>

                    {/* Canvas body */}
                    <div className="relative h-[360px] sm:h-[440px] md:h-[500px]">
                        <svg
                            className="absolute inset-0 h-full w-full"
                            viewBox="0 0 1000 500"
                            fill="none"
                            preserveAspectRatio="xMidYMid meet"
                            aria-hidden
                        >
                            {/* box */}
                            <path
                                className="stroke-draw"
                                style={{ ["--len" as string]: "760", ["--d" as string]: "200ms" }}
                                d="M150 150 Q152 128 176 128 L360 132 Q384 130 383 154 L380 262 Q381 286 356 284 L172 280 Q148 282 150 258 Z"
                                stroke="var(--color-indigo)"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                            {/* arrow box -> circle */}
                            <path
                                className="stroke-draw"
                                style={{ ["--len" as string]: "260", ["--d" as string]: "900ms" }}
                                d="M395 205 C470 200 520 208 585 214"
                                stroke="var(--color-ink-dim)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />
                            <path
                                className="stroke-draw"
                                style={{ ["--len" as string]: "60", ["--d" as string]: "1250ms" }}
                                d="M566 202 L588 214 L568 228"
                                stroke="var(--color-ink-dim)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            {/* circle */}
                            <path
                                className="stroke-draw"
                                style={{ ["--len" as string]: "560", ["--d" as string]: "1050ms" }}
                                d="M690 130 C775 128 830 185 828 250 C826 315 762 352 692 344 C625 337 592 278 602 218 C610 168 645 138 690 130Z"
                                stroke="var(--color-violet)"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                            {/* star */}
                            <path
                                className="stroke-draw"
                                style={{ ["--len" as string]: "360", ["--d" as string]: "1500ms" }}
                                d="M712 210 L726 244 L762 247 L734 270 L744 305 L712 286 L680 305 L690 270 L662 247 L698 244 Z"
                                stroke="var(--color-amber)"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            {/* free squiggle bottom-left */}
                            <path
                                className="stroke-draw"
                                style={{ ["--len" as string]: "420", ["--d" as string]: "1750ms" }}
                                d="M180 400 C230 372 250 424 300 398 C350 372 372 424 430 400"
                                stroke="var(--color-mint)"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                        </svg>

                        {/* labels sitting on the sketch */}
                        <span
                            className="absolute left-[17%] top-[36%] font-hand text-lg text-ink"
                            style={{ transform: "rotate(-3deg)" }}
                        >
                            Idea
                        </span>
                        <span
                            className="absolute left-[17.5%] top-[81%] font-hand text-base text-[var(--color-mint)]"
                            style={{ transform: "rotate(-2deg)" }}
                        >
                            ship it →
                        </span>

                        {/* live cursors */}
                        <Cursor
                            name="Aanya"
                            color="var(--color-indigo)"
                            coord="x:260 y:150"
                            className="roam-a"
                            style={{ left: "26%", top: "30%" }}
                        />
                        <Cursor
                            name="Sam"
                            color="var(--color-coral)"
                            coord="x:580 y:290"
                            className="roam-b"
                            style={{ left: "58%", top: "58%" }}
                        />
                        <Cursor
                            name="Jordan"
                            color="var(--color-mint)"
                            coord="x:740 y:130"
                            className="roam-c"
                            style={{ left: "74%", top: "26%" }}
                        />
                    </div>

                    {/* Floating tool dock */}
                    <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2">
                        <div className="glass flex items-center gap-1 rounded-2xl px-2 py-1.5">
                            {tools.map((tool) => (
                                <div
                                    key={tool.label}
                                    className={`grid h-9 w-9 place-items-center rounded-xl transition-colors ${
                                        tool.active
                                            ? "bg-[var(--color-indigo)] text-[#0a0c12]"
                                            : "text-ink-dim"
                                    }`}
                                    title={tool.label}
                                >
                                    <tool.icon className="h-[18px] w-[18px]" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;

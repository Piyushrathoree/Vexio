"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

type IconDef = {
    prompt: string;
    color: string;
    paths: { d: string; fill?: boolean }[];
};

const ICONS: IconDef[] = [
    {
        prompt: "compass, terracotta",
        color: "#e04e1f",
        paths: [
            { d: "M14 40 a26 26 0 1 0 52 0 a26 26 0 1 0 -52 0" },
            { d: "M40 8 v10 M40 62 v10 M8 40 h10 M62 40 h10" },
            { d: "M40 18 L47 40 L40 62 L33 40 Z", fill: true },
        ],
    },
    {
        prompt: "lightning bolt, mint",
        color: "#5ce8a0",
        paths: [
            { d: "M44 8 L20 42 H38 L30 72 L62 32 H44 Z", fill: true },
        ],
    },
    {
        prompt: "cloud, outline",
        color: "#6e8cff",
        paths: [
            {
                d: "M24 54 H58 C67 54 72 47 72 40 C72 32 66 27 58 27 C56 18 48 14 40 14 C28 14 22 22 20 30 C12 32 8 38 8 45 C8 51 14 54 24 54 Z",
                fill: true,
            },
        ],
    },
    {
        prompt: "star, amber",
        color: "#e8aa5a",
        paths: [
            {
                d: "M40 8 L48 30 L72 30 L52 44 L60 68 L40 54 L20 68 L28 44 L8 30 L32 30 Z",
                fill: true,
            },
        ],
    },
];

const STAMPS = [
    { left: "7%", top: "8%", rotate: "-9deg" },
    { left: "76%", top: "12%", rotate: "7deg" },
    { left: "8%", top: "58%", rotate: "5deg" },
];

function Glyph({
    icon,
    size,
    drawing,
}: {
    icon: IconDef;
    size: number;
    drawing?: boolean;
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 80 80"
            fill="none"
            aria-hidden
        >
            {icon.paths.map((p, i) => (
                <path
                    key={i}
                    d={p.d}
                    pathLength={1}
                    stroke={icon.color}
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill={p.fill ? icon.color : "none"}
                    className={
                        drawing
                            ? p.fill
                                ? "icon-gen-fill"
                                : "icon-gen-stroke"
                            : undefined
                    }
                    style={
                        !drawing && p.fill ? { fillOpacity: 0.16 } : undefined
                    }
                />
            ))}
        </svg>
    );
}

export function IconGenerateBoard() {
    const [tick, setTick] = useState(0);
    const [reduce, setReduce] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        setReduce(mq.matches);
        if (mq.matches) return;
        const id = window.setInterval(() => setTick((t) => t + 1), 3600);
        return () => window.clearInterval(id);
    }, []);

    const index = tick % ICONS.length;
    const current = ICONS[index]!;
    const stampIds =
        reduce || tick === 0
            ? reduce
                ? [1, 2, 3]
                : []
            : [tick - 1, tick - 2, tick - 3].filter((t) => t >= 0);

    return (
        <div className="relative min-h-[360px] overflow-hidden rounded-2xl bg-[#191a1f] sm:min-h-[420px]">
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage:
                        "radial-gradient(circle, rgba(255,236,210,0.1) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                }}
                aria-hidden
            />

            <svg
                className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
                viewBox="0 0 560 420"
                fill="none"
                aria-hidden
            >
                <path
                    d="M70 300 C150 250 200 330 290 270 C360 220 410 300 500 250"
                    stroke="#c47a30"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                />
                <rect
                    x="380"
                    y="48"
                    width="120"
                    height="72"
                    rx="12"
                    stroke="#6e8cff"
                    strokeWidth="2"
                />
            </svg>

            {stampIds.map((id, i) => {
                const icon = ICONS[id % ICONS.length]!;
                const pos = STAMPS[i];
                if (!pos) return null;
                return (
                    <div
                        key={`${id}-${i}`}
                        className="absolute"
                        style={{
                            left: pos.left,
                            top: pos.top,
                            transform: `rotate(${pos.rotate})`,
                        }}
                    >
                        <Glyph icon={icon} size={72} />
                    </div>
                );
            })}

            <div className="absolute inset-x-0 top-[18%] flex flex-col items-center sm:top-[16%]">
                <div className="relative grid h-[168px] w-[168px] place-items-center sm:h-[188px] sm:w-[188px]">
                    <span
                        className="icon-gen-ring pointer-events-none absolute inset-3 rounded-full border"
                        style={{ borderColor: `${current.color}55` }}
                    />
                    <div key={tick} className="icon-gen-stage">
                        <Glyph icon={current} size={152} drawing={!reduce} />
                    </div>
                </div>
            </div>

            <div className="absolute bottom-4 left-1/2 z-10 w-[min(92%,420px)] -translate-x-1/2">
                <div className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-[#101218]/95 px-3 py-2.5 shadow-xl">
                    <span
                        className="grid h-7 w-7 place-items-center rounded-lg"
                        style={{ background: `${current.color}22` }}
                    >
                        <Sparkles
                            className="h-3.5 w-3.5"
                            style={{ color: current.color }}
                        />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs text-white/70">
                        <span key={`p-${tick}`} className="icon-gen-prompt">
                            {current.prompt}
                        </span>
                    </span>
                    <span
                        className="hidden rounded-md px-2.5 py-1 text-[10px] font-semibold text-white sm:inline"
                        style={{ background: current.color }}
                    >
                        Generate
                    </span>
                </div>
            </div>
        </div>
    );
}

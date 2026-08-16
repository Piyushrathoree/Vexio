import { MousePointer2, Pencil, Square, Type, Sparkles } from "lucide-react";

const tools = [
    { icon: MousePointer2, label: "Select", active: false },
    { icon: Pencil, label: "Draw", active: true },
    { icon: Square, label: "Shape", active: false },
    { icon: Type, label: "Text", active: false },
    { icon: Sparkles, label: "AI", active: false },
];

export default function DemoSection() {
    return (
        <section
            id="demo"
            className="w-full scroll-mt-20 bg-[#f2ede2] px-4 pb-12 pt-16 sm:px-6 sm:pb-16 sm:pt-20"
        >
            <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
                <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-[#e04e1f]">
                    See it in action
                </span>
                <h2 className="font-display text-2xl font-semibold text-[#1a1916] sm:text-3xl md:text-4xl">
                    Watch how it works
                </h2>
            </div>

            <div className="mx-auto w-full max-w-5xl" aria-hidden="true">
                <div className="relative overflow-hidden rounded-2xl bg-[#1a1916] shadow-xl shadow-[#1a1916]/10 ring-1 ring-[#1a1916]/8">
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1.5">
                                <span className="h-3 w-3 rounded-full bg-[#e04e1f]/80" />
                                <span className="h-3 w-3 rounded-full bg-[#c47a30]/80" />
                                <span className="h-3 w-3 rounded-full bg-[#5c8865]/80" />
                            </div>
                            <span className="hidden font-mono text-[11px] text-white/40 sm:inline">
                                vexio / board · product-roadmap
                            </span>
                        </div>
                        <span className="font-mono text-[11px] text-white/40">
                            3 online
                        </span>
                    </div>

                    <div className="relative h-[280px] sm:h-[380px] md:h-[440px]">
                        <svg
                            className="absolute inset-0 h-full w-full"
                            viewBox="0 0 1000 500"
                            fill="none"
                            preserveAspectRatio="xMidYMid meet"
                        >
                            <path
                                className="stroke-draw"
                                style={{
                                    ["--len" as string]: "760",
                                    ["--d" as string]: "200ms",
                                }}
                                d="M150 150 Q152 128 176 128 L360 132 Q384 130 383 154 L380 262 Q381 286 356 284 L172 280 Q148 282 150 258 Z"
                                stroke="#e04e1f"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                            <path
                                className="stroke-draw"
                                style={{
                                    ["--len" as string]: "260",
                                    ["--d" as string]: "900ms",
                                }}
                                d="M395 205 C470 200 520 208 585 214"
                                stroke="#7a7770"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />
                            <path
                                className="stroke-draw"
                                style={{
                                    ["--len" as string]: "560",
                                    ["--d" as string]: "1050ms",
                                }}
                                d="M690 130 C775 128 830 185 828 250 C826 315 762 352 692 344 C625 337 592 278 602 218 C610 168 645 138 690 130Z"
                                stroke="#e8aa5a"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                            <path
                                className="stroke-draw"
                                style={{
                                    ["--len" as string]: "420",
                                    ["--d" as string]: "1750ms",
                                }}
                                d="M180 400 C230 372 250 424 300 398 C350 372 372 424 430 400"
                                stroke="#5c8865"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                        </svg>
                        <span
                            className="absolute left-[17%] top-[36%] text-lg font-semibold text-[#f9f6ef]"
                            style={{ transform: "rotate(-3deg)" }}
                        >
                            Idea
                        </span>
                    </div>

                    <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2">
                        <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-[#141410]/90 px-2 py-1.5">
                            {tools.map((tool) => (
                                <div
                                    key={tool.label}
                                    className={`grid h-9 w-9 place-items-center rounded-xl ${
                                        tool.active
                                            ? "bg-[#c47a30]/20 text-[#e8aa5a]"
                                            : "text-white/40"
                                    }`}
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
}

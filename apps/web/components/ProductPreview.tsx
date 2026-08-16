import { MousePointer2, Pencil, Square, Type, Sparkles, Undo2, Redo2 } from "lucide-react";
import { HeroBoardDrawing } from "./BoardSketch";

const tools = [
    { icon: MousePointer2, active: false },
    { icon: Pencil, active: true },
    { icon: Square, active: false },
    { icon: Type, active: false },
    { icon: Sparkles, active: false },
];

export default function ProductPreview() {
    return (
        <div
            id="demo"
            className="relative overflow-hidden rounded-2xl border border-[#1a1916]/10 bg-[#191a1f] shadow-[0_40px_100px_-32px_rgba(26,25,22,0.55)]"
        >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2.5 sm:px-4">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#e04e1f]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#c47a30]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#5c8865]" />
                    </div>
                    <span className="hidden text-[11px] font-medium text-white/45 sm:inline">
                        q3-launch · checkout
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="hidden items-center gap-1.5 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-[#5ce8a0] sm:flex">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#5ce8a0]" />
                        live
                    </span>
                    <span className="flex -space-x-1.5">
                        {[
                            { c: "#e04e1f", l: "A" },
                            { c: "#4b7bec", l: "M" },
                            { c: "#5c8865", l: "L" },
                        ].map((p) => (
                            <span
                                key={p.l}
                                className="grid h-5 w-5 place-items-center rounded-full border-2 border-[#191a1f] text-[8px] font-bold text-white"
                                style={{ background: p.c }}
                            >
                                {p.l}
                            </span>
                        ))}
                    </span>
                </div>
            </div>

            <div className="relative h-[300px] sm:h-[400px] md:h-[480px]">
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        backgroundImage:
                            "radial-gradient(circle, rgba(255,236,210,0.11) 1px, transparent 1px)",
                        backgroundSize: "22px 22px",
                    }}
                    aria-hidden
                />

                <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-xl border border-white/[0.08] bg-[#12131a]/95 px-1.5 py-1 shadow-lg">
                    {tools.map((tool, i) => (
                        <div
                            key={i}
                            className={`grid h-8 w-8 place-items-center rounded-lg ${
                                tool.active
                                    ? "bg-[#e04e1f]/20 text-[#ff8a62]"
                                    : "text-white/40"
                            }`}
                        >
                            <tool.icon className="h-4 w-4" />
                        </div>
                    ))}
                    <span className="mx-1 h-5 w-px bg-white/10" />
                    <Undo2 className="mx-1 h-3.5 w-3.5 text-white/30" />
                    <Redo2 className="mx-1 h-3.5 w-3.5 text-white/30" />
                </div>

                <HeroBoardDrawing />
            </div>
        </div>
    );
}

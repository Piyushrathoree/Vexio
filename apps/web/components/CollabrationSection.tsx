import React from "react";
import {
    Users,
    Zap,
    MessageSquare,
    Eye,
    Layers,
    PenTool,
    MousePointer2,
} from "lucide-react";
import Reveal from "./Reveal";

const features = [
    { icon: Zap, text: "Instant sync" },
    { icon: Users, text: "Live cursors" },
    { icon: Eye, text: "Shared presence" },
    { icon: MessageSquare, text: "In-canvas comments" },
];

const useCases = [
    {
        icon: Users,
        title: "Team brainstorming",
        description: "Throw ideas on the board together, in the same moment.",
        color: "var(--color-indigo)",
    },
    {
        icon: Layers,
        title: "Design prototyping",
        description: "Sketch, arrange, and iterate on flows as a group.",
        color: "var(--color-violet)",
    },
    {
        icon: PenTool,
        title: "Visual documentation",
        description: "Living diagrams that change as your thinking does.",
        color: "var(--color-mint)",
    },
    {
        icon: MessageSquare,
        title: "Contextual feedback",
        description: "Leave a note exactly where it belongs on the canvas.",
        color: "var(--color-coral)",
    },
];

const notes = [
    { label: "Landing page", color: "var(--color-indigo)", cls: "left-6 top-8 w-40 -rotate-2" },
    { label: "Auth flow", color: "var(--color-coral)", cls: "right-8 top-14 w-32 rotate-3" },
    { label: "Data layer", color: "var(--color-mint)", cls: "left-16 bottom-8 w-44 rotate-1" },
];

const CollaborationSection = () => {
    return (
        <section id="collaborate" className="relative z-10 px-4 py-24">
            <div className="mx-auto max-w-6xl">
                <div className="grid items-center gap-12 lg:grid-cols-2">
                    {/* Left: copy */}
                    <Reveal>
                        <p className="coord mb-4">// real-time · x:0 y:0</p>
                        <h2 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
                            Work together,
                            <br />
                            <span className="text-[var(--color-indigo)]">
                                move fast.
                            </span>
                        </h2>
                        <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-dim">
                            Everyone draws, edits, and thinks on the same board
                            at once. Live cursors and instant sync make working
                            together feel like standing at one whiteboard — not
                            waiting on a refresh.
                        </p>

                        <div className="mt-8 grid gap-3 sm:grid-cols-2">
                            {features.map((feature) => (
                                <div
                                    key={feature.text}
                                    className="flex items-center gap-3 rounded-xl border border-hairline bg-white/[0.02] px-4 py-3"
                                >
                                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--color-indigo)]/12 text-[var(--color-indigo)]">
                                        <feature.icon className="h-4 w-4" />
                                    </span>
                                    <span className="text-sm font-medium text-ink">
                                        {feature.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Reveal>

                    {/* Right: mini live board */}
                    <Reveal delay={120}>
                        <div className="artboard overflow-hidden">
                            <div className="flex items-center gap-2 border-b border-hairline px-4 py-2.5">
                                {["Select", "Draw", "Shape", "Text"].map(
                                    (tool, i) => (
                                        <span
                                            key={tool}
                                            className={`rounded-md px-2.5 py-1 font-mono text-[11px] ${
                                                i === 1
                                                    ? "bg-[var(--color-indigo)] text-[#0a0c12]"
                                                    : "text-ink-dim"
                                            }`}
                                        >
                                            {tool}
                                        </span>
                                    )
                                )}
                            </div>

                            <div className="relative h-72">
                                {notes.map((note) => (
                                    <div
                                        key={note.label}
                                        className={`absolute rounded-lg border bg-white/[0.03] px-3 py-4 text-center ${note.cls}`}
                                        style={{ borderColor: note.color }}
                                    >
                                        <span
                                            className="font-hand text-sm"
                                            style={{ color: note.color }}
                                        >
                                            {note.label}
                                        </span>
                                    </div>
                                ))}

                                <svg
                                    className="absolute inset-0 h-full w-full"
                                    viewBox="0 0 400 288"
                                    fill="none"
                                    aria-hidden
                                >
                                    <path
                                        d="M120 70 L250 96"
                                        stroke="var(--color-ink-faint)"
                                        strokeWidth="1.5"
                                        strokeDasharray="5 5"
                                    />
                                    <path
                                        d="M110 210 L250 110"
                                        stroke="var(--color-ink-faint)"
                                        strokeWidth="1.5"
                                        strokeDasharray="5 5"
                                    />
                                </svg>

                                <div
                                    className="roam-a pointer-events-none absolute left-[30%] top-[26%]"
                                    aria-hidden
                                >
                                    <MousePointer2
                                        className="h-5 w-5"
                                        style={{
                                            color: "var(--color-coral)",
                                            fill: "var(--color-coral)",
                                        }}
                                    />
                                    <span
                                        className="cursor-tag"
                                        style={{ background: "var(--color-coral)" }}
                                    >
                                        Sam
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-hairline px-4 py-2.5">
                                <div className="flex -space-x-2">
                                    {[
                                        "var(--color-indigo)",
                                        "var(--color-coral)",
                                        "var(--color-mint)",
                                    ].map((c, i) => (
                                        <span
                                            key={i}
                                            className="grid h-6 w-6 place-items-center rounded-full border border-[#0a0c12] text-[10px] font-bold text-[#0a0c12]"
                                            style={{ background: c }}
                                        >
                                            {["A", "S", "J"][i]}
                                        </span>
                                    ))}
                                </div>
                                <span className="font-mono text-[11px] text-ink-dim">
                                    3 collaborators online
                                </span>
                            </div>
                        </div>
                    </Reveal>
                </div>

                {/* Use cases */}
                <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {useCases.map((useCase, i) => (
                        <Reveal key={useCase.title} delay={i * 80}>
                            <div className="group h-full rounded-2xl border border-hairline bg-white/[0.02] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.04]">
                                <span
                                    className="mb-4 grid h-11 w-11 place-items-center rounded-xl"
                                    style={{
                                        background: `color-mix(in oklab, ${useCase.color} 14%, transparent)`,
                                        color: useCase.color,
                                    }}
                                >
                                    <useCase.icon className="h-5 w-5" />
                                </span>
                                <h3 className="font-display text-lg font-bold text-ink">
                                    {useCase.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-ink-dim">
                                    {useCase.description}
                                </p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CollaborationSection;

import React from "react";
import { PenTool, Users, Sparkles, Zap } from "lucide-react";
import Reveal from "./Reveal";

const points = [
    { icon: PenTool, text: "Draw without limits", color: "var(--color-indigo)" },
    { icon: Users, text: "Collaborate instantly", color: "var(--color-coral)" },
    { icon: Sparkles, text: "Generate with AI", color: "var(--color-violet)" },
    { icon: Zap, text: "Stay in flow", color: "var(--color-amber)" },
];

const WhySection = () => {
    return (
        <section id="why" className="relative z-10 px-4 py-24">
            <div className="mx-auto max-w-4xl text-center">
                <Reveal>
                    <p className="coord mb-4">{"// why vexio"}</p>
                    <h2 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-6xl">
                        More than a{" "}
                        <span className="relative inline-block">
                            whiteboard.
                            <svg
                                className="absolute -bottom-2 left-0 w-full"
                                height="12"
                                viewBox="0 0 260 12"
                                fill="none"
                                preserveAspectRatio="none"
                                aria-hidden
                            >
                                <path
                                    d="M4 7C50 3 120 3 168 6C210 8 240 9 256 5"
                                    stroke="var(--color-indigo)"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </span>
                    </h2>
                    <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-ink-dim">
                        Vexio removes the friction between thinking and creating.
                        The freedom of sketching, the reach of AI, and real-time
                        collaboration — folded into one focused workspace.
                    </p>
                </Reveal>

                <div className="mt-10 flex flex-wrap justify-center gap-3">
                    {points.map((point, i) => (
                        <Reveal key={point.text} delay={i * 70}>
                            <div className="flex items-center gap-2.5 rounded-full border border-hairline bg-white/[0.03] px-4 py-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20">
                                <point.icon
                                    className="h-4 w-4"
                                    style={{ color: point.color }}
                                />
                                <span className="text-sm font-medium text-ink">
                                    {point.text}
                                </span>
                            </div>
                        </Reveal>
                    ))}
                </div>

                <Reveal delay={120} className="mt-14">
                    <figure className="relative mx-auto max-w-2xl rounded-3xl border border-hairline bg-white/[0.02] p-8 sm:p-10">
                        <Sparkles
                            className="twinkle absolute -left-3 -top-3 h-7 w-7 text-[var(--color-violet)]"
                            aria-hidden
                        />
                        <div
                            className="mb-3 font-display text-6xl leading-none text-[var(--color-indigo)]/40"
                            aria-hidden
                        >
                            &ldquo;
                        </div>
                        <blockquote className="text-xl leading-relaxed text-ink">
                            Finally, a tool that keeps up with how fast a whole
                            room can think. Ideas hit the canvas the moment
                            someone has them, and it doesn&apos;t matter whose
                            cursor gets there first.
                        </blockquote>
                        <figcaption className="mt-6 flex items-center justify-center gap-3">
                            <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-indigo)] font-bold text-[#0a0c12]">
                                M
                            </span>
                            <span className="text-left">
                                <span className="block text-sm font-medium text-ink">
                                    Maya Okafor
                                </span>
                                <span className="block font-mono text-xs text-ink-faint">
                                    Product Designer
                                </span>
                            </span>
                        </figcaption>
                    </figure>
                </Reveal>
            </div>
        </section>
    );
};

export default WhySection;

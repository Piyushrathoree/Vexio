import React from "react";
import Link from "next/link";
import { ArrowRight, Pencil, Star } from "lucide-react";
import Reveal from "./Reveal";

const trust = ["Free to start", "No credit card", "Unlimited boards"];

const CTASection = () => {
    return (
        <section className="relative z-10 px-4 py-24">
            <Reveal className="mx-auto max-w-4xl">
                <div className="artboard relative overflow-hidden">
                    <div className="aurora inset-x-1/4 -top-16 h-64 bg-[radial-gradient(circle,var(--color-indigo),transparent_60%)]" />

                    {/* Chrome strip — the same board, still open. Echoes the
                        hero's artboard so the close feels like the same
                        product, not a new marketing slab. */}
                    <div
                        className="relative flex items-center justify-between border-b border-hairline px-4 py-3"
                        aria-hidden="true"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1.5">
                                <span className="h-3 w-3 rounded-full bg-[var(--color-coral)]/70" />
                                <span className="h-3 w-3 rounded-full bg-[var(--color-amber)]/70" />
                                <span className="h-3 w-3 rounded-full bg-[var(--color-mint)]/70" />
                            </div>
                            <span className="coord hidden sm:inline">
                                vexio / board · your-next-idea
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

                    <div className="relative px-6 py-14 text-center sm:px-12 sm:py-16">
                        <p className="coord mb-4">// let&apos;s go</p>
                        <h2 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-6xl">
                            Your next idea,
                            <br />
                            <span className="relative inline-block bg-linear-to-r from-[var(--color-indigo)] via-[var(--color-violet)] to-[var(--color-coral)] bg-clip-text text-transparent">
                                out loud.
                                <svg
                                    className="absolute -bottom-2 left-0 w-full"
                                    height="14"
                                    viewBox="0 0 220 14"
                                    fill="none"
                                    preserveAspectRatio="none"
                                    aria-hidden
                                >
                                    <path
                                        className="hand-mark"
                                        style={{
                                            ["--len" as string]: "260",
                                            ["--d" as string]: "650ms",
                                        }}
                                        d="M3 8C40 3 90 3 120 6C154 9 196 10 217 5"
                                        stroke="var(--color-coral)"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </span>
                        </h2>
                        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-dim">
                            Start a board, invite your team, and turn ideas into
                            visuals in the same breath. No setup, no friction — just
                            the canvas.
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
                                href="https://github.com/Piyushrathoree/vexio"
                                target="_blank"
                                rel="noreferrer"
                                className="btn-ghost inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-indigo)]"
                            >
                                <Star className="h-[18px] w-[18px]" />
                                Star on GitHub
                            </a>
                        </div>

                        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                            {trust.map((item) => (
                                <span
                                    key={item}
                                    className="flex items-center gap-2 font-mono text-xs text-ink-faint"
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-mint)]" />
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </Reveal>
        </section>
    );
};

export default CTASection;

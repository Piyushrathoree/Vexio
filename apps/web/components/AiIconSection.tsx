"use client";

import React, { useState, useEffect } from "react";
import {
    Sparkles,
    Wand2,
    Palette,
    Edit3,
    Check,
    Zap,
    Database,
    Cloud,
} from "lucide-react";
import Reveal from "./Reveal";

const prompts = [
    { text: '"Minimal lightning bolt icon"', chip: "lightning", icon: Zap },
    { text: '"Rounded database icon, hand-drawn"', chip: "database", icon: Database },
    { text: '"Simple cloud icon, outline"', chip: "cloud", icon: Cloud },
];

const benefits = [
    {
        icon: Wand2,
        title: "No design skills",
        description: "Describe what you need in plain English.",
    },
    {
        icon: Sparkles,
        title: "Instant results",
        description: "Clean, scalable SVGs in a couple of seconds.",
    },
    {
        icon: Palette,
        title: "On-brand style",
        description: "Icons that match the board they live on.",
    },
    {
        icon: Edit3,
        title: "Fully editable",
        description: "Resize, recolor, and reshape after the fact.",
    },
];

const AISection = () => {
    const [activePrompt, setActivePrompt] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showResult, setShowResult] = useState(true);

    useEffect(() => {
        // Respect the same reduced-motion preference the CSS layer honors —
        // the demo stays put on its first prompt but is still clickable.
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }

        const interval = setInterval(() => {
            setIsGenerating(true);
            setShowResult(false);

            const genTimer = setTimeout(() => {
                setIsGenerating(false);
                setShowResult(true);
            }, 1200);

            const nextTimer = setTimeout(() => {
                setActivePrompt((prev) => (prev + 1) % prompts.length);
            }, 3000);

            return () => {
                clearTimeout(genTimer);
                clearTimeout(nextTimer);
            };
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    const pick = (index: number) => {
        setActivePrompt(index);
        setIsGenerating(true);
        setShowResult(false);
        setTimeout(() => {
            setIsGenerating(false);
            setShowResult(true);
        }, 900);
    };

    const ResultIcon = prompts[activePrompt]!.icon;

    return (
        <section id="ai" className="relative z-10 px-4 py-24">
            <div className="mx-auto max-w-6xl">
                <Reveal className="mx-auto max-w-2xl text-center">
                    <p className="coord mb-4">{"// ai · prompt → svg"}</p>
                    <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
                        Describe it.{" "}
                        <em className="text-[var(--color-accent)]">Generate it.</em>
                    </h2>
                    <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-dim">
                        Type a plain-language prompt and get a clean, scalable
                        SVG that drops straight onto the board. No design tools,
                        no imports, no switching tabs.
                    </p>
                </Reveal>

                <Reveal delay={100} className="mx-auto mt-14 max-w-4xl">
                    <div className="artboard overflow-hidden">
                        <div className="flex items-center gap-2 border-b border-hairline px-5 py-3.5">
                            <Sparkles className="h-4 w-4 text-[var(--color-violet)]" aria-hidden />
                            <span className="font-mono text-sm text-ink-dim">
                                ai-icon-generator
                            </span>
                        </div>

                        <div className="grid items-center gap-8 p-6 md:grid-cols-2 md:p-8">
                            {/* prompt column */}
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
                                        Your prompt
                                    </label>
                                    <div className="rounded-xl border border-[var(--color-violet)]/30 bg-[var(--color-canvas)] px-4 py-4 font-mono text-sm text-ink">
                                        {prompts[activePrompt]!.text}
                                        <span className="blink ml-0.5 text-[var(--color-violet)]">
                                            |
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {prompts.map((prompt, index) => (
                                        <button
                                            key={prompt.chip}
                                            onClick={() => pick(index)}
                                            className={`rounded-full px-3 py-1.5 font-mono text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet)] ${
                                                activePrompt === index
                                                    ? "bg-[var(--color-violet)] text-[#0a0c12]"
                                                    : "border border-hairline text-ink-dim hover:text-ink"
                                            }`}
                                        >
                                            {prompt.chip}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => pick(activePrompt)}
                                    disabled={isGenerating}
                                    className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet)] disabled:opacity-90"
                                >
                                    {isGenerating ? (
                                        <>
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a0c12]/30 border-t-[#0a0c12] motion-reduce:animate-none" />
                                            Generating…
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="h-4 w-4" aria-hidden />
                                            Generate icon
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* result column */}
                            <div className="flex flex-col items-center justify-center">
                                <div
                                    className={`grid h-36 w-36 place-items-center rounded-2xl border transition-all duration-500 ${
                                        showResult
                                            ? "scale-100 border-[var(--color-violet)]/40 bg-[var(--color-violet)]/10 text-[var(--color-violet)]"
                                            : "scale-95 border-hairline bg-white/[0.02] text-ink-faint"
                                    }`}
                                >
                                    {isGenerating ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <Sparkles className="h-8 w-8 twinkle text-[var(--color-violet)]" aria-hidden />
                                            <span className="font-mono text-[11px] text-ink-faint">
                                                creating…
                                            </span>
                                        </div>
                                    ) : showResult ? (
                                        <ResultIcon className="h-14 w-14" />
                                    ) : (
                                        <Sparkles className="h-8 w-8 opacity-30" aria-hidden />
                                    )}
                                </div>

                                <div
                                    className={`mt-4 flex items-center gap-2 text-sm text-[var(--color-mint)] transition-opacity ${
                                        showResult ? "opacity-100" : "opacity-0"
                                    }`}
                                >
                                    <Check className="h-4 w-4" aria-hidden />
                                    <span className="font-mono text-xs">
                                        svg ready to drop in
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Reveal>

                <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {benefits.map((benefit, i) => (
                        <Reveal key={benefit.title} delay={i * 80}>
                            <div className="h-full rounded-2xl border border-hairline bg-white/[0.02] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.04]">
                                <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-[var(--color-violet)]/12 text-[var(--color-violet)]">
                                    <benefit.icon className="h-5 w-5" />
                                </span>
                                <h3 className="font-display text-lg font-bold text-ink">
                                    {benefit.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-ink-dim">
                                    {benefit.description}
                                </p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AISection;

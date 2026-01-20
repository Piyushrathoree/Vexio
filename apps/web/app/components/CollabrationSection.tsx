import React from "react";
import { Users, Zap, MessageSquare, Eye, Layers, PenTool } from "lucide-react";
import Badge from "./custom/badge";
import { kalam, ranchers } from "../fonts";

const useCases = [
    {
        icon: Users,
        title: "Team Brainstorming",
        description: "Collaborate on ideas with your team in real-time.",
    },
    {
        icon: Layers,
        title: "Design Prototyping",
        description: "Create and iterate on designs together.",
    },
    {
        icon: PenTool,
        title: "Visual Documentation",
        description: "Build living documents that evolve with your ideas.",
    },
    {
        icon: MessageSquare,
        title: "Contextual Feedback",
        description: "Leave comments exactly where they matter.",
    },
];

const CollaborationSection = () => {
    return (
        <section className="py-24">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                {/* Header */}
                <div className="max-w-3xl mb-16">
                    <Badge className2="mb-4" text="Real-Time Collaboration"/>
                    <h2
                        className={`font-display text-5xl font-bold text-slate-900 mb-6 ${ranchers.className}`}
                    >
                        <span className="text-gradient">Work together</span>
                        <br />
                        <span className="text-gradient">move fast</span>
                    </h2>

                    <p
                        className={`text-lg ${kalam.className} text-black/60 mb-8 w-[35vw] leading-relaxed`}
                    >
                        Multiple users can draw, edit, and brainstorm
                        together in real time. Live cursors, instant
                            updates, and smooth syncing make collaboration feel
                            natural and fast—not clunky.
                        </p>

                        {/* Features list */}
                        <div className="grid sm:grid-cols-2 gap-4 mb-8">
                            {[
                                { icon: Zap, text: "Instant sync" },
                                { icon: Users, text: "Live cursors" },
                                { icon: Eye, text: "Shared presence" },
                                {
                                    icon: MessageSquare,
                                    text: "In-canvas comments",
                                },
                            ].map((feature, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-slate-200 shadow-soft"
                                >
                                    <div className="w-8 h-8 rounded-md bg-indigo-50 flex items-center justify-center">
                                        <feature.icon className="w-4 h-4 text-primary" />
                                    </div>
                                    <span className="font-medium text-slate-900">
                                        {feature.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Visual */}
                    <div className="relative">
                        {/* Canvas preview */}
                        <div className="relative rounded-2xl border-2 border-border/50 bg-card shadow-2xl overflow-hidden">
                            {/* Toolbar */}
                            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                                {[
                                    "Select",
                                    "Draw",
                                    "Shape",
                                    "Text",
                                    "Image",
                                ].map((tool, i) => (
                                    <button
                                        key={tool}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                            i === 1
                                                ? "bg-indigo-500 text-white"
                                                : "text-slate-700 hover:bg-slate-100"
                                        }`}
                                    >
                                        {tool}
                                    </button>
                                ))}
                            </div>

                            {/* Canvas */}
                            <div className="relative h-80 p-6">
                                {/* Grid */}
                                <div
                                    className="absolute inset-0 opacity-[0.03]"
                                    style={{
                                        backgroundImage:
                                            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
                                        backgroundSize: "20px 20px",
                                    }}
                                />

                                {/* Collaborative elements */}
                                <div className="relative h-full">
                                    {/* User 1 drawing a box */}
                                    <div className="absolute top-4 left-4">
                                        {/* <CursorPointer color="#6366f1" name="Alex" className="animate-cursor-move" /> */}
                                    </div>
                                    <div className="absolute top-12 left-8 w-36 h-24 rounded-lg border-2 border-indigo-400/60 bg-indigo-50 flex items-center justify-center animate-pulse-soft">
                                        <span className="text-sm text-indigo-600 font-medium">
                                            Landing Page
                                        </span>
                                    </div>

                                    {/* User 2 drawing */}
                                    <div className="absolute top-8 right-8">
                                        {/* <CursorPointer color="#f97316" name="Sam" className="animate-cursor-move-alt" /> */}
                                    </div>
                                    <div className="absolute top-16 right-12 w-28 h-20 rounded-lg border-2 border-orange-400/60 bg-orange-50 flex items-center justify-center">
                                        <span className="text-sm text-orange-500 font-medium">
                                            Auth
                                        </span>
                                    </div>

                                    {/* User 3 */}
                                    <div className="absolute bottom-20 left-1/3">
                                        {/* <CursorPointer color="#14b8a6" name="Jordan" className="animate-cursor-move" /> */}
                                    </div>
                                    <div className="absolute bottom-8 left-1/4 w-40 h-16 rounded-lg border-2 border-emerald-400/60 bg-emerald-50 flex items-center justify-center">
                                        <span className="text-sm text-emerald-600 font-medium">
                                            Database Layer
                                        </span>
                                    </div>

                                    {/* Connection lines */}
                                    <svg
                                        className="absolute inset-0 w-full h-full pointer-events-none"
                                        viewBox="0 0 400 300"
                                    >
                                        <path
                                            d="M120 60 L200 60 L200 140"
                                            stroke="hsl(var(--muted-foreground))"
                                            strokeWidth="2"
                                            strokeDasharray="4 4"
                                            fill="none"
                                            opacity="0.3"
                                        />
                                        <path
                                            d="M200 140 L280 100"
                                            stroke="hsl(var(--muted-foreground))"
                                            strokeWidth="2"
                                            strokeDasharray="4 4"
                                            fill="none"
                                            opacity="0.3"
                                        />
                                    </svg>
                                </div>
                            </div>

                            {/* Participants bar */}
                            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-200">
                                <div className="flex -space-x-2">
                                    {["#6366f1", "#f97316", "#14b8a6"].map(
                                        (color, i) => (
                                            <div
                                                key={i}
                                                className="w-7 h-7 rounded-full border-2 border-card flex items-center justify-center text-xs font-bold text-white"
                                                style={{
                                                    backgroundColor: color,
                                                }}
                                            >
                                                {["A", "S", "J"][i]}
                                            </div>
                                        )
                                    )}
                                </div>
                                <span className="text-xs text-slate-600">
                                    3 collaborators online
                                </span>
                            </div>
                        </div>

                        {/* Decorative elements */}
                        {/* <SketchSparkle className="absolute -top-4 -right-4 w-8 h-8 text-accent animate-pulse-soft" />
            <SketchSparkle className="absolute -bottom-2 -left-2 w-6 h-6 text-primary animate-float" /> */}
                    </div>
                </div>

                {/* Use Cases */}
                <div className="mt-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {useCases.map((useCase, index) => (
                        <div
                            key={index}
                            className="group p-6 rounded-xl bg-card border border-border/50 shadow-soft hover:shadow-lg hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                                <useCase.icon className="w-6 h-6 text-indigo-500" />
                            </div>
                            <h3 className="font-display font-semibold text-lg text-slate-900 mb-2">
                                {useCase.title}
                            </h3>
                            <p className="text-sm text-black/60">
                                {useCase.description}
                            </p>
                        </div>
                    ))}
                </div>
        </section>
    );
};

export default CollaborationSection;
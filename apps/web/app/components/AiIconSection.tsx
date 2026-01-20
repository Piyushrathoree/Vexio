import React, { useState, useEffect } from "react";
import {
    Sparkles,
    Wand2,
    Palette,
    Maximize2,
    Edit3,
    Check,
    Zap,
    Database,
    Cloud,
} from "lucide-react";
import Badge from "./custom/badge";
import { kalam, ranchers } from "../fonts";

const prompts = [
    { text: '"Minimal lightning bolt icon"', icon: "lightning" },
    { text: '"Rounded database icon, hand-drawn"', icon: "database" },
    { text: '"Simple cloud icon, outline"', icon: "cloud" },
];

const benefits = [
    {
        icon: Wand2,
        title: "No design skills required",
        description: "Just describe what you need in plain English",
    },
    {
        icon: Sparkles,
        title: "Instant results",
        description: "Get clean SVG icons in seconds",
    },
    {
        icon: Palette,
        title: "Consistent style",
        description: "Icons match the whiteboard aesthetic",
    },
    {
        icon: Edit3,
        title: "Fully editable",
        description: "Resize, recolor, and customize freely",
    },
];

const SketchLightning = (props: React.SVGProps<SVGSVGElement>) => (
    <Zap {...props} />
);

export const SketchDatabase = (props: React.SVGProps<SVGSVGElement>) => (
    <Database {...props} />
);

export const SketchCloud = (props: React.SVGProps<SVGSVGElement>) => (
    <Cloud {...props} />
);

export const SketchSparkle = (props: React.SVGProps<SVGSVGElement>) => (
    <Sparkles {...props} />
);

const AISection = () => {
    const [activePrompt, setActivePrompt] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showResult, setShowResult] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsGenerating(true);
            setShowResult(false);

            setTimeout(() => {
                setIsGenerating(false);
                setShowResult(true);
            }, 1200);

            setTimeout(() => {
                setActivePrompt((prev) => (prev + 1) % prompts.length);
            }, 3000);
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    const renderIcon = () => {
        const icons: Record<string, React.ReactNode> = {
            lightning: <SketchLightning className="w-12 h-12" />,
            database: <SketchDatabase className="w-12 h-12" />,
            cloud: <SketchCloud className="w-12 h-12" />,
        };
        return icons[prompts[activePrompt]!.icon];
    };

    return (
        <section id="ai" className="py-24 relative overflow-hidden -mt-10">
            <div className="container mx-auto px-6 relative">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center">
                    <Badge
                        icon={<Sparkles className="w-4 h-4 text-indigo-500" />}
                        text=" AI-Powered Icons"
                        className2="text-indigo-600 border-indigo-400 shadow-inner shadow-indigo-300 font-bold"
                    />

                    <h2
                        className={`${ranchers.className} text-5xl lg:text-6xl font-bold text-slate-900 mb-6 `}
                    >
                        Describe it.{" "}
                        <span
                            className={
                                " bg-linear-to-br from-indigo-600 via-indigo-500 to-orange-500 bg-clip-text text-transparent"
                            }
                        >
                            Generate it.
                        </span>
                    </h2>
                    <p
                        className={`text-lg text-black/60 leading-relaxed ${kalam.className}`}
                    >
                        Type a natural language prompt and instantly get clean,
                        scalable SVG icons that blend perfectly with your
                        whiteboard aesthetic. No design tools, no imports, no
                        switching tabs.
                    </p>
                </div>

                {/* Interactive Demo */}
                <div className="max-w-5xl mx-auto mb-20">
                    <div className="relative rounded-3xl border border-slate-200/80 bg-white/60 shadow-xl backdrop-blur-sm overflow-hidden">
                        {/* Demo header */}
                        <div className="flex items-center gap-4 px-6 py-4 bg-slate-50/80 border-b border-slate-200/80">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-500" />
                                <span className="font-display font-semibold text-slate-900">
                                    AI Icon Generator
                                </span>
                            </div>
                        </div>

                        <div className="p-8 grid md:grid-cols-2 gap-10 items-center">
                            {/* Prompt Input */}
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                        Your prompt
                                    </label>
                                    <div className="relative">
                                        <div className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-indigo-200 font-mono text-slate-900 text-sm leading-relaxed">
                                            {prompts[activePrompt]!.text}
                                            <span className="animate-pulse ml-0.5">
                                                |
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Prompt suggestions */}
                                <div className="flex flex-wrap gap-2">
                                    {prompts.map((prompt, index) => (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                setActivePrompt(index);
                                                setIsGenerating(true);
                                                setShowResult(false);
                                                setTimeout(() => {
                                                    setIsGenerating(false);
                                                    setShowResult(true);
                                                }, 1000);
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                                activePrompt === index
                                                    ? "bg-indigo-500 text-white shadow-sm"
                                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            }`}
                                        >
                                            {prompt.icon}
                                        </button>
                                    ))}
                                </div>

                                {/* Generate button */}
                                <button
                                    className={`w-full py-3.5 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 ${
                                        isGenerating
                                            ? "bg-indigo-500/90 text-white shadow-sm"
                                            : "bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg hover:shadow-indigo-500/30"
                                    }`}
                                    disabled={isGenerating}
                                >
                                    {isGenerating ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="w-5 h-5" />
                                            Generate Icon
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Result Area */}
                            <div className="flex flex-col items-center justify-center">
                                <div
                                    className={`w-32 h-32 rounded-xl border flex items-center justify-center transition-all duration-500 ${
                                        showResult
                                            ? "border-indigo-300 bg-indigo-50 text-indigo-600 scale-100 shadow-md"
                                            : "border-slate-200 bg-slate-50 text-slate-400 scale-95"
                                    }`}
                                >
                                    {isGenerating ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <SketchSparkle className="w-8 h-8 animate-pulse-soft text-indigo-500" />
                                            <span className="text-xs text-slate-500">
                                                Creating...
                                            </span>
                                        </div>
                                    ) : showResult ? (
                                        <div className="animate-scale-in">
                                            {renderIcon()}
                                        </div>
                                    ) : (
                                        <Sparkles className="w-8 h-8 opacity-30" />
                                    )}
                                </div>

                                {showResult && (
                                    <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600 animate-fade-up">
                                        <Check className="w-4 h-4" />
                                        <span>SVG ready to use</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Benefits Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {benefits.map((useCase, index) => (
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
            </div>
        </section>
    );
};

export default AISection;
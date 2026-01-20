import React from "react";
import { PenTool, Users, Sparkles, Zap } from "lucide-react";
import { SketchUnderline } from "./SketchElements";
import { SketchSparkle } from "./AiIconSection";
import { ranchers } from "../fonts";

const points = [
    { icon: PenTool, text: "Draw without limits" },
    { icon: Users, text: "Collaborate instantly" },
    { icon: Sparkles, text: "Generate visuals with AI" },
    { icon: Zap, text: "Stay in flow" },
];

const WhySection = () => {
    return (
        <section
            id="why"
            className="py-15 relative overflow-hidden "
        >
            <div className="container mx-auto px-6 relative">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 mb-6">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-medium text-indigo-600">
                            Why Vexio
                        </span>
                    </div>

                    <h2
                        className={`${ranchers.className} text-4xl lg:text-6xl font-bold text-slate-900 mb-6`}
                    >
                        More than just a{" "}
                        <span className="relative inline-block">
                            <span
                                className={
                                    " bg-linear-to-br from-indigo-600 via-indigo-500 to-orange-500 bg-clip-text text-transparent"
                                }
                            >
                                whiteboard.
                            </span>
                        </span>
                    </h2>

                    <p className="text-xl text-black/60 mb-12 leading-relaxed max-w-2xl mx-auto">
                        Vexio removes friction between thinking and creating. It
                        combines the freedom of sketching, the power of AI, and
                        the speed of real-time collaboration into one focused
                        workspace.
                    </p>

                    {/* Points */}
                    <div className="flex flex-wrap justify-center gap-4 mb-12">
                        {points.map((point, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 px-5 py-3 rounded-full bg-white/60 backdrop-blur-sm border border-slate-200 shadow-soft hover:shadow-lg hover:border-indigo-300 transition-all duration-300 hover:-translate-y-0.5"
                            >
                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                                    <point.icon className="w-4 h-4 text-indigo-500" />
                                </div>
                                <span className="font-medium text-slate-900">
                                    {point.text}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Visual quote / testimonial */}
                    <div className="relative max-w-2xl mx-auto p-8 rounded-3xl bg-white/60 backdrop-blur-sm border border-slate-200 shadow-xl">
                        <SketchSparkle className="absolute -top-3 -left-3 w-8 h-8 text-indigo-400" />
                        <SketchSparkle className="absolute -bottom-2 -right-2 w-6 h-6 text-orange-400" />

                        <div className="text-5xl text-indigo-200 font-serif leading-none mb-4">
                            "
                        </div>
                        <p className="text-lg text-slate-900  mb-4">
                            Finally, a tool that thinks as fast as I do. Ideas
                            just flow from my brain to the canvas without any
                            friction.
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                                <span className="font-bold text-indigo-600">
                                    M
                                </span>
                            </div>
                            <div className="text-left">
                                <p className="font-medium text-slate-900 text-sm">
                                    Random guy
                                </p>
                                <p className="text-xs text-slate-500">
                                    Product Designer
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default WhySection;
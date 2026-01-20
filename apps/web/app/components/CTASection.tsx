import React from "react";

import { ArrowRight, Sparkles, Users, Pencil, Stars } from "lucide-react";
import { SketchSparkle, SketchStar, SketchCircle } from "./SketchElements";
import { ranchers } from "../fonts";

const CTASection = () => {
    return (
        <section className="py-24 relative overflow-hidden ">
            {/* Floating elements */}
            <SketchStar className="absolute top-20 left-[10%] w-10 h-10 text-indigo-300/70 animate-float" />
            <SketchCircle className="absolute bottom-32 right-[15%] w-12 h-12 text-orange-300/70 animate-float-delayed" />
            <SketchSparkle className="absolute top-1/3 right-[10%] w-8 h-8 text-indigo-400/70 animate-pulse-soft" />

            <div className="container mx-auto px-6 relative">
                <div className="max-w-3xl mx-auto text-center">
                    <h2
                        className={`${ranchers.className} text-4xl lg:text-6xl font-bold text-slate-900 mb-6`}
                    >
                        Ready to{" "}
                        <span
                            className={
                                " bg-linear-to-br from-indigo-600 via-indigo-500 to-orange-500 bg-clip-text text-transparent"
                            }
                        >
                            create ?
                        </span>
                    </h2>

                    <p className="text-xl text-black/60 mb-10 leading-relaxed">
                        Start a board, invite your team, and turn ideas into
                        visuals instantly. No setup. No friction. Just pure
                        creation.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                        <button className="group inline-flex items-center gap-2 rounded-xl bg-indigo-500 text-white px-6 py-3 font-semibold shadow-md hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-400/40 active:scale-95 transition-all">
                            <Pencil className="w-5 h-5" />
                            <span>Start a Board</span>
                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                        </button>

                        <a className="group inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/60 backdrop-blur-sm py-3 font-semibold hover:bg-slate-50/80 hover:shadow-md active:scale-95 transition-all px-7 text-indigo-500" href="https://github.com/Piyushrathoree/vexio">
                            <Stars className="w-5 h-5 " />
                            <span>Star On Github</span>
                        </a>
                    </div>

                    {/* Trust indicators */}
                    <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span>Free to start</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span>No credit card required</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span>Unlimited boards</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CTASection;
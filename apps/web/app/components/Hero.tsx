import React from "react";
import Badge from "./custom/badge";
import { kalam, ranchers } from "../fonts";
import { ArrowBigRight, ArrowRight, Brush, Pencil, Sparkle, SparkleIcon, Star, Stars, Users } from "lucide-react";
import { SketchCircle, SketchStar, SketchSparkle } from "./SketchElements";

const Hero = () => {
    return (
        <div className="text-black text-center flex flex-col items-center justify-start pt-10 min-h-screen relative">
            <SketchStar className="absolute top-20 left-[10%] w-10 h-10 text-indigo-300/70 animate-float" />
            <SketchCircle className="absolute bottom-32 right-[15%] w-12 h-12 text-orange-300/70 animate-float-delayed" />
            <SketchSparkle className="absolute top-1/3 right-[10%] w-8 h-8 text-indigo-400/70 animate-pulse-soft" />
            <Badge
                text={"Introducing Vexio"}
                className2="text-sm"
                icon={<Stars className="size-5 text-indigo-500 " />}
            />
            <h1 className={`font-black text-8xl ${ranchers.className} `}>
                Think. Sketch. <br />
                Prompt. Generate.
            </h1>
            <span className={`text-lg mt-8 max-w-2xl text-black/60 ${kalam.className}`}>
                Sketches to polished visuals. Describe any icon and watch AI
                generate clean SVGs instantly.
            </span>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 mt-10">
                <button className="group inline-flex items-center gap-2 rounded-xl bg-indigo-500 text-white px-6 py-3 font-semibold shadow-md hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-400/40 active:scale-95 transition-all">
                    <Pencil className="w-5 h-5 mb-[2px]" />
                    <span>Start a Board</span>
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1 mb-[2px]" />

                </button>

                <button className="group inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/60 backdrop-blur-sm py-3 font-semibold hover:bg-slate-50/80 hover:shadow-md active:scale-95 transition-all px-14 text-indigo-500">
                    <Users className="w-5 h-5 mb-[2px]" />
                    <span>Sign In</span>

                </button>
            </div>
            <div className="w-[68vw] h-[68vh] bg-white/20 backdrop-blur-md border border-white/30 mt-20 rounded-2xl overflow-hidden mb-30 shadow-2xl">
                {/* <Tldraw className="rounded-2xl bg-orange-50/30" /> */}
                <img src={"/image.png"} alt="hero image" />
                <Badge
                    text={"Try it now - draw something !"}
                    className2="absolute right-200 text-md "
                />
            </div>
        </div>
    );
};

export default Hero;
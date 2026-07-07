import React from "react";

import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import CollaborationSection from "../components/CollabrationSection";
import AISection from "../components/AiIconSection";
import WhySection from "../components/WhySection";
import CTASection from "../components/CTASection";
import Footer from "../components/Footer";

const Page = () => {
    return (
        <div className="lp">
            {/* Ambient dot-grid canvas behind everything. */}
            <div className="lp-bg" aria-hidden />

            {/* Visually hidden until focused — first stop for keyboard users. */}
            <a
                href="#main-content"
                className="focus-ring sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:border focus:border-hairline focus:bg-surface focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-ink focus:shadow-lg"
            >
                Skip to content
            </a>

            {/* Shell ceiling — every section already carries its own
                max-width, this just keeps the whole page from stretching
                edge-to-edge on very wide displays. */}
            <div className="relative mx-auto max-w-[1440px]">
                <Navbar />
                <main id="main-content">
                    <Hero />
                    <CollaborationSection />
                    <AISection />
                    <WhySection />
                    <CTASection />
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default Page;

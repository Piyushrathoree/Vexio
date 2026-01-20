"use client";
import React from "react";

import Hero from "./components/Hero";
import CollaborationSection from "./components/CollabrationSection";
import AISection from "./components/AiIconSection";
import WhySection from "./components/WhySection";
import CTASection from "./components/CTASection";
import Navbar from "./components/Navbar";

const Page = () => {
    return (
        <div className="min-h-screen">
          <Navbar />
            <Hero />
            <CollaborationSection />
            <AISection />
            <WhySection />
            <CTASection />
        </div>
    );
};

export default Page;
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import FeaturesSection from "../components/FeaturesSection";
import CTASection from "../components/CTASection";
import Footer from "../components/Footer";

export default function Page() {
    return (
        <div className="min-h-screen bg-[#f9f6ef] text-[#1a1916]">
            <Navbar />
            <main>
                <Hero />
                <FeaturesSection />
                <CTASection />
            </main>
            <Footer />
        </div>
    );
}

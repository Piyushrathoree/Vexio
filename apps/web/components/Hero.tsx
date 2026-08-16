import Link from "next/link";
import ProductPreview from "./ProductPreview";

const chips = [
    { label: "Live cursors", color: "#e04e1f" },
    { label: "AI icons", color: "#c47a30" },
    { label: "Open by link", color: "#4b7bec" },
    { label: "Presence", color: "#5c8865" },
];

export default function Hero() {
    return (
        <section className="relative overflow-hidden bg-[#f9f6ef] px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32">
            <div
                className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#e04e1f]/15 blur-3xl"
                aria-hidden
            />
            <div
                className="pointer-events-none absolute right-[-40px] top-40 h-80 w-80 rounded-full bg-[#4b7bec]/12 blur-3xl"
                aria-hidden
            />
            <div
                className="pointer-events-none absolute bottom-24 left-1/3 h-64 w-64 rounded-full bg-[#c47a30]/14 blur-3xl"
                aria-hidden
            />

            <div className="relative mx-auto max-w-3xl text-center">
                <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
                    {chips.map((chip) => (
                        <span
                            key={chip.label}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#1a1916]/8 bg-white/80 px-3 py-1 text-[11px] font-semibold text-[#1a1916] shadow-sm"
                        >
                            <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ background: chip.color }}
                            />
                            {chip.label}
                        </span>
                    ))}
                </div>
                <h1 className="text-[2.4rem] font-bold leading-[1.08] tracking-tight text-[#1a1916] sm:text-5xl md:text-6xl lg:text-[4.15rem]">
                    Think on a board
                    <br />
                    <span className="text-[#e04e1f]">everyone can see.</span>
                </h1>
                <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-[#5c5850] sm:mt-6 sm:text-base">
                    Vexio is a live whiteboard — cursors, strokes, and AI icons in
                    the same room. Open a link and start drawing.
                </p>
                <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:mt-9 sm:flex-row">
                    <Link
                        href="/signup"
                        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#e04e1f] px-6 text-sm font-semibold text-white shadow-md shadow-[#e04e1f]/25 transition-colors hover:bg-[#c94318] sm:w-auto"
                    >
                        Start a board
                    </Link>
                    <a
                        href="#features"
                        className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#1a1916]/12 bg-white px-6 text-sm font-semibold text-[#1a1916] transition-colors hover:border-[#1a1916]/25 sm:w-auto"
                    >
                        See how it works
                    </a>
                </div>
            </div>

            <div className="relative mx-auto mt-12 max-w-5xl sm:mt-16">
                <ProductPreview />
            </div>
        </section>
    );
}

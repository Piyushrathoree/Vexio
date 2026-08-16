const items = [
    { value: "Live", label: "Cursors on every stroke" },
    { value: "Sync", label: "Boards saved as you draw" },
    { value: "AI", label: "Prompt to SVG, on canvas" },
    { value: "Open", label: "Share a link, start together" },
];

export default function ProofStrip() {
    return (
        <section className="border-y border-[#eee]">
            <div className="mx-auto grid max-w-5xl grid-cols-2 md:grid-cols-4">
                {items.map((item, i) => (
                    <div
                        key={item.value}
                        className={[
                            "px-6 py-8 sm:px-8 sm:py-10",
                            i % 2 === 1 ? "border-l border-[#eee]" : "",
                            i >= 2 ? "border-t border-[#eee] md:border-t-0" : "",
                            i > 0 ? "md:border-l md:border-[#eee]" : "",
                        ].join(" ")}
                    >
                        <p className="text-sm font-semibold text-[#111]">{item.value}</p>
                        <p className="mt-1 text-sm leading-snug text-[#737373]">
                            {item.label}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}

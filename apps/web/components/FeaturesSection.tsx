import { CollabBoardDrawing } from "./BoardSketch";
import { IconGenerateBoard } from "./IconGenerateBoard";

function LiveBoard() {
    return (
        <div className="relative min-h-[340px] overflow-hidden rounded-2xl bg-[#191a1f] sm:min-h-[400px]">
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage:
                        "radial-gradient(circle, rgba(255,236,210,0.1) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                }}
                aria-hidden
            />
            <CollabBoardDrawing />
        </div>
    );
}

const joined = [
    { name: "You", role: "Admin", color: "#e04e1f" },
    { name: "Maya", role: "Editor", color: "#4b7bec" },
    { name: "Leo", role: "Viewer", color: "#5c8865" },
];

export default function FeaturesSection() {
    return (
        <div id="features" className="scroll-mt-20">
            <section className="bg-[#f3efe6] px-4 py-20 sm:px-6 sm:py-28">
                <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#e04e1f]">
                            Together
                        </p>
                        <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1a1916] sm:text-4xl md:text-5xl">
                            Watch the room
                            <br />
                            think in real time.
                        </h2>
                        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#5c5850]">
                            Every pointer is named. Every stroke lands for the people
                            already on the board — not after they refresh. Multi-tab
                            doesn’t fake a leave.
                        </p>
                        <ul className="mt-8 space-y-3">
                            {[
                                { c: "#e04e1f", t: "Named cursors, not anonymous dots" },
                                { c: "#4b7bec", t: "Selections you can actually follow" },
                                { c: "#5c8865", t: "Presence counted per person" },
                            ].map((row) => (
                                <li
                                    key={row.t}
                                    className="flex items-center gap-3 text-sm font-medium text-[#1a1916]"
                                >
                                    <span
                                        className="h-2.5 w-2.5 rounded-full"
                                        style={{ background: row.c }}
                                    />
                                    {row.t}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <LiveBoard />
                </div>
            </section>

            <section className="bg-[#f9f6ef] px-4 py-20 sm:px-6 sm:py-28">
                <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
                    <IconGenerateBoard />
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-[#1a1916] sm:text-4xl md:text-[2.75rem]">
                            An icon is just another mark on the board.
                        </h2>
                        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#5c5850]">
                            Describe it once. The SVG sits next to the pen stroke —
                            same layer, same color, same resize. No sidebar, no export
                            from another tab.
                        </p>
                    </div>
                </div>
            </section>

            <section
                id="flow"
                className="scroll-mt-20 bg-[#f3efe6] px-4 py-20 sm:px-6 sm:py-28"
            >
                <div className="mx-auto max-w-3xl">
                    <h2 className="text-3xl font-bold tracking-tight text-[#1a1916] sm:text-4xl md:text-[2.75rem]">
                        The slug is the invite.
                    </h2>
                    <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[#5c5850]">
                        Name a board, send the URL. Whoever opens it is in the room —
                        drawing, watching, or both.
                    </p>

                    <div className="mt-10 overflow-hidden rounded-2xl border border-[#1a1916]/8 bg-white">
                        <div className="flex items-center gap-3 border-b border-[#ece8df] px-4 py-3">
                            <div className="flex gap-1.5" aria-hidden>
                                <span className="h-2.5 w-2.5 rounded-full bg-[#e04e1f]" />
                                <span className="h-2.5 w-2.5 rounded-full bg-[#c47a30]" />
                                <span className="h-2.5 w-2.5 rounded-full bg-[#5c8865]" />
                            </div>
                            <p className="truncate text-sm text-[#5c5850]">
                                vexio.app/whiteboard/
                                <span className="font-semibold text-[#1a1916]">
                                    q3-launch
                                </span>
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3 px-4 py-5">
                            {joined.map((person) => (
                                <span
                                    key={person.name}
                                    className="inline-flex items-center gap-2 rounded-full bg-[#f9f6ef] py-1.5 pl-1.5 pr-3"
                                >
                                    <span
                                        className="grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold text-white"
                                        style={{ background: person.color }}
                                    >
                                        {person.name[0]}
                                    </span>
                                    <span className="text-sm font-medium text-[#1a1916]">
                                        {person.name}
                                    </span>
                                    <span className="text-xs text-[#8a857c]">
                                        {person.role}
                                    </span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

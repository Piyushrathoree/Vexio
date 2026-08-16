const boards = [
    {
        title: "Sprint planning",
        hint: "Stories, owners, this week",
        bg: "#fff4ee",
        accent: "#e04e1f",
        notes: [
            { t: "Auth flow", c: "#ffc96b", r: "-3deg" },
            { t: "Billing", c: "#ff9eb5", r: "4deg" },
            { t: "Empty states", c: "#b8f0c8", r: "-2deg" },
        ],
    },
    {
        title: "System map",
        hint: "Services, arrows, owners",
        bg: "#eef3ff",
        accent: "#4b7bec",
        nodes: true,
    },
    {
        title: "Critique",
        hint: "Screens, stickies, votes",
        bg: "#f4fbf6",
        accent: "#5c8865",
        notes: [
            { t: "Too dense", c: "#ffc96b", r: "2deg" },
            { t: "Love this", c: "#c9f0d4", r: "-4deg" },
        ],
    },
];

export default function UseCases() {
    return (
        <section className="bg-white px-4 py-16 sm:px-6 sm:py-20">
            <div className="mx-auto max-w-6xl">
                <p className="text-center text-sm font-medium text-[#8a857c]">
                    The same board, used for completely different rooms
                </p>
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                    {boards.map((board) => (
                        <article
                            key={board.title}
                            className="overflow-hidden rounded-2xl border border-[#ece8df]"
                        >
                            <div
                                className="relative h-40 p-4"
                                style={{ background: board.bg }}
                            >
                                {board.nodes ? (
                                    <svg
                                        className="h-full w-full"
                                        viewBox="0 0 280 140"
                                        fill="none"
                                        aria-hidden
                                    >
                                        <rect
                                            x="16"
                                            y="36"
                                            width="72"
                                            height="44"
                                            rx="10"
                                            fill="#4b7bec"
                                        />
                                        <rect
                                            x="104"
                                            y="24"
                                            width="72"
                                            height="44"
                                            rx="10"
                                            fill="#e04e1f"
                                        />
                                        <rect
                                            x="192"
                                            y="48"
                                            width="72"
                                            height="44"
                                            rx="10"
                                            fill="#5c8865"
                                        />
                                        <path
                                            d="M88 58 H104"
                                            stroke="#1a1916"
                                            strokeWidth="2"
                                        />
                                        <path
                                            d="M176 46 H192"
                                            stroke="#1a1916"
                                            strokeWidth="2"
                                        />
                                    </svg>
                                ) : (
                                    <div className="flex h-full items-center justify-center gap-3">
                                        {board.notes?.map((n) => (
                                            <div
                                                key={n.t}
                                                className="w-[88px] rounded-md p-2 shadow-sm"
                                                style={{
                                                    background: n.c,
                                                    transform: `rotate(${n.r})`,
                                                }}
                                            >
                                                <p className="text-[11px] font-semibold text-[#1a1916]">
                                                    {n.t}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="border-t border-[#ece8df] bg-white px-4 py-3">
                                <p
                                    className="text-[11px] font-semibold uppercase tracking-wider"
                                    style={{ color: board.accent }}
                                >
                                    {board.title}
                                </p>
                                <p className="mt-0.5 text-sm text-[#5c5850]">
                                    {board.hint}
                                </p>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

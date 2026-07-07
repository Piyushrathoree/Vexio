import React from "react";
import Link from "next/link";
import { Github } from "lucide-react";
import Reveal from "./Reveal";

const columns = [
    {
        title: "Product",
        links: [
            { label: "Collaborate", href: "#collaborate" },
            { label: "AI Icons", href: "#ai" },
            { label: "Why Vexio", href: "#why" },
            { label: "Rooms", href: "/rooms" },
        ],
    },
    {
        title: "Account",
        links: [
            { label: "Sign in", href: "/login" },
            { label: "Start a board", href: "/signup" },
        ],
    },
];

const linkClass =
    "rounded-sm text-sm text-ink-dim transition-colors hover:text-ink focus-visible:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-indigo)]";

const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="relative z-10 border-t border-hairline px-4 py-14">
            <Reveal className="mx-auto max-w-6xl">
                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="lg:col-span-2">
                        <p className="coord mb-4">// end of board</p>
                        <Link
                            href="/"
                            aria-label="Vexio home"
                            className="inline-flex items-center gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-indigo)]"
                        >
                            <span className="grid h-6 w-6 place-items-center rounded-md bg-[var(--color-indigo)] text-[13px] font-bold text-[#0a0c12]">
                                V
                            </span>
                            <span className="font-display text-lg font-extrabold tracking-tight text-ink">
                                Vexio
                            </span>
                        </Link>
                        <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-dim">
                            The collaborative canvas where teams think out loud —
                            sketch, sync, and ship in one place.
                        </p>
                        <a
                            href="https://github.com/Piyushrathoree/vexio"
                            target="_blank"
                            rel="noreferrer"
                            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-hairline bg-white/[0.02] px-3 py-2 text-sm text-ink-dim transition-colors hover:border-white/20 hover:text-ink focus-visible:border-white/20 focus-visible:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-indigo)]"
                        >
                            <Github className="h-4 w-4" aria-hidden />
                            View on GitHub
                        </a>
                    </div>

                    <nav aria-label="Footer" className="contents">
                        {columns.map((column) => (
                            <div key={column.title}>
                                <p className="font-mono text-xs uppercase tracking-wide text-ink-faint">
                                    {column.title}
                                </p>
                                <ul className="mt-4 space-y-2.5">
                                    {column.links.map((link) => (
                                        <li key={link.label}>
                                            <Link href={link.href} className={linkClass}>
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </nav>
                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-hairline pt-6 sm:flex-row">
                    <p className="coord">
                        © {year} Vexio · built for people who think by drawing
                    </p>
                    <p className="coord flex items-center gap-2">
                        <span className="flex -space-x-1" aria-hidden>
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-indigo)]" />
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-coral)]" />
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-mint)]" />
                        </span>
                        made with a pencil and a websocket
                    </p>
                </div>
            </Reveal>
        </footer>
    );
};

export default Footer;

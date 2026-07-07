import React from "react";
import Link from "next/link";

const columns = [
    {
        title: "Product",
        links: [
            { label: "Collaborate", href: "#collaborate" },
            { label: "AI icons", href: "#ai" },
            { label: "Why Vexio", href: "#why" },
            { label: "Rooms", href: "/rooms" },
        ],
    },
    {
        title: "Account",
        links: [
            { label: "Sign in", href: "/login" },
            { label: "Get started", href: "/signup" },
        ],
    },
    {
        title: "Connect",
        links: [
            {
                label: "GitHub",
                href: "https://github.com/Piyushrathoree/vexio",
                external: true,
            },
        ],
    },
] as const;

const linkClass =
    "text-sm text-ink-dim transition-colors hover:text-ink focus-ring rounded-sm";

function Wordmark() {
    return (
        <span className="font-display text-lg font-bold tracking-tight text-ink">
            Vex<span className="text-indigo">io</span>
        </span>
    );
}

const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="relative z-10 px-4 py-16">
            <div className="mx-auto max-w-6xl">
                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="sm:col-span-2 lg:col-span-1">
                        <Link
                            href="/"
                            aria-label="Vexio home"
                            className="focus-ring inline-block rounded-sm"
                        >
                            <Wordmark />
                        </Link>
                        <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-dim">
                            The collaborative canvas where teams think out loud —
                            sketch, sync, and ship in one place.
                        </p>
                    </div>

                    <nav aria-label="Footer" className="contents">
                        {columns.map((column) => (
                            <div key={column.title}>
                                <p className="text-sm font-medium text-ink">
                                    {column.title}
                                </p>
                                <ul className="mt-4 space-y-2.5">
                                    {column.links.map((link) => (
                                        <li key={link.label}>
                                            {"external" in link && link.external ? (
                                                <a
                                                    href={link.href}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className={linkClass}
                                                >
                                                    {link.label}
                                                </a>
                                            ) : (
                                                <Link href={link.href} className={linkClass}>
                                                    {link.label}
                                                </Link>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </nav>
                </div>

                <div
                    className="mt-12 border-t border-hairline pt-6"
                    aria-hidden="true"
                />

                <div className="mt-6 flex flex-col gap-3 text-sm text-ink-faint sm:flex-row sm:items-center sm:justify-between">
                    <p>© {year} Vexio</p>
                    <p className="coord">canvas · sync · ship</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

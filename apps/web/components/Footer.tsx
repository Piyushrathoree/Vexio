import Link from "next/link";
import Logo from "./Logo";

const columns = [
    {
        title: "Product",
        links: [
            { name: "Features", href: "#features" },
            { name: "The link", href: "#flow" },
            { name: "Boards", href: "/rooms" },
        ],
    },
    {
        title: "Account",
        links: [
            { name: "Sign in", href: "/login" },
            { name: "Get started", href: "/signup" },
        ],
    },
    {
        title: "Resources",
        links: [
            {
                name: "GitHub",
                href: "https://github.com/Piyushrathoree/vexio",
                external: true,
            },
        ],
    },
];

export default function Footer() {
    return (
        <footer className="bg-[#141410] text-white/50">
            <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-14 sm:px-6 md:flex-row md:justify-between">
                <div className="max-w-xs">
                    <Logo light size="sm" />
                    <p className="mt-4 text-sm leading-relaxed text-white/40">
                        A live whiteboard for teams that think out loud.
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 sm:gap-16">
                    {columns.map((col) => (
                        <div key={col.title}>
                            <h3 className="mb-4 text-xs font-semibold text-white/80">
                                {col.title}
                            </h3>
                            <ul className="space-y-2.5">
                                {col.links.map((link) => (
                                    <li key={link.name}>
                                        {link.external ? (
                                            <a
                                                href={link.href}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-sm transition-colors hover:text-white"
                                            >
                                                {link.name}
                                            </a>
                                        ) : (
                                            <Link
                                                href={link.href}
                                                className="text-sm transition-colors hover:text-white"
                                            >
                                                {link.name}
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
            <div className="border-t border-white/[0.06] px-4 py-5 sm:px-6">
                <p className="mx-auto max-w-6xl text-xs text-white/25">
                    &copy; {new Date().getFullYear()} Vexio. All rights reserved.
                </p>
            </div>
        </footer>
    );
}

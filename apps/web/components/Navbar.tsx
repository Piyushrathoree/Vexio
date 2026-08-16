"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, Menu, User, X } from "lucide-react";
import { signOut, useSession } from "../lib/auth-client";
import Logo from "./Logo";

type NavLink = { label: string; href: string };

const marketingLinks: NavLink[] = [
    { label: "Features", href: "#features" },
    { label: "The link", href: "#flow" },
];

const productLinks: NavLink[] = [{ label: "Boards", href: "/rooms" }];

function getInitials(name?: string | null, email?: string | null) {
    const source = name?.trim() || email?.trim() || "";
    if (!source) return "?";
    const words = source.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
        return `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`.toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
}

function GithubIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            className={className}
        >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
    );
}

const Navbar = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const pathname = usePathname();
    const isLanding = pathname === "/";

    const { data: session, isPending } = useSession();
    const user = session?.user;
    const signedIn = !isPending && !!user;
    const navLinks = signedIn ? productLinks : marketingLinks;

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                setDrawerOpen(false);
                setMenuOpen(false);
            }
        }
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, []);

    useEffect(() => {
        if (!menuOpen) return;
        function onPointerDown(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", onPointerDown);
        return () => document.removeEventListener("mousedown", onPointerDown);
    }, [menuOpen]);

    useEffect(() => {
        setDrawerOpen(false);
        setMenuOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!drawerOpen) {
            setDrawerVisible(false);
            return;
        }
        const frame = requestAnimationFrame(() => setDrawerVisible(true));
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            cancelAnimationFrame(frame);
            document.body.style.overflow = prev;
        };
    }, [drawerOpen]);

    const handleSignOut = async () => {
        setMenuOpen(false);
        setDrawerOpen(false);
        await signOut();
        router.push("/login");
    };

    const headerSurface = isLanding
        ? scrolled
            ? "border-b border-[#ece8df] bg-[#f9f6ef]/90 backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        : "border-b border-[#e8e2d4]/80 bg-[#f9f6ef]/90 backdrop-blur-md";

    const linkTone =
        "text-[#7a7770] transition-colors hover:text-[#1a1916]";

    return (
        <>
            <header
                className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${headerSurface}`}
            >
                <nav
                    aria-label="Main"
                    className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6"
                >
                    <Logo />

                    <ul className="hidden items-center gap-8 md:flex">
                        {navLinks.map((link) => (
                            <li key={link.label}>
                                <Link
                                    href={link.href}
                                    className={`text-sm font-medium ${linkTone}`}
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                        <li>
                            <a
                                href="https://github.com/Piyushrathoree/vexio"
                                target="_blank"
                                rel="noreferrer"
                                className={`text-sm font-medium ${linkTone}`}
                            >
                                Github
                            </a>
                        </li>
                        {isPending ? (
                            <li
                                aria-hidden
                                className="h-9 w-20 animate-pulse rounded-lg bg-[#1a1916]/5"
                            />
                        ) : signedIn ? (
                            <li className="relative">
                                <div ref={menuRef}>
                                <button
                                    type="button"
                                    onClick={() => setMenuOpen((v) => !v)}
                                    aria-haspopup="menu"
                                    aria-expanded={menuOpen}
                                    className="flex items-center gap-1.5 rounded-lg py-1 pl-1 pr-1.5 hover:bg-[#1a1916]/5"
                                >
                                    <span className="avatar h-7 w-7 text-[11px]">
                                        {user?.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={user.image}
                                                alt=""
                                                className="h-full w-full rounded-full object-cover"
                                            />
                                        ) : (
                                            getInitials(user?.name, user?.email)
                                        )}
                                    </span>
                                    <ChevronDown
                                        aria-hidden
                                        className={`h-3.5 w-3.5 text-[#7a7770] transition-transform ${
                                            menuOpen ? "rotate-180" : ""
                                        }`}
                                    />
                                </button>
                                {menuOpen && (
                                    <div
                                        role="menu"
                                        className="absolute right-0 top-[calc(100%+8px)] w-56 rounded-xl border border-[#e8e2d4] bg-[#f9f6ef] p-1.5 shadow-lg"
                                    >
                                        <div className="px-2.5 py-2">
                                            <p className="truncate text-sm font-medium text-[#1a1916]">
                                                {user?.name || "Signed in"}
                                            </p>
                                            <p className="truncate text-xs text-[#7a7770]">
                                                {user?.email}
                                            </p>
                                        </div>
                                        <div className="my-1 h-px bg-[#e8e2d4]" />
                                        <Link
                                            href="/profile"
                                            role="menuitem"
                                            onClick={() => setMenuOpen(false)}
                                            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[#7a7770] hover:bg-[#1a1916]/5 hover:text-[#1a1916]"
                                        >
                                            <User className="h-4 w-4" />
                                            Profile
                                        </Link>
                                        <button
                                            type="button"
                                            role="menuitem"
                                            onClick={() => void handleSignOut()}
                                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-[#7a7770] hover:bg-[#1a1916]/5 hover:text-[#1a1916]"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Sign out
                                        </button>
                                    </div>
                                )}
                                </div>
                            </li>
                        ) : (
                            <li>
                                <Link
                                    href="/login"
                                    className="rounded-xl bg-[#e04e1f] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#c94318]"
                                >
                                    Sign In
                                </Link>
                            </li>
                        )}
                    </ul>

                    <button
                        type="button"
                        aria-label={drawerOpen ? "Close menu" : "Open menu"}
                        aria-expanded={drawerOpen}
                        onClick={() => setDrawerOpen((v) => !v)}
                        className="relative z-[60] flex items-center justify-center text-[#1a1916] md:hidden"
                    >
                        {drawerOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </button>
                </nav>
            </header>

            {drawerOpen && (
                <div className="fixed inset-0 z-[55] md:hidden">
                    <button
                        type="button"
                        aria-label="Close menu"
                        className={`absolute inset-0 bg-[#1a1916]/30 backdrop-blur-sm transition-opacity ${
                            drawerVisible ? "opacity-100" : "opacity-0"
                        }`}
                        onClick={() => setDrawerOpen(false)}
                    />
                    <aside
                        className={`absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-[#f9f6ef] transition-transform duration-500 ${
                            drawerVisible ? "translate-x-0" : "translate-x-full"
                        }`}
                    >
                        <div className="flex items-center justify-between border-b border-[#e8e2d4] px-5 py-5">
                            <Logo />
                        </div>
                        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 pb-8 pt-6">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    onClick={() => setDrawerOpen(false)}
                                    className="text-2xl font-medium text-[#7a7770] hover:text-[#1a1916]"
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <a
                                href="https://github.com/Piyushrathoree/vexio"
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 text-2xl font-medium text-[#7a7770] hover:text-[#1a1916]"
                            >
                                <GithubIcon className="h-5 w-5" />
                                Github
                            </a>
                            {signedIn ? (
                                <>
                                    <Link
                                        href="/profile"
                                        onClick={() => setDrawerOpen(false)}
                                        className="text-2xl font-medium text-[#7a7770] hover:text-[#1a1916]"
                                    >
                                        Profile
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => void handleSignOut()}
                                        className="text-left text-2xl font-medium text-[#7a7770] hover:text-[#1a1916]"
                                    >
                                        Sign out
                                    </button>
                                </>
                            ) : (
                                <Link
                                    href="/login"
                                    onClick={() => setDrawerOpen(false)}
                                    className="inline-block w-fit rounded-lg bg-[#1a1916] px-6 py-3 font-semibold text-[#f9f6ef]"
                                >
                                    Sign In
                                </Link>
                            )}
                        </nav>
                    </aside>
                </div>
            )}
        </>
    );
};

export default Navbar;

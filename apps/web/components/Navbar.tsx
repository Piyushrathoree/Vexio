"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    ChevronDown,
    DoorOpen,
    Layers,
    LogOut,
    Menu,
    User,
    X,
} from "lucide-react";
import { signOut, useSession } from "../lib/auth-client";

type NavLink = { label: string; href: string };

const marketingLinks: NavLink[] = [
    { label: "Collaborate", href: "#collaborate" },
    { label: "AI icons", href: "#ai" },
    { label: "Why Vexio", href: "#why" },
];

const productLinks: NavLink[] = [
    { label: "Rooms", href: "/rooms" },
    { label: "Whiteboards", href: "/whiteboard" },
];

const focusRing = "focus-ring";
const pressable =
    "transition-transform duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none";

function productIcon(href: string) {
    switch (href) {
        case "/rooms":
            return DoorOpen;
        case "/whiteboard":
            return Layers;
        default:
            return null;
    }
}

function getInitials(name?: string | null, email?: string | null) {
    const source = name?.trim() || email?.trim() || "";
    if (!source) return "?";
    const words = source.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
        return `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`.toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
}

function Wordmark() {
    return (
        <span className="font-display text-lg font-bold tracking-tight text-ink">
            Vex<span className="text-indigo">io</span>
        </span>
    );
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
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const pathname = usePathname();

    const { data: session, isPending } = useSession();
    const user = session?.user;
    const signedIn = !isPending && !!user;
    const navLinks = signedIn ? productLinks : marketingLinks;

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
        setDrawerVisible(false);
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

    const navLinkClass = (isActive: boolean) =>
        `rounded-lg px-3 py-1.5 text-sm transition-colors ${focusRing} ${
            isActive
                ? "bg-indigo/15 font-medium text-ink"
                : "text-ink-dim hover:text-ink"
        }`;

    const drawerLinkClass = `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-ink-dim transition-colors hover:bg-white/[0.06] hover:text-ink ${focusRing}`;

    return (
        <>
            <header className="glass sticky top-0 z-50 w-full border-b border-hairline">
                <nav
                    aria-label="Main"
                    className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6"
                >
                    <Link
                        href="/"
                        className={`rounded-lg ${focusRing} ${pressable}`}
                        aria-label="Vexio home"
                    >
                        <Wordmark />
                    </Link>

                    <ul className="hidden items-center gap-1 md:flex">
                        {navLinks.map((link) => {
                            const isActive =
                                link.href.startsWith("/") &&
                                (pathname === link.href ||
                                    pathname.startsWith(`${link.href}/`));
                            return (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        aria-current={isActive ? "page" : undefined}
                                        className={navLinkClass(isActive)}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>

                    <div className="hidden items-center gap-2 md:flex">
                        <a
                            href="https://github.com/Piyushrathoree/vexio"
                            target="_blank"
                            rel="noreferrer"
                            aria-label="View Vexio on GitHub"
                            className={`icon-btn ${focusRing} ${pressable}`}
                        >
                            <GithubIcon className="h-4 w-4" />
                        </a>

                        {isPending ? (
                            <span
                                aria-hidden="true"
                                className="ml-1 h-9 w-24 animate-pulse rounded-lg bg-white/[0.06] motion-reduce:animate-none"
                            />
                        ) : signedIn ? (
                            <div ref={menuRef} className="relative ml-1">
                                <button
                                    type="button"
                                    onClick={() => setMenuOpen((v) => !v)}
                                    aria-haspopup="menu"
                                    aria-expanded={menuOpen}
                                    className={`flex items-center gap-1.5 rounded-lg py-1.5 pl-1.5 pr-2 hover:bg-white/[0.06] ${focusRing} ${pressable}`}
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
                                        aria-hidden="true"
                                        className={`h-3.5 w-3.5 text-ink-dim transition-transform motion-reduce:transition-none ${
                                            menuOpen ? "rotate-180" : ""
                                        }`}
                                    />
                                </button>

                                {menuOpen && (
                                    <div
                                        role="menu"
                                        aria-label="Account"
                                        className="glass absolute right-0 top-[calc(100%+8px)] w-56 rounded-xl p-1.5 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.8)]"
                                    >
                                        <div className="px-2.5 py-2">
                                            <p className="truncate text-sm font-medium text-ink">
                                                {user?.name || "Signed in"}
                                            </p>
                                            <p className="truncate text-xs text-ink-dim">
                                                {user?.email}
                                            </p>
                                        </div>
                                        <div className="my-1 h-px bg-hairline" />
                                        <Link
                                            href="/profile"
                                            role="menuitem"
                                            onClick={() => setMenuOpen(false)}
                                            className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-ink-dim transition-colors hover:bg-white/[0.06] hover:text-ink ${focusRing}`}
                                        >
                                            <User className="h-4 w-4" aria-hidden="true" />
                                            Profile
                                        </Link>
                                        <button
                                            type="button"
                                            role="menuitem"
                                            onClick={() => void handleSignOut()}
                                            className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-ink-dim transition-colors hover:bg-white/[0.06] hover:text-ink ${focusRing} ${pressable}`}
                                        >
                                            <LogOut className="h-4 w-4" aria-hidden="true" />
                                            Sign out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="ml-1 flex items-center gap-2">
                                <Link
                                    href="/login"
                                    className={`btn-ghost rounded-xl px-4 py-2 text-sm ${focusRing} ${pressable}`}
                                >
                                    Log in
                                </Link>
                                <Link
                                    href="/signup"
                                    className={`btn-primary rounded-xl px-4 py-2 text-sm ${focusRing} ${pressable}`}
                                >
                                    Sign up
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1 md:hidden">
                        <button
                            type="button"
                            aria-label={drawerOpen ? "Close menu" : "Open menu"}
                            aria-expanded={drawerOpen}
                            onClick={() => setDrawerOpen((v) => !v)}
                            className={`icon-btn ${focusRing} ${pressable}`}
                        >
                            {drawerOpen ? (
                                <X className="h-5 w-5" aria-hidden="true" />
                            ) : (
                                <Menu className="h-5 w-5" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </nav>
            </header>

            {drawerOpen && (
                <div className="fixed inset-0 z-[60] md:hidden" role="presentation">
                    <button
                        type="button"
                        aria-label="Close menu"
                        className={`absolute inset-0 bg-[var(--color-canvas)]/80 backdrop-blur-sm transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                            drawerVisible ? "opacity-100" : "opacity-0"
                        }`}
                        onClick={() => setDrawerOpen(false)}
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Navigation menu"
                        className={`glass absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-hairline transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                            drawerVisible ? "translate-x-0" : "translate-x-full"
                        }`}
                    >
                        <div className="flex items-center justify-between border-b border-hairline px-4 py-4">
                            <Wordmark />
                            <button
                                type="button"
                                aria-label="Close menu"
                                onClick={() => setDrawerOpen(false)}
                                className={`icon-btn ${focusRing} ${pressable}`}
                            >
                                <X className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-4">
                            {signedIn && (
                                <div className="mb-4 flex items-center gap-3 rounded-xl border border-hairline bg-white/[0.03] px-3 py-2.5">
                                    <span className="avatar h-9 w-9 text-xs">
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
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-ink">
                                            {user?.name || "Signed in"}
                                        </p>
                                        <p className="truncate text-xs text-ink-dim">
                                            {user?.email}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <ul className="flex flex-col gap-1">
                                {navLinks.map((link) => {
                                    const Icon = productIcon(link.href);
                                    const isActive =
                                        link.href.startsWith("/") &&
                                        (pathname === link.href ||
                                            pathname.startsWith(`${link.href}/`));
                                    return (
                                        <li key={link.label}>
                                            <Link
                                                href={link.href}
                                                onClick={() => setDrawerOpen(false)}
                                                aria-current={isActive ? "page" : undefined}
                                                className={`${drawerLinkClass} ${
                                                    isActive
                                                        ? "bg-indigo/15 font-medium text-ink"
                                                        : ""
                                                }`}
                                            >
                                                {Icon ? (
                                                    <Icon
                                                        className="h-4 w-4 text-ink-dim"
                                                        aria-hidden="true"
                                                    />
                                                ) : null}
                                                {link.label}
                                            </Link>
                                        </li>
                                    );
                                })}
                                {signedIn && (
                                    <li>
                                        <Link
                                            href="/profile"
                                            onClick={() => setDrawerOpen(false)}
                                            className={drawerLinkClass}
                                        >
                                            <User
                                                className="h-4 w-4 text-ink-dim"
                                                aria-hidden="true"
                                            />
                                            Profile
                                        </Link>
                                    </li>
                                )}
                            </ul>
                        </div>

                        <div className="flex flex-col gap-2 border-t border-hairline px-4 py-4">
                            <a
                                href="https://github.com/Piyushrathoree/vexio"
                                target="_blank"
                                rel="noreferrer"
                                className={`btn-ghost inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm ${focusRing} ${pressable}`}
                            >
                                <GithubIcon className="h-4 w-4" />
                                GitHub
                            </a>
                            {signedIn ? (
                                <button
                                    type="button"
                                    onClick={() => void handleSignOut()}
                                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm text-ink-dim hover:bg-white/[0.06] hover:text-ink ${focusRing} ${pressable}`}
                                >
                                    <LogOut className="h-4 w-4" aria-hidden="true" />
                                    Sign out
                                </button>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        onClick={() => setDrawerOpen(false)}
                                        className={`btn-ghost rounded-xl px-4 py-2.5 text-center text-sm ${focusRing} ${pressable}`}
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href="/signup"
                                        onClick={() => setDrawerOpen(false)}
                                        className={`btn-primary rounded-xl px-4 py-2.5 text-center text-sm ${focusRing} ${pressable}`}
                                    >
                                        Sign up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;

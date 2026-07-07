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
    MousePointer2,
    User,
    X,
} from "lucide-react";
import { signOut, useSession } from "../lib/auth-client";

type NavLink = { label: string; href: string };

// Shown to signed-out visitors — anchors into the landing page's sections.
const marketingLinks: NavLink[] = [
    { label: "Collaborate", href: "#collaborate" },
    { label: "AI icons", href: "#ai" },
    { label: "Why Vexio", href: "#why" },
];

// Shown once someone is signed in — real destinations, not page anchors.
const productLinks: NavLink[] = [
    { label: "Rooms", href: "/rooms" },
    { label: "Whiteboards", href: "/whiteboard" },
];

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

const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-indigo)]";

const Navbar = () => {
    const [open, setOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const pathname = usePathname();

    const { data: session, isPending } = useSession();
    const user = session?.user;
    const signedIn = !isPending && !!user;
    const navLinks = signedIn ? productLinks : marketingLinks;

    // Escape folds away whichever overlay is open.
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                setOpen(false);
                setMenuOpen(false);
            }
        }
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, []);

    // Clicking outside the profile menu closes it.
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

    // A route change means navigation happened — close both overlays.
    useEffect(() => {
        setOpen(false);
        setMenuOpen(false);
    }, [pathname]);

    const handleSignOut = async () => {
        setMenuOpen(false);
        setOpen(false);
        await signOut();
        router.push("/login");
    };

    return (
        <header className="sticky top-0 z-50 px-4 pt-4">
            <nav className="glass mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl pl-5 pr-3">
                <Link
                    href="/"
                    className={`group flex items-center gap-2.5 rounded-lg ${focusRing}`}
                    aria-label="Vexio home"
                >
                    <span className="relative grid h-6 w-6 place-items-center rounded-md bg-[var(--color-indigo)] text-[13px] font-bold text-[#0a0c12]">
                        V
                        <MousePointer2
                            aria-hidden="true"
                            strokeWidth={2.5}
                            fill="currentColor"
                            className="absolute -bottom-1 -right-1 h-2.5 w-2.5 text-[var(--color-coral)] drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0"
                        />
                    </span>
                    <span className="font-display text-lg font-extrabold tracking-tight text-ink">
                        Vexio
                    </span>
                </Link>

                <ul className="hidden items-center gap-8 md:flex">
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
                                    className={`rounded-md text-sm transition-colors hover:text-ink ${focusRing} ${
                                        isActive ? "font-medium text-ink" : "text-ink-dim"
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                <div className="hidden items-center gap-2 md:flex">
                    {isPending ? (
                        <span
                            aria-hidden="true"
                            className="h-9 w-24 animate-pulse rounded-lg bg-white/5"
                        />
                    ) : signedIn ? (
                        <div ref={menuRef} className="relative">
                            <button
                                type="button"
                                onClick={() => setMenuOpen((v) => !v)}
                                aria-haspopup="menu"
                                aria-expanded={menuOpen}
                                className={`flex items-center gap-1.5 rounded-lg py-1.5 pl-1.5 pr-2 transition-colors hover:bg-white/5 ${focusRing}`}
                            >
                                <span className="relative inline-grid h-7 w-7 shrink-0 place-items-center">
                                    <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-full bg-[var(--color-violet)] text-[11px] font-bold text-[#0a0c12]">
                                        {user?.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={user.image}
                                                alt=""
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            getInitials(user?.name, user?.email)
                                        )}
                                    </span>
                                    <span
                                        aria-hidden="true"
                                        className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-mint)]"
                                    />
                                </span>
                                <ChevronDown
                                    aria-hidden="true"
                                    className={`h-3.5 w-3.5 text-ink-faint transition-transform motion-reduce:transition-none ${
                                        menuOpen ? "rotate-180" : ""
                                    }`}
                                />
                            </button>

                            {menuOpen && (
                                <div
                                    role="menu"
                                    aria-label="Account"
                                    className="glass absolute right-0 top-[calc(100%+8px)] w-56 rounded-xl p-1.5 shadow-2xl"
                                >
                                    <div className="px-2.5 py-2">
                                        <p className="truncate text-sm font-medium text-ink">
                                            {user?.name || "Signed in"}
                                        </p>
                                        <p className="truncate text-xs text-ink-faint">
                                            {user?.email}
                                        </p>
                                    </div>
                                    <div className="my-1 h-px bg-hairline" />
                                    <Link
                                        href="/profile"
                                        role="menuitem"
                                        onClick={() => setMenuOpen(false)}
                                        className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-ink-dim transition-colors hover:bg-white/5 hover:text-ink ${focusRing}`}
                                    >
                                        <User className="h-4 w-4" aria-hidden="true" />
                                        Profile
                                    </Link>
                                    <button
                                        type="button"
                                        role="menuitem"
                                        onClick={() => void handleSignOut()}
                                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-ink-dim transition-colors hover:bg-white/5 hover:text-ink ${focusRing}`}
                                    >
                                        <LogOut className="h-4 w-4" aria-hidden="true" />
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className={`rounded-lg px-3 py-2 text-sm text-ink-dim transition-colors hover:text-ink ${focusRing}`}
                            >
                                Log in
                            </Link>
                            <Link
                                href="/signup"
                                className={`btn-primary rounded-lg px-4 py-2 text-sm ${focusRing}`}
                            >
                                Sign up
                            </Link>
                        </>
                    )}
                </div>

                <button
                    type="button"
                    aria-label={open ? "Close menu" : "Open menu"}
                    aria-expanded={open}
                    onClick={() => setOpen((v) => !v)}
                    className={`grid h-9 w-9 place-items-center rounded-lg text-ink transition-colors hover:bg-white/5 md:hidden ${focusRing}`}
                >
                    {open ? (
                        <X className="h-5 w-5" aria-hidden="true" />
                    ) : (
                        <Menu className="h-5 w-5" aria-hidden="true" />
                    )}
                </button>
            </nav>

            {open && (
                <div className="glass mx-auto mt-2 max-w-6xl rounded-2xl p-4 md:hidden">
                    {signedIn && (
                        <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5">
                            <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--color-violet)] text-xs font-bold text-[#0a0c12]">
                                {user?.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={user.image}
                                        alt=""
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    getInitials(user?.name, user?.email)
                                )}
                            </span>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-ink">
                                    {user?.name || "Signed in"}
                                </p>
                                <p className="truncate text-xs text-ink-faint">
                                    {user?.email}
                                </p>
                            </div>
                        </div>
                    )}

                    <ul className="flex flex-col gap-1">
                        {navLinks.map((link) => {
                            const Icon = productIcon(link.href);
                            return (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        onClick={() => setOpen(false)}
                                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-ink-dim transition-colors hover:bg-white/5 hover:text-ink ${focusRing}`}
                                    >
                                        {Icon ? (
                                            <Icon
                                                className="h-4 w-4 text-ink-faint"
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
                                    onClick={() => setOpen(false)}
                                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-ink-dim transition-colors hover:bg-white/5 hover:text-ink ${focusRing}`}
                                >
                                    <User className="h-4 w-4 text-ink-faint" aria-hidden="true" />
                                    Profile
                                </Link>
                            </li>
                        )}
                    </ul>

                    <div className="mt-3 flex flex-col gap-2 border-t border-hairline pt-3">
                        {signedIn ? (
                            <button
                                type="button"
                                onClick={() => void handleSignOut()}
                                className={`btn-ghost inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-center text-sm ${focusRing}`}
                            >
                                <LogOut className="h-4 w-4" aria-hidden="true" />
                                Sign out
                            </button>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    onClick={() => setOpen(false)}
                                    className={`btn-ghost rounded-lg px-4 py-2.5 text-center text-sm ${focusRing}`}
                                >
                                    Log in
                                </Link>
                                <Link
                                    href="/signup"
                                    onClick={() => setOpen(false)}
                                    className={`btn-primary rounded-lg px-4 py-2.5 text-center text-sm ${focusRing}`}
                                >
                                    Sign up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;

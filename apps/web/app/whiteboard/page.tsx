"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
    ArrowRight,
    DoorOpen,
    LayoutGrid,
    LogOut,
    Plus,
    Sparkles,
} from "lucide-react";
import { AuthGuard } from "../../components/AuthGuard";
import { apiFetch } from "../../lib/api";
import { signOut } from "../../lib/auth-client";

type Room = {
    id: number;
    slug: string;
    createdAt: string;
};

const ACCENTS = [
    "var(--color-indigo)",
    "var(--color-violet)",
    "var(--color-mint)",
    "var(--color-coral)",
];

// Mirrors the http-server's slug contract: lowercase letters, numbers, and
// hyphens, 3-64 characters. Kept in sync with apps/http-server/controllers.
const SLUG_PATTERN = /^[a-z0-9-]+$/;

const isValidSlug = (slug: string) =>
    slug.length >= 3 && slug.length <= 64 && SLUG_PATTERN.test(slug);

// Auto-named boards borrow from the same marker/accent vocabulary as the rest
// of the "Living Canvas" language, so a one-click board still feels branded.
const ACCENT_WORDS = ["indigo", "violet", "coral", "mint", "amber"];
const CANVAS_WORDS = [
    "sketch",
    "canvas",
    "draft",
    "loop",
    "atlas",
    "forge",
    "nova",
    "drift",
    "glyph",
    "studio",
];

function generateSlug(): string {
    const word1 =
        ACCENT_WORDS[Math.floor(Math.random() * ACCENT_WORDS.length)];
    const word2 =
        CANVAS_WORDS[Math.floor(Math.random() * CANVAS_WORDS.length)];
    const suffix = Math.floor(Math.random() * 90 + 10);
    return `${word1}-${word2}-${suffix}`;
}

function formatCreatedAt(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
    });
}

function WhiteboardHubContent() {
    const router = useRouter();

    const [createSlug, setCreateSlug] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    const [openSlug, setOpenSlug] = useState("");

    const [rooms, setRooms] = useState<Room[]>([]);
    const [roomsLoading, setRoomsLoading] = useState(true);
    const [roomsError, setRoomsError] = useState(false);

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            const res = await apiFetch("/api/v1/rooms");
            if (cancelled) return;

            if (!res.ok) {
                setRoomsError(true);
                setRoomsLoading(false);
                return;
            }

            const json = await res.json();
            const list: Room[] = json.data?.rooms ?? [];
            list.sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
            );
            setRooms(list);
            setRoomsLoading(false);
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmed = createSlug.trim().toLowerCase();
        if (trimmed.length > 0 && !isValidSlug(trimmed)) {
            setCreateError(
                "Use lowercase letters, numbers, and hyphens — 3 to 64 characters."
            );
            return;
        }

        setCreateError("");
        setCreating(true);

        const finalSlug = trimmed.length > 0 ? trimmed : generateSlug();
        const res = await apiFetch("/api/v1/room", {
            method: "POST",
            body: JSON.stringify({ slug: finalSlug }),
        });

        setCreating(false);

        if (!res.ok) {
            const json = await res.json().catch(() => null);
            setCreateError(
                json?.message ?? `Couldn't create that board (${res.status}).`
            );
            return;
        }

        const json = await res.json();
        const room = json.data?.room as Room | undefined;
        router.push(`/whiteboard/${room?.slug ?? finalSlug}`);
    };

    const handleOpen = (e: React.FormEvent) => {
        e.preventDefault();
        const slug = openSlug.trim().toLowerCase();
        if (!slug) return;
        router.push(`/whiteboard/${slug}`);
    };

    const handleSignOut = async () => {
        await signOut();
        router.replace("/login");
    };

    const recentRooms = rooms.slice(0, 6);

    return (
        <div className="lp">
            {/* Ambient dot-grid canvas behind everything. */}
            <div className="lp-bg" aria-hidden />

            <main className="relative z-10 min-h-screen px-4 pb-24 pt-6 sm:px-6">
                <div className="mx-auto max-w-5xl">
                    {/* Top bar */}
                    <header className="glass flex h-16 items-center justify-between rounded-2xl pl-5 pr-3">
                        <Link
                            href="/"
                            className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-indigo)]"
                            aria-label="Vexio home"
                        >
                            <span className="grid h-6 w-6 place-items-center rounded-md bg-[var(--color-indigo)] text-[13px] font-bold text-[#0a0c12]">
                                V
                            </span>
                            <span className="font-display text-lg font-extrabold tracking-tight text-ink">
                                Vexio
                            </span>
                        </Link>

                        <div className="flex items-center gap-2">
                            <Link
                                href="/rooms"
                                className="btn-ghost inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-indigo)]"
                            >
                                <LayoutGrid className="h-[15px] w-[15px]" />
                                <span className="hidden sm:inline">
                                    All boards
                                </span>
                            </Link>
                            <button
                                type="button"
                                onClick={() => void handleSignOut()}
                                className="btn-ghost inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-ink-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-indigo)]"
                            >
                                <LogOut className="h-[15px] w-[15px]" />
                                <span className="hidden sm:inline">
                                    Sign out
                                </span>
                            </button>
                        </div>
                    </header>

                    {/* Heading */}
                    <div className="mt-10">
                        <p className="coord mb-3">// launch</p>
                        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                            Step onto a canvas
                        </h1>
                        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-dim">
                            Spin up a blank artboard in one click, or jump
                            straight back into a board your team already
                            started.
                        </p>
                    </div>

                    {/* Hero: new whiteboard */}
                    <section className="artboard relative mt-8 overflow-hidden p-6 sm:p-10">
                        <div className="aurora -left-16 -top-20 h-56 w-56 bg-[radial-gradient(circle,var(--color-indigo),transparent_60%)]" />
                        <div className="relative grid gap-8 sm:grid-cols-[1.2fr_auto] sm:items-center">
                            <div>
                                <div className="mb-4 flex items-center gap-2">
                                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--color-indigo)]/15 text-[var(--color-indigo)]">
                                        <Plus className="h-4 w-4" />
                                    </span>
                                    <h2 className="font-display text-xl font-bold text-ink">
                                        Blank canvas
                                    </h2>
                                </div>
                                <form
                                    onSubmit={handleCreate}
                                    className="max-w-md space-y-3"
                                >
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Leave blank to auto-name"
                                            value={createSlug}
                                            onChange={(e) => {
                                                setCreateSlug(e.target.value);
                                                if (createError)
                                                    setCreateError("");
                                            }}
                                            aria-label="New whiteboard name"
                                            className="w-full rounded-lg border border-hairline bg-white/[0.03] px-4 py-2.5 font-mono text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus-visible:border-[var(--color-indigo)] focus-visible:outline-none"
                                        />
                                        <p className="mt-1.5 font-mono text-[11px] text-ink-faint">
                                            lowercase letters, numbers, hyphens
                                            · 3–64 chars
                                        </p>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="btn-primary inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm disabled:opacity-60"
                                    >
                                        {creating ? (
                                            "Creating..."
                                        ) : (
                                            <>
                                                New whiteboard
                                                <ArrowRight className="h-[15px] w-[15px]" />
                                            </>
                                        )}
                                    </button>
                                    {createError ? (
                                        <p className="rounded-lg border border-[var(--color-coral)]/30 bg-[var(--color-coral)]/10 px-3 py-2 text-xs text-[var(--color-coral)]">
                                            {createError}
                                        </p>
                                    ) : null}
                                </form>
                            </div>

                            {/* Decorative fresh-artboard preview. */}
                            <div
                                className="relative hidden aspect-square w-[200px] shrink-0 place-items-center rounded-2xl border border-dashed border-hairline sm:grid"
                                style={{
                                    backgroundImage:
                                        "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
                                    backgroundSize: "18px 18px",
                                }}
                                aria-hidden
                            >
                                <span className="floaty grid h-14 w-14 place-items-center rounded-xl border border-hairline bg-white/[0.04] text-[var(--color-indigo)]">
                                    <Plus className="h-6 w-6" />
                                </span>
                                <span className="coord absolute left-3 top-3">
                                    x:0 y:0
                                </span>
                                <span className="coord absolute bottom-3 right-3">
                                    new
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Secondary: open by slug */}
                    <section className="artboard mt-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
                        <div className="flex items-center gap-3 sm:shrink-0">
                            <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.05] text-ink-dim">
                                <DoorOpen className="h-4 w-4" />
                            </span>
                            <h2 className="whitespace-nowrap font-display text-base font-bold text-ink">
                                Open a board
                            </h2>
                        </div>
                        <form
                            onSubmit={handleOpen}
                            className="flex flex-1 flex-col gap-3 sm:flex-row"
                        >
                            <input
                                type="text"
                                placeholder="board-slug"
                                value={openSlug}
                                onChange={(e) => setOpenSlug(e.target.value)}
                                aria-label="Board slug to open"
                                className="w-full flex-1 rounded-lg border border-hairline bg-white/[0.03] px-4 py-2.5 font-mono text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus-visible:border-[var(--color-indigo)] focus-visible:outline-none"
                            />
                            <button
                                type="submit"
                                className="btn-ghost inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm"
                            >
                                Open board
                                <ArrowRight className="h-[15px] w-[15px]" />
                            </button>
                        </form>
                    </section>

                    {/* Recent boards */}
                    <div className="mt-12">
                        <div className="mb-4 flex items-center justify-between">
                            <p className="coord">
                                //{" "}
                                {roomsLoading
                                    ? "loading recents"
                                    : `${recentRooms.length} recent`}
                            </p>
                            <Link
                                href="/rooms"
                                className="inline-flex items-center gap-1.5 rounded font-mono text-xs text-ink-faint transition-colors hover:text-[var(--color-indigo)] focus-visible:text-[var(--color-indigo)] focus-visible:outline-none"
                            >
                                All boards
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>

                        {roomsLoading ? (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {[0, 1, 2].map((i) => (
                                    <div
                                        key={i}
                                        className="h-24 animate-pulse rounded-2xl border border-hairline bg-white/[0.02]"
                                    />
                                ))}
                            </div>
                        ) : roomsError ? (
                            <p className="rounded-lg border border-hairline bg-white/[0.02] px-4 py-3 text-sm text-ink-faint">
                                Couldn&apos;t load recent boards. Try{" "}
                                <Link
                                    href="/rooms"
                                    className="text-[var(--color-indigo)] underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
                                >
                                    the full list
                                </Link>
                                .
                            </p>
                        ) : recentRooms.length === 0 ? (
                            <div className="artboard relative overflow-hidden px-6 py-10 text-center">
                                <div className="relative flex flex-col items-center gap-2">
                                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-hairline bg-white/[0.04] text-[var(--color-amber)]">
                                        <Sparkles className="h-4 w-4" />
                                    </span>
                                    <p className="text-sm text-ink-dim">
                                        No boards yet — your first one is one
                                        click above.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {recentRooms.map((room, i) => {
                                    const accent = ACCENTS[i % ACCENTS.length];
                                    return (
                                        <Link
                                            key={room.id}
                                            href={`/whiteboard/${room.slug}`}
                                            className="group relative overflow-hidden rounded-2xl border border-hairline bg-white/[0.02] p-4 transition-all duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.04] focus-visible:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-indigo)]"
                                        >
                                            <span
                                                className="absolute inset-x-0 top-0 h-[3px]"
                                                style={{ background: accent }}
                                                aria-hidden
                                            />
                                            <div className="flex items-center justify-between gap-3">
                                                <span
                                                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[11px] font-bold text-[#0a0c12]"
                                                    style={{
                                                        background: accent,
                                                    }}
                                                    aria-hidden
                                                >
                                                    {room.slug
                                                        .slice(0, 1)
                                                        .toUpperCase()}
                                                </span>
                                                <span className="coord shrink-0">
                                                    {formatCreatedAt(
                                                        room.createdAt
                                                    )}
                                                </span>
                                            </div>
                                            <h3 className="mt-3 truncate font-mono text-sm font-semibold text-ink">
                                                {room.slug}
                                            </h3>
                                            <span className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink-faint opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                Open board
                                                <ArrowRight className="h-3 w-3" />
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function WhiteboardIndexPage() {
    return (
        <AuthGuard>
            <WhiteboardHubContent />
        </AuthGuard>
    );
}

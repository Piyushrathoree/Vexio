"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ArrowRight,
    LogOut,
    Plus,
    RefreshCw,
    Search,
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

type SortKey = "newest" | "oldest" | "az";

const ACCENTS = [
    "var(--color-indigo)",
    "var(--color-violet)",
    "var(--color-mint)",
    "var(--color-coral)",
];

const SORTS: { key: SortKey; label: string }[] = [
    { key: "newest", label: "Newest" },
    { key: "oldest", label: "Oldest" },
    { key: "az", label: "A–Z" },
];

// Mirrors the http-server's slug contract: lowercase letters, numbers, and
// hyphens, 3-64 characters. Kept in sync with apps/http-server/controllers.
const SLUG_PATTERN = /^[a-z0-9-]+$/;

const isValidSlug = (slug: string) =>
    slug.length >= 3 && slug.length <= 64 && SLUG_PATTERN.test(slug);

function formatCreatedAt(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
    });
}

function RoomsContent() {
    const router = useRouter();

    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [newSlug, setNewSlug] = useState("");
    const [slugTouched, setSlugTouched] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    const [query, setQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortKey>("newest");

    const loadRooms = useCallback(async () => {
        setLoading(true);
        setLoadError("");

        const res = await apiFetch("/api/v1/rooms");
        if (!res.ok) {
            setLoadError(`Couldn't load your boards — ${res.status}.`);
            setLoading(false);
            return;
        }

        const json = await res.json();
        setRooms(json.data?.rooms ?? []);
        setLoading(false);
    }, []);

    useEffect(() => {
        void loadRooms();
    }, [loadRooms]);

    const slugNormalized = newSlug.trim().toLowerCase();
    const slugInvalid =
        slugTouched &&
        slugNormalized.length > 0 &&
        !isValidSlug(slugNormalized);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSlugTouched(true);

        if (!isValidSlug(slugNormalized)) {
            // Inline hint below the field already states the rule.
            return;
        }

        setCreateError("");
        setCreating(true);

        const res = await apiFetch("/api/v1/room", {
            method: "POST",
            body: JSON.stringify({ slug: slugNormalized }),
        });

        setCreating(false);

        if (!res.ok) {
            const json = await res.json().catch(() => null);
            setCreateError(
                json?.message ?? `Couldn't create that board — ${res.status}.`
            );
            return;
        }

        const json = await res.json();
        const room = json.data?.room as Room | undefined;
        if (room?.slug) {
            router.push(`/whiteboard/${room.slug}`);
        }
    };

    const goToSlug = useCallback(
        (slug: string) => {
            const s = slug.trim().toLowerCase();
            if (!s) return;
            router.push(`/whiteboard/${s}`);
        },
        [router]
    );

    const handleOpen = (e: React.FormEvent) => {
        e.preventDefault();
        goToSlug(query);
    };

    const handleSignOut = async () => {
        await signOut();
        router.replace("/login");
    };

    const normalizedQuery = query.trim().toLowerCase();

    const visibleRooms = useMemo(() => {
        const filtered = normalizedQuery
            ? rooms.filter((r) =>
                  r.slug.toLowerCase().includes(normalizedQuery)
              )
            : rooms;

        const sorted = [...filtered];
        if (sortBy === "newest") {
            sorted.sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
            );
        } else if (sortBy === "oldest") {
            sorted.sort(
                (a, b) =>
                    new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime()
            );
        } else {
            sorted.sort((a, b) => a.slug.localeCompare(b.slug));
        }
        return sorted;
    }, [rooms, normalizedQuery, sortBy]);

    const countLabel = loading
        ? "loading"
        : normalizedQuery
          ? `${visibleRooms.length} of ${rooms.length} match${
                rooms.length === 1 ? "" : "es"
            }`
          : `${rooms.length} board${rooms.length === 1 ? "" : "s"}`;

    const noMatches = !loading && rooms.length > 0 && visibleRooms.length === 0;

    return (
        <div className="lp">
            {/* Ambient dot-grid canvas behind everything. */}
            <div className="lp-bg" aria-hidden />

            <main className="relative z-10 min-h-screen px-4 pb-24 pt-6 sm:px-6">
                <div className="mx-auto max-w-6xl">
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
                                href="/whiteboard"
                                className="btn-ghost hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm sm:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-indigo)]"
                            >
                                <Plus className="h-[15px] w-[15px]" />
                                Blank canvas
                            </Link>
                            <button
                                type="button"
                                onClick={() => void loadRooms()}
                                className="btn-ghost inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-indigo)]"
                            >
                                <RefreshCw
                                    className={`h-[15px] w-[15px] ${
                                        loading ? "animate-spin" : ""
                                    }`}
                                />
                                <span className="hidden sm:inline">
                                    Refresh
                                </span>
                            </button>
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
                        <p className="coord mb-3">// index</p>
                        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                            The full grid
                        </h1>
                        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-dim">
                            Every board you and your team have opened —
                            search it, sort it, or start a fresh one without
                            leaving this page.
                        </p>
                    </div>

                    {/* Toolbar: create + find */}
                    <section className="artboard relative mt-8 overflow-hidden p-5 sm:p-6">
                        <div
                            className="aurora -right-14 -top-20 h-48 w-48 bg-[radial-gradient(circle,var(--color-indigo),transparent_60%)]"
                            aria-hidden
                        />
                        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
                            {/* Create */}
                            <form onSubmit={handleCreate} className="space-y-2">
                                <label
                                    htmlFor="new-room-slug"
                                    className="mb-1 flex items-center gap-2 font-display text-sm font-bold text-ink"
                                >
                                    <span className="grid h-6 w-6 place-items-center rounded-md bg-[var(--color-indigo)]/15 text-[var(--color-indigo)]">
                                        <Plus className="h-3.5 w-3.5" />
                                    </span>
                                    Start a board
                                </label>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <input
                                        id="new-room-slug"
                                        type="text"
                                        required
                                        placeholder="new-room-slug"
                                        value={newSlug}
                                        onChange={(e) => {
                                            setNewSlug(e.target.value);
                                            if (createError) setCreateError("");
                                        }}
                                        onBlur={() => setSlugTouched(true)}
                                        aria-invalid={slugInvalid}
                                        className={`w-full flex-1 rounded-lg border bg-white/[0.03] px-4 py-2.5 font-mono text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus-visible:outline-none ${
                                            slugInvalid
                                                ? "border-[var(--color-coral)]/60 focus-visible:border-[var(--color-coral)]"
                                                : "border-hairline focus-visible:border-[var(--color-indigo)]"
                                        }`}
                                    />
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="btn-primary inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm disabled:opacity-60"
                                    >
                                        {creating ? (
                                            "Creating…"
                                        ) : (
                                            <>
                                                Create room
                                                <ArrowRight className="h-[15px] w-[15px]" />
                                            </>
                                        )}
                                    </button>
                                </div>
                                <p
                                    className={`font-mono text-[11px] ${
                                        slugInvalid
                                            ? "text-[var(--color-coral)]"
                                            : "text-ink-faint"
                                    }`}
                                >
                                    {slugInvalid
                                        ? "Use lowercase letters, numbers, and hyphens — 3 to 64 characters."
                                        : "lowercase letters, numbers, hyphens · 3–64 chars"}
                                </p>
                                {createError ? (
                                    <p className="rounded-lg border border-[var(--color-coral)]/30 bg-[var(--color-coral)]/10 px-3 py-2 text-xs text-[var(--color-coral)]">
                                        {createError}
                                    </p>
                                ) : null}
                            </form>

                            {/* Find / open */}
                            <div className="lg:w-72">
                                <span className="mb-1 flex items-center gap-2 font-display text-sm font-bold text-ink">
                                    <span className="grid h-6 w-6 place-items-center rounded-md bg-white/[0.05] text-ink-dim">
                                        <Search className="h-3.5 w-3.5" />
                                    </span>
                                    Find a board
                                </span>
                                <form onSubmit={handleOpen} className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
                                    <input
                                        type="text"
                                        placeholder="search or paste a slug"
                                        value={query}
                                        onChange={(e) =>
                                            setQuery(e.target.value)
                                        }
                                        aria-label="Search boards or open by slug"
                                        className="w-full rounded-lg border border-hairline bg-white/[0.03] py-2.5 pl-9 pr-4 font-mono text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus-visible:border-[var(--color-indigo)] focus-visible:outline-none"
                                    />
                                </form>
                                <p className="mt-1.5 font-mono text-[11px] text-ink-faint">
                                    press enter to open an exact slug
                                </p>

                                {rooms.length > 1 ? (
                                    <div
                                        className="segmented mt-3"
                                        role="tablist"
                                        aria-label="Sort boards"
                                    >
                                        {SORTS.map(({ key, label }) => (
                                            <button
                                                key={key}
                                                type="button"
                                                role="tab"
                                                aria-selected={sortBy === key}
                                                onClick={() => setSortBy(key)}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </section>

                    {loadError ? (
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-coral)]/30 bg-[var(--color-coral)]/10 px-4 py-3 text-sm text-[var(--color-coral)]">
                            <span>{loadError}</span>
                            <button
                                type="button"
                                onClick={() => void loadRooms()}
                                className="btn-ghost inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs"
                            >
                                <RefreshCw className="h-3 w-3" />
                                Try again
                            </button>
                        </div>
                    ) : null}

                    {/* Rooms grid */}
                    <div className="mt-12">
                        <p className="coord mb-4">// {countLabel}</p>

                        {loading ? (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                    <div
                                        key={i}
                                        className="h-36 animate-pulse rounded-2xl border border-hairline bg-white/[0.02]"
                                    />
                                ))}
                            </div>
                        ) : rooms.length === 0 ? (
                            <div className="artboard relative overflow-hidden px-6 py-14 text-center sm:px-10">
                                <div className="aurora inset-x-1/3 -top-12 h-56 bg-[radial-gradient(circle,var(--color-violet),transparent_60%)]" />
                                <div className="relative">
                                    <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-hairline bg-white/[0.04] text-[var(--color-amber)]">
                                        <Sparkles className="h-5 w-5" />
                                    </span>
                                    <h3 className="font-display text-xl font-bold text-ink">
                                        No boards yet
                                    </h3>
                                    <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-dim">
                                        This canvas is empty. Give it a slug
                                        in the panel above and start
                                        sketching — your team can jump in the
                                        moment it&apos;s live.
                                    </p>
                                </div>
                            </div>
                        ) : noMatches ? (
                            <div className="artboard relative overflow-hidden px-6 py-12 text-center sm:px-10">
                                <div className="relative">
                                    <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-hairline bg-white/[0.04] text-ink-dim">
                                        <Search className="h-5 w-5" />
                                    </span>
                                    <h3 className="font-display text-xl font-bold text-ink">
                                        No board named “{normalizedQuery}”
                                    </h3>
                                    <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-dim">
                                        Clear the search to see every board,
                                        or open this exact slug if you know
                                        it exists.
                                    </p>
                                    <div className="relative mt-5 flex flex-wrap items-center justify-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setQuery("")}
                                            className="btn-ghost inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm"
                                        >
                                            Clear search
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => goToSlug(query)}
                                            className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm"
                                        >
                                            Open it directly
                                            <ArrowRight className="h-[15px] w-[15px]" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {visibleRooms.map((room, i) => {
                                    const accent = ACCENTS[i % ACCENTS.length];
                                    const col = i % 3;
                                    const row = Math.floor(i / 3);
                                    const roomId = `R-${String(
                                        room.id
                                    ).padStart(2, "0")}`;

                                    return (
                                        <Link
                                            key={room.id}
                                            href={`/whiteboard/${room.slug}`}
                                            className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-white/[0.02] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.04] focus-visible:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-indigo)]"
                                        >
                                            {/* Mini dotted-grid backdrop — every card is its own artboard. */}
                                            <span
                                                className="pointer-events-none absolute inset-0 opacity-40"
                                                style={{
                                                    backgroundImage:
                                                        "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.09) 1px, transparent 0)",
                                                    backgroundSize:
                                                        "16px 16px",
                                                    maskImage:
                                                        "radial-gradient(ellipse 90% 90% at 100% 0%, #000 0%, transparent 70%)",
                                                    WebkitMaskImage:
                                                        "radial-gradient(ellipse 90% 90% at 100% 0%, #000 0%, transparent 70%)",
                                                }}
                                                aria-hidden
                                            />
                                            <span
                                                className="absolute inset-x-0 top-0 h-[3px]"
                                                style={{ background: accent }}
                                                aria-hidden
                                            />

                                            <div className="relative flex items-start justify-between gap-3">
                                                <span
                                                    className="chip"
                                                    style={{
                                                        color: accent,
                                                        background: `color-mix(in srgb, ${accent} 16%, transparent)`,
                                                        borderColor: `color-mix(in srgb, ${accent} 40%, transparent)`,
                                                    }}
                                                >
                                                    {roomId}
                                                </span>
                                                <span className="coord shrink-0">
                                                    x:{col} y:{row}
                                                </span>
                                            </div>

                                            <h3 className="relative mt-4 truncate font-display text-lg font-bold text-ink">
                                                {room.slug}
                                            </h3>

                                            <div className="relative mt-auto flex items-center justify-between pt-5">
                                                <span className="coord">
                                                    {formatCreatedAt(
                                                        room.createdAt
                                                    )}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-faint transition-colors group-hover:text-[var(--color-indigo)]">
                                                    Open
                                                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                                </span>
                                            </div>

                                            {/* Decorative collaborator-cursor accent — a little life on the tile. */}
                                            <span
                                                className="pointer-events-none absolute bottom-4 right-4 flex translate-y-2 items-end gap-1 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
                                                aria-hidden
                                            >
                                                <svg
                                                    width="14"
                                                    height="14"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    style={{
                                                        filter: "drop-shadow(0 3px 6px rgba(0,0,0,.55))",
                                                    }}
                                                >
                                                    <path
                                                        d="M4 2.5 11.5 20 14 13 21 10.5 4 2.5Z"
                                                        fill={accent}
                                                        stroke="#0a0c12"
                                                        strokeWidth="1.2"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                                <span
                                                    className="cursor-tag"
                                                    style={{
                                                        background: accent,
                                                    }}
                                                >
                                                    open
                                                </span>
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

export default function RoomsPage() {
    return (
        <AuthGuard>
            <RoomsContent />
        </AuthGuard>
    );
}

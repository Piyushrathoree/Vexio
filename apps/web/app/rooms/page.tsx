"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ArrowRight,
    Plus,
    RefreshCw,
    Search,
    Sparkles,
} from "lucide-react";
import { AuthGuard } from "../../components/AuthGuard";
import Navbar from "../../components/Navbar";
import { apiFetch } from "../../lib/api";

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

const SLUG_PATTERN = /^[a-z0-9-]+$/;

const isValidSlug = (slug: string) =>
    slug.length >= 3 && slug.length <= 64 && SLUG_PATTERN.test(slug);

const btnPrimary =
    "btn-primary focus-ring inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:pointer-events-none disabled:opacity-50";

const btnGhost =
    "btn-ghost focus-ring inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 text-sm disabled:pointer-events-none disabled:opacity-50";

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
        ? "Loading…"
        : normalizedQuery
          ? `${visibleRooms.length} of ${rooms.length} match${
                rooms.length === 1 ? "" : "es"
            }`
          : `${rooms.length} board${rooms.length === 1 ? "" : "s"}`;

    const noMatches = !loading && rooms.length > 0 && visibleRooms.length === 0;

    return (
        <div className="app">
            <div className="app-bg" aria-hidden />
            <div className="relative z-10 mx-auto max-w-6xl">
                <Navbar />
                <main className="px-4 pb-24 pt-2 sm:px-6">
                    <div className="mt-8">
                        <p className="coord mb-2">{"// your workspace"}</p>
                        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
                            Your boards
                        </h1>
                        <p className="mt-2 max-w-xl text-sm text-ink-dim">
                            Search, sort, or create a new board without leaving
                            this page.
                        </p>
                    </div>

                    <section className="card mt-8 p-5 sm:p-6">
                        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
                            <form onSubmit={handleCreate} className="space-y-2">
                                <label
                                    htmlFor="new-room-slug"
                                    className="mb-1 flex items-center gap-2 text-sm font-medium text-ink"
                                >
                                    <span className="grid h-6 w-6 place-items-center rounded-lg border border-hairline bg-white/[0.03] text-indigo">
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
                                        className={`input font-mono flex-1 ${
                                            slugInvalid
                                                ? "border-[var(--color-coral)]"
                                                : ""
                                        }`}
                                    />
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className={btnPrimary}
                                    >
                                        {creating ? (
                                            "Creating…"
                                        ) : (
                                            <>
                                                Create room
                                                <ArrowRight className="h-4 w-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                                <p
                                    className={`text-xs ${
                                        slugInvalid
                                            ? "text-[var(--color-coral)]"
                                            : "text-ink-faint"
                                    }`}
                                >
                                    {slugInvalid
                                        ? "Use lowercase letters, numbers, and hyphens — 3 to 64 characters."
                                        : "Lowercase letters, numbers, hyphens · 3–64 chars"}
                                </p>
                                {createError ? (
                                    <p className="rounded-xl border border-[var(--color-coral)]/30 bg-[var(--color-coral)]/10 px-3 py-2 text-xs text-[var(--color-coral)]">
                                        {createError}
                                    </p>
                                ) : null}
                            </form>

                            <div className="lg:w-72">
                                <span className="mb-1 flex items-center gap-2 text-sm font-medium text-ink">
                                    <span className="grid h-6 w-6 place-items-center rounded-lg border border-hairline bg-white/[0.03] text-ink-dim">
                                        <Search className="h-3.5 w-3.5" />
                                    </span>
                                    Find a board
                                </span>
                                <form onSubmit={handleOpen} className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
                                    <input
                                        type="text"
                                        placeholder="Search or paste a slug"
                                        value={query}
                                        onChange={(e) =>
                                            setQuery(e.target.value)
                                        }
                                        aria-label="Search boards or open by slug"
                                        className="input font-mono pl-9"
                                    />
                                </form>
                                <p className="mt-1.5 text-xs text-ink-faint">
                                    Press enter to open an exact slug
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
                                                className={
                                                    sortBy === key
                                                        ? "is-active"
                                                        : undefined
                                                }
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
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-coral)]/30 bg-[var(--color-coral)]/10 px-4 py-3 text-sm text-[var(--color-coral)]">
                            <span>{loadError}</span>
                            <button
                                type="button"
                                onClick={() => void loadRooms()}
                                className={`${btnGhost} h-8 px-3 text-xs`}
                            >
                                <RefreshCw className="h-3 w-3" />
                                Try again
                            </button>
                        </div>
                    ) : null}

                    <div className="mt-12">
                        <p className="coord mb-4">{countLabel}</p>

                        {loading ? (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                    <div
                                        key={i}
                                        className="card h-36 animate-pulse"
                                    />
                                ))}
                            </div>
                        ) : rooms.length === 0 ? (
                            <div className="card px-6 py-14 text-center sm:px-10">
                                <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl border border-hairline bg-white/[0.03] text-indigo">
                                    <Sparkles className="h-5 w-5" />
                                </span>
                                <h3 className="font-display text-lg font-bold text-ink">
                                    No boards yet
                                </h3>
                                <p className="mx-auto mt-2 max-w-sm text-sm text-ink-dim">
                                    Give it a slug in the panel above and start
                                    sketching — your team can jump in the moment
                                    it&apos;s live.
                                </p>
                            </div>
                        ) : noMatches ? (
                            <div className="card px-6 py-12 text-center sm:px-10">
                                <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl border border-hairline bg-white/[0.03] text-ink-dim">
                                    <Search className="h-5 w-5" />
                                </span>
                                <h3 className="font-display text-lg font-bold text-ink">
                                    No board named &ldquo;{normalizedQuery}&rdquo;
                                </h3>
                                <p className="mx-auto mt-2 max-w-sm text-sm text-ink-dim">
                                    Clear the search to see every board, or open
                                    this exact slug if you know it exists.
                                </p>
                                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setQuery("")}
                                        className={btnGhost}
                                    >
                                        Clear search
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => goToSlug(query)}
                                        className={btnPrimary}
                                    >
                                        Open it directly
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {visibleRooms.map((room, i) => {
                                    const accent = ACCENTS[i % ACCENTS.length];
                                    const roomId = `R-${String(
                                        room.id
                                    ).padStart(2, "0")}`;

                                    return (
                                        <Link
                                            key={room.id}
                                            href={`/whiteboard/${room.slug}`}
                                            className="card group relative flex h-full flex-col overflow-hidden p-5 transition-colors hover:border-white/20 hover:bg-white/[0.04] focus-ring"
                                        >
                                            <span
                                                className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl"
                                                style={{ background: accent }}
                                                aria-hidden
                                            />
                                            <div className="flex items-start justify-between gap-3">
                                                <span
                                                    className="chip"
                                                    style={{
                                                        color: accent,
                                                        borderColor: `color-mix(in srgb, ${accent} 30%, transparent)`,
                                                        background: `color-mix(in srgb, ${accent} 12%, transparent)`,
                                                    }}
                                                >
                                                    {roomId}
                                                </span>
                                            </div>

                                            <h3 className="mt-4 truncate text-base font-semibold text-ink">
                                                {room.slug}
                                            </h3>

                                            <div className="mt-auto flex items-center justify-between pt-5">
                                                <span className="text-xs text-ink-faint">
                                                    {formatCreatedAt(
                                                        room.createdAt
                                                    )}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5 text-xs text-ink-dim transition-colors group-hover:text-indigo">
                                                    Open
                                                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                                </span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </main>
            </div>
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

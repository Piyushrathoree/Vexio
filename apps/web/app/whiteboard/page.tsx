"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
    ArrowRight,
    DoorOpen,
    Plus,
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

const ACCENTS = [
    "var(--color-indigo)",
    "var(--color-violet)",
    "var(--color-mint)",
    "var(--color-coral)",
];

const SLUG_PATTERN = /^[a-z0-9-]+$/;

const isValidSlug = (slug: string) =>
    slug.length >= 3 && slug.length <= 64 && SLUG_PATTERN.test(slug);

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

const btnPrimary =
    "btn-primary focus-ring inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:pointer-events-none disabled:opacity-50";

const btnGhost =
    "btn-ghost focus-ring inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 text-sm disabled:pointer-events-none disabled:opacity-50";

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

    const recentRooms = rooms.slice(0, 6);

    return (
        <div className="app">
            <div className="app-bg" aria-hidden />
            <div className="relative z-10 mx-auto max-w-5xl">
                <Navbar />
                <main className="px-4 pb-24 pt-2 sm:px-6">
                    <div className="mt-8">
                        <p className="coord mb-2">{"// blank canvas"}</p>
                        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
                            Whiteboards
                        </h1>
                        <p className="mt-2 max-w-xl text-sm text-ink-dim">
                            Spin up a blank board in one click, or jump back
                            into one your team already started.
                        </p>
                    </div>

                    <section className="card mt-8 p-6 sm:p-8">
                        <div className="grid gap-8 sm:grid-cols-[1.2fr_auto] sm:items-center">
                            <div>
                                <div className="mb-4 flex items-center gap-2">
                                    <span className="grid h-8 w-8 place-items-center rounded-lg border border-hairline bg-white/[0.03] text-indigo">
                                        <Plus className="h-4 w-4" />
                                    </span>
                                    <h2 className="font-display text-lg font-bold tracking-tight text-ink">
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
                                            className="input font-mono"
                                        />
                                        <p className="mt-1.5 text-xs text-ink-faint">
                                            Lowercase letters, numbers, hyphens
                                            · 3–64 chars
                                        </p>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className={btnPrimary}
                                    >
                                        {creating ? (
                                            "Creating…"
                                        ) : (
                                            <>
                                                New whiteboard
                                                <ArrowRight className="h-4 w-4" />
                                            </>
                                        )}
                                    </button>
                                    {createError ? (
                                        <p className="rounded-xl border border-[var(--color-coral)]/30 bg-[var(--color-coral)]/10 px-3 py-2 text-xs text-[var(--color-coral)]">
                                            {createError}
                                        </p>
                                    ) : null}
                                </form>
                            </div>

                            <div
                                className="relative hidden aspect-square w-[200px] shrink-0 place-items-center rounded-2xl border border-dashed border-hairline bg-white/[0.02] sm:grid"
                                aria-hidden
                            >
                                <span className="grid h-14 w-14 place-items-center rounded-xl border border-hairline bg-white/[0.03] text-indigo">
                                    <Plus className="h-6 w-6" />
                                </span>
                            </div>
                        </div>
                    </section>

                    <section className="card mt-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
                        <div className="flex items-center gap-3 sm:shrink-0">
                            <span className="grid h-8 w-8 place-items-center rounded-lg border border-hairline bg-white/[0.03] text-ink-dim">
                                <DoorOpen className="h-4 w-4" />
                            </span>
                            <h2 className="whitespace-nowrap text-base font-semibold text-ink">
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
                                className="input font-mono flex-1"
                            />
                            <button
                                type="submit"
                                className={`${btnGhost} shrink-0`}
                            >
                                Open board
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </form>
                    </section>

                    <div className="mt-12">
                        <div className="mb-4 flex items-center justify-between">
                            <p className="coord">
                                {roomsLoading
                                    ? "Loading recents…"
                                    : `${recentRooms.length} recent`}
                            </p>
                            <Link
                                href="/rooms"
                                className="inline-flex items-center gap-1.5 text-xs text-ink-dim transition-colors hover:text-indigo focus-ring"
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
                                        className="card h-24 animate-pulse"
                                    />
                                ))}
                            </div>
                        ) : roomsError ? (
                            <p className="card px-4 py-3 text-sm text-ink-dim">
                                Couldn&apos;t load recent boards. Try{" "}
                                <Link
                                    href="/rooms"
                                    className="text-indigo underline-offset-2 hover:underline focus-ring"
                                >
                                    the full list
                                </Link>
                                .
                            </p>
                        ) : recentRooms.length === 0 ? (
                            <div className="card px-6 py-10 text-center">
                                <span className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-xl border border-hairline bg-white/[0.03] text-indigo">
                                    <Sparkles className="h-4 w-4" />
                                </span>
                                <p className="text-sm text-ink-dim">
                                    No boards yet — your first one is one click
                                    above.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {recentRooms.map((room, i) => {
                                    const accent = ACCENTS[i % ACCENTS.length];
                                    return (
                                        <Link
                                            key={room.id}
                                            href={`/whiteboard/${room.slug}`}
                                            className="card group relative overflow-hidden p-4 transition-colors hover:border-white/20 hover:bg-white/[0.04] focus-ring"
                                        >
                                            <span
                                                className="absolute inset-x-0 top-0 h-0.5"
                                                style={{ background: accent }}
                                                aria-hidden
                                            />
                                            <div className="flex items-center justify-between gap-3">
                                                <span
                                                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[11px] font-bold text-[var(--color-canvas)]"
                                                    style={{
                                                        background: accent,
                                                    }}
                                                    aria-hidden
                                                >
                                                    {room.slug
                                                        .slice(0, 1)
                                                        .toUpperCase()}
                                                </span>
                                                <span className="shrink-0 text-xs text-ink-faint">
                                                    {formatCreatedAt(
                                                        room.createdAt
                                                    )}
                                                </span>
                                            </div>
                                            <h3 className="mt-3 truncate text-sm font-semibold text-ink">
                                                {room.slug}
                                            </h3>
                                            <span className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink-dim opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                Open board
                                                <ArrowRight className="h-3 w-3" />
                                            </span>
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

export default function WhiteboardIndexPage() {
    return (
        <AuthGuard>
            <WhiteboardHubContent />
        </AuthGuard>
    );
}

"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { AuthGuard } from "../../components/AuthGuard";
import Navbar from "../../components/Navbar";
import { BoardCard } from "../../components/rooms/BoardCard";
import { parseBoardRef } from "../../components/rooms/board-ref";
import { MembersModal } from "../../components/rooms/MembersModal";
import { ShareModal } from "../../components/rooms/ShareModal";
import { useSession } from "../../lib/auth-client";
import {
    createRoom as createRoomRequest,
    fetchRooms,
    joinRoom,
    type Room,
    type RoomSummary,
} from "../../lib/rooms-api";

type SortKey = "newest" | "oldest" | "az";
type Scope = "all" | "owned" | "shared";

const SORTS: { key: SortKey; label: string }[] = [
    { key: "newest", label: "Newest" },
    { key: "oldest", label: "Oldest" },
    { key: "az", label: "A–Z" },
];

// Boards can genuinely be shared now (RoomMember + invites), so ownership is a
// real axis to slice on rather than decoration.
const SCOPES: { key: Scope; label: string }[] = [
    { key: "all", label: "All" },
    { key: "owned", label: "Owned" },
    { key: "shared", label: "Shared" },
];

const SLUG_PATTERN = /^[a-z0-9-]+$/;
const isValidSlug = (slug: string) =>
    slug.length >= 3 && slug.length <= 64 && SLUG_PATTERN.test(slug);

const btnPrimary =
    "btn-primary focus-ring inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:pointer-events-none disabled:opacity-50";

const btnGhost =
    "btn-ghost focus-ring inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 text-sm disabled:pointer-events-none disabled:opacity-50";

function RoomsContent() {
    const router = useRouter();
    const { data: session } = useSession();
    const currentUserId = session?.user?.id;

    const createInputRef = useRef<HTMLInputElement>(null);
    const openInputRef = useRef<HTMLInputElement>(null);

    const [rooms, setRooms] = useState<RoomSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [newSlug, setNewSlug] = useState("");
    const [slugTouched, setSlugTouched] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    const [openValue, setOpenValue] = useState("");
    const [opening, setOpening] = useState(false);
    const [openError, setOpenError] = useState("");

    const [query, setQuery] = useState("");
    const [scope, setScope] = useState<Scope>("all");
    const [sortBy, setSortBy] = useState<SortKey>("newest");

    const [shareRoom, setShareRoom] = useState<RoomSummary | null>(null);
    const [membersRoom, setMembersRoom] = useState<RoomSummary | null>(null);

    const loadRooms = useCallback(async () => {
        setLoading(true);
        setLoadError("");

        const result = await fetchRooms();
        if (!result.ok) {
            setLoadError(`Couldn't load your boards — ${result.message}`);
            setLoading(false);
            return;
        }

        setRooms(result.data.rooms ?? []);
        setLoading(false);
    }, []);

    useEffect(() => {
        void loadRooms();
    }, [loadRooms]);

    const slugNormalized = newSlug.trim().toLowerCase();
    const slugInvalid =
        slugTouched && slugNormalized.length > 0 && !isValidSlug(slugNormalized);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSlugTouched(true);

        if (!isValidSlug(slugNormalized)) return;

        setCreateError("");
        setCreating(true);

        const result = await createRoomRequest(slugNormalized);

        if (!result.ok) {
            setCreating(false);
            setCreateError(
                result.status === 409
                    ? "A board already uses that slug — pick another."
                    : result.message
            );
            return;
        }

        if (result.data.room?.slug) {
            router.push(`/whiteboard/${result.data.room.slug}`);
        } else {
            setCreating(false);
        }
    };

    // Joining is what makes an open-by-link actually work: it enrols the caller
    // as an EDITOR the first time and is a no-op afterwards, so the board page
    // no longer 403s on arrival.
    const openBoardRef = useCallback(
        async (raw: string) => {
            // This can be triggered from the no-match panel far down the page,
            // so failures pull focus back to the field the message renders under.
            const fail = (message: string) => {
                setOpening(false);
                setOpenError(message);
                openInputRef.current?.focus();
            };

            const ref = parseBoardRef(raw);
            if (!ref) {
                fail("Paste a board link, or type a board's slug.");
                return;
            }

            if (ref.kind === "invite") {
                setOpening(true);
                setOpenError("");
                router.push(`/invite/${encodeURIComponent(ref.token)}`);
                return;
            }

            if (!isValidSlug(ref.slug)) {
                fail(
                    "That isn't a board slug — lowercase letters, numbers and hyphens, 3–64 characters."
                );
                return;
            }

            setOpening(true);
            setOpenError("");

            const result = await joinRoom(ref.slug);

            if (!result.ok) {
                fail(
                    result.status === 404
                        ? `No board called “${ref.slug}”. Check the link, or ask for a fresh one.`
                        : result.status === 403
                          ? "That board isn't open to you — ask its owner for an invite link."
                          : result.message
                );
                return;
            }

            router.push(`/whiteboard/${result.data.room.slug}`);
        },
        [router]
    );

    const handleOpenSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void openBoardRef(openValue);
    };

    const handleRoomRenamed = useCallback(
        (previousSlug: string, updated: Room) => {
            setRooms((prev) =>
                prev.map((r) =>
                    r.slug === previousSlug ? { ...r, ...updated } : r
                )
            );
        },
        []
    );

    const handleRoomLeft = useCallback((slug: string) => {
        setRooms((prev) => prev.filter((r) => r.slug !== slug));
    }, []);

    const handleRoomDeleted = useCallback((slug: string) => {
        setRooms((prev) => prev.filter((r) => r.slug !== slug));
    }, []);

    const isOwned = useCallback(
        (room: RoomSummary) =>
            room.role === "ADMIN" ||
            (!!currentUserId && room.adminId === currentUserId),
        [currentUserId]
    );

    const normalizedQuery = query.trim().toLowerCase();

    const visibleRooms = useMemo(() => {
        let filtered = rooms;

        if (scope !== "all") {
            filtered = filtered.filter((r) =>
                scope === "owned" ? isOwned(r) : !isOwned(r)
            );
        }

        if (normalizedQuery) {
            filtered = filtered.filter((r) =>
                r.slug.toLowerCase().includes(normalizedQuery)
            );
        }

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
    }, [rooms, scope, isOwned, normalizedQuery, sortBy]);

    const narrowed = scope !== "all" || normalizedQuery.length > 0;
    const countLabel = loading
        ? "// loading"
        : narrowed
          ? `// ${visibleRooms.length} of ${rooms.length} board${rooms.length === 1 ? "" : "s"}`
          : `// ${rooms.length} board${rooms.length === 1 ? "" : "s"}`;

    const noMatches = !loading && rooms.length > 0 && visibleRooms.length === 0;

    return (
        <div className="app">
            <div className="app-bg" aria-hidden />
            <div className="relative z-10 mx-auto max-w-6xl">
                <Navbar />
                <main className="px-4 pb-24 pt-2 sm:px-6">
                    <header className="mt-8">
                        <p className="coord mb-2">{"// your workspace"}</p>
                        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
                            Your boards
                        </h1>
                        <p className="mt-2 max-w-xl text-sm text-ink-dim">
                            Every board keeps what you draw on it. Open one from
                            a link, or start a fresh sheet.
                        </p>
                    </header>

                    <section className="mt-8 grid gap-4 lg:grid-cols-2">
                        {/* Start a board */}
                        <form onSubmit={handleCreate} className="card p-5">
                            <p className="coord">{"// new sheet"}</p>
                            <label
                                htmlFor="new-room-slug"
                                className="mt-1 flex items-center gap-2 text-sm font-medium text-ink"
                            >
                                <Plus
                                    className="h-3.5 w-3.5 text-indigo"
                                    aria-hidden
                                />
                                Start a board
                            </label>

                            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                <input
                                    ref={createInputRef}
                                    id="new-room-slug"
                                    type="text"
                                    required
                                    placeholder="quarterly-retro"
                                    value={newSlug}
                                    onChange={(e) => {
                                        setNewSlug(e.target.value);
                                        if (createError) setCreateError("");
                                    }}
                                    onBlur={() => setSlugTouched(true)}
                                    aria-invalid={slugInvalid}
                                    aria-describedby="new-room-slug-hint"
                                    className={`input flex-1 font-mono ${
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
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                                            Creating…
                                        </>
                                    ) : (
                                        <>
                                            Create
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            </div>

                            <p
                                id="new-room-slug-hint"
                                className={`mt-2 text-xs ${
                                    slugInvalid
                                        ? "text-[var(--color-coral)]"
                                        : "text-ink-faint"
                                }`}
                            >
                                {slugInvalid
                                    ? "Use lowercase letters, numbers and hyphens — 3 to 64 characters."
                                    : "Lowercase letters, numbers, hyphens · 3–64 characters"}
                            </p>

                            {createError ? (
                                <p
                                    role="alert"
                                    className="mt-2 rounded-xl border border-[var(--color-coral)]/30 bg-[var(--color-coral)]/10 px-3 py-2 text-xs text-[var(--color-coral)]"
                                >
                                    {createError}
                                </p>
                            ) : null}
                        </form>

                        {/* Open a board — link, invite, or bare slug */}
                        <form onSubmit={handleOpenSubmit} className="card p-5">
                            <p className="coord">{"// by link or slug"}</p>
                            <label
                                htmlFor="open-board-ref"
                                className="mt-1 flex items-center gap-2 text-sm font-medium text-ink"
                            >
                                <ArrowRight
                                    className="h-3.5 w-3.5 text-mint"
                                    aria-hidden
                                />
                                Open a board
                            </label>

                            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                <input
                                    ref={openInputRef}
                                    id="open-board-ref"
                                    type="text"
                                    placeholder="paste a link, or a slug"
                                    value={openValue}
                                    onChange={(e) => {
                                        setOpenValue(e.target.value);
                                        if (openError) setOpenError("");
                                    }}
                                    aria-describedby="open-board-hint"
                                    className="input flex-1 font-mono"
                                />
                                <button
                                    type="submit"
                                    disabled={opening || !openValue.trim()}
                                    className={btnGhost}
                                >
                                    {opening ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                                            Opening…
                                        </>
                                    ) : (
                                        "Open"
                                    )}
                                </button>
                            </div>

                            <p
                                id="open-board-hint"
                                className="mt-2 text-xs text-ink-faint"
                            >
                                A full board link, an invite link, or just the
                                slug — all work.
                            </p>

                            {openError ? (
                                <p
                                    role="alert"
                                    className="mt-2 rounded-xl border border-[var(--color-coral)]/30 bg-[var(--color-coral)]/10 px-3 py-2 text-xs text-[var(--color-coral)]"
                                >
                                    {openError}
                                </p>
                            ) : null}
                        </form>
                    </section>

                    {loadError ? (
                        <div
                            role="alert"
                            className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-coral)]/30 bg-[var(--color-coral)]/10 px-4 py-3 text-sm text-[var(--color-coral)]"
                        >
                            <span>{loadError}</span>
                            <button
                                type="button"
                                onClick={() => void loadRooms()}
                                className={`${btnGhost} h-8 px-3 text-xs`}
                            >
                                <RefreshCw className="h-3 w-3" aria-hidden />
                                Try again
                            </button>
                        </div>
                    ) : null}

                    <div className="mt-12">
                        <div className="flex flex-col gap-3 border-b border-hairline pb-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="coord" aria-live="polite">
                                {countLabel}
                            </p>

                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative w-full sm:w-48">
                                    <Search
                                        className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint"
                                        aria-hidden
                                    />
                                    <input
                                        type="search"
                                        placeholder="Filter by name"
                                        value={query}
                                        onChange={(e) =>
                                            setQuery(e.target.value)
                                        }
                                        aria-label="Filter boards by name"
                                        className="input h-9 w-full py-0 pl-9 font-mono text-xs"
                                    />
                                </div>

                                {/* Toggle buttons, not tabs — there's no tabpanel
                                    for a tablist to own. */}
                                <div
                                    className="segmented"
                                    role="group"
                                    aria-label="Filter boards by ownership"
                                >
                                    {SCOPES.map(({ key, label }) => (
                                        <button
                                            key={key}
                                            type="button"
                                            aria-pressed={scope === key}
                                            onClick={() => setScope(key)}
                                            className={`focus-ring cursor-pointer ${
                                                scope === key ? "is-active" : ""
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>

                                <div
                                    className="segmented"
                                    role="group"
                                    aria-label="Sort boards"
                                >
                                    {SORTS.map(({ key, label }) => (
                                        <button
                                            key={key}
                                            type="button"
                                            aria-pressed={sortBy === key}
                                            onClick={() => setSortBy(key)}
                                            className={`focus-ring cursor-pointer ${
                                                sortBy === key ? "is-active" : ""
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            {loading ? (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {[0, 1, 2, 3, 4, 5].map((i) => (
                                        <div
                                            key={i}
                                            className="card overflow-hidden"
                                            aria-hidden
                                        >
                                            <div className="board-sheet animate-pulse motion-reduce:animate-none" />
                                            <div className="sheet-block">
                                                <div className="h-3 w-24 rounded bg-white/[0.07]" />
                                                <div className="mt-2.5 h-2 w-36 rounded bg-white/[0.04]" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : rooms.length === 0 ? (
                                // A genuinely empty sheet, and an invitation.
                                <div className="card sheet-grid overflow-hidden">
                                    <div className="grid place-items-center px-6 py-16 text-center sm:py-20">
                                        <p className="board-note text-lg">
                                            nothing on the drawing board yet
                                        </p>
                                        <p className="mt-3 max-w-sm text-sm text-ink-dim">
                                            Name a board and it opens onto a
                                            blank sheet. Anyone you send the
                                            link to lands on that same sheet,
                                            live.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                createInputRef.current?.focus()
                                            }
                                            className={`${btnPrimary} mt-6`}
                                        >
                                            Name your first board
                                            <ArrowRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : noMatches ? (
                                <div className="card sheet-grid overflow-hidden">
                                    <div className="grid place-items-center px-6 py-14 text-center">
                                        <p className="board-note text-lg">
                                            no sheet matches that
                                        </p>
                                        <p className="mt-3 max-w-sm text-sm text-ink-dim">
                                            {scope === "shared"
                                                ? "Nothing has been shared with you under that name."
                                                : scope === "owned"
                                                  ? "You don't own a board by that name."
                                                  : "None of your boards are called that — but you can still open one by link."}
                                        </p>
                                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setQuery("");
                                                    setScope("all");
                                                }}
                                                className={btnGhost}
                                            >
                                                Clear filters
                                            </button>
                                            {normalizedQuery ? (
                                                <button
                                                    type="button"
                                                    disabled={opening}
                                                    onClick={() => {
                                                        setOpenValue(query);
                                                        void openBoardRef(
                                                            query
                                                        );
                                                    }}
                                                    className={btnPrimary}
                                                >
                                                    {opening
                                                        ? "Opening…"
                                                        : `Open “${normalizedQuery}”`}
                                                    <ArrowRight className="h-4 w-4" />
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {visibleRooms.map((room) => (
                                        <BoardCard
                                            key={room.id}
                                            room={room}
                                            isAdmin={isOwned(room)}
                                            onShare={setShareRoom}
                                            onManageMembers={setMembersRoom}
                                            onRenamed={handleRoomRenamed}
                                            onLeft={handleRoomLeft}
                                            onDeleted={handleRoomDeleted}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {shareRoom ? (
                <ShareModal
                    room={shareRoom}
                    onClose={() => setShareRoom(null)}
                />
            ) : null}

            {membersRoom ? (
                <MembersModal
                    room={membersRoom}
                    currentUserId={currentUserId}
                    onClose={() => setMembersRoom(null)}
                />
            ) : null}
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

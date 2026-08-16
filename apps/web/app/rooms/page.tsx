"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RotateCw, Search, Users } from "lucide-react";
import { AuthGuard } from "../../components/AuthGuard";
import Navbar from "../../components/Navbar";
import { BoardCard } from "../../components/rooms/BoardCard";
import { parseBoardRef } from "../../components/rooms/board-ref";
import { CreateBoardDialog, JoinBoardDialog, isValidSlug } from "../../components/rooms/BoardDialogs";
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

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
}

function RoomsContent() {
    const router = useRouter();
    const { data: session } = useSession();
    const currentUserId = session?.user?.id;
    const displayName = (session?.user?.name || "there").split(" ")[0] ?? "there";

    const [rooms, setRooms] = useState<RoomSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    const [opening, setOpening] = useState(false);
    const [openError, setOpenError] = useState("");

    const [query, setQuery] = useState("");
    const [scope, setScope] = useState<Scope>("all");
    const [sortBy, setSortBy] = useState<SortKey>("newest");

    const [shareRoom, setShareRoom] = useState<RoomSummary | null>(null);
    const [membersRoom, setMembersRoom] = useState<RoomSummary | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [joinOpen, setJoinOpen] = useState(false);

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

    const handleCreate = async (slug: string) => {
        if (!isValidSlug(slug)) return;

        setCreateError("");
        setCreating(true);

        const result = await createRoomRequest(slug);

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

    const noMatches = !loading && rooms.length > 0 && visibleRooms.length === 0;
    const greetingName =
        displayName.charAt(0).toUpperCase() + displayName.slice(1).toLowerCase();

    return (
        <div className="min-h-screen bg-[#f9f6ef] pt-14">
            <Navbar />

            <div className="relative overflow-hidden bg-[#1a1916]">
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage:
                            "radial-gradient(circle, #f9f6ef 1px, transparent 1px)",
                        backgroundSize: "24px 24px",
                    }}
                />
                <svg
                    className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 opacity-[0.12] sm:block"
                    width="180"
                    height="120"
                    viewBox="0 0 180 120"
                    fill="none"
                    aria-hidden
                >
                    <path
                        d="M10 60 C 40 20, 70 100, 100 60 S 150 20, 170 60"
                        stroke="#e04e1f"
                        strokeWidth="2"
                        strokeLinecap="round"
                        fill="none"
                    />
                    <circle
                        cx="150"
                        cy="30"
                        r="18"
                        stroke="#e04e1f"
                        strokeWidth="1.5"
                        strokeDasharray="5 4"
                        fill="none"
                    />
                </svg>

                <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-8">
                    <div>
                        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7a7770]">
                            {getGreeting()}
                        </p>
                        <h1 className="font-display text-3xl font-semibold text-[#f9f6ef] sm:text-4xl">
                            Hello,{" "}
                            <em className="not-italic text-[#e04e1f]">
                                {greetingName}.
                            </em>
                        </h1>
                        <p className="mt-1 text-sm text-[#a8a49b]">
                            {loading
                                ? "Loading your boards…"
                                : rooms.length === 0
                                  ? "No boards yet, create one to start."
                                  : `${rooms.length} board${rooms.length !== 1 ? "s" : ""} ready to collaborate.`}
                        </p>
                    </div>
                    <div className="flex w-full shrink-0 flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center">
                        <button
                            type="button"
                            onClick={() => setJoinOpen(true)}
                            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#f9f6ef]/15 px-4 py-2 text-sm font-medium text-[#a8a49b] transition-colors hover:border-[#f9f6ef]/30 hover:text-[#f9f6ef] sm:w-auto"
                        >
                            <Users className="h-3.5 w-3.5" />
                            Join Board
                        </button>
                        <button
                            type="button"
                            onClick={() => setCreateOpen(true)}
                            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#e04e1f] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#c94318] sm:w-auto"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            New Board
                        </button>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
                {loadError ? (
                    <div
                        role="alert"
                        className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e8e2d4] bg-white px-6 py-4 text-sm text-[#7a7770]"
                    >
                        <span>{loadError}</span>
                        <button
                            type="button"
                            onClick={() => void loadRooms()}
                            className="font-semibold text-[#1a1916] hover:text-[#e04e1f]"
                        >
                            Try again
                        </button>
                    </div>
                ) : null}

                <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-display text-lg font-semibold text-[#1a1916]">
                        {rooms.length > 0
                            ? `${visibleRooms.length} Board${visibleRooms.length !== 1 ? "s" : ""}`
                            : "Your Boards"}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative w-40">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#b8b4ab]" />
                            <input
                                type="search"
                                placeholder="Filter"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="h-8 w-full rounded-lg border border-[#e8e2d4] bg-white py-0 pl-8 pr-2 text-xs text-[#1a1916] placeholder:text-[#b8b4ab]"
                            />
                        </div>
                        <div className="flex rounded-lg border border-[#e8e2d4] p-0.5">
                            {SCOPES.map(({ key, label }) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setScope(key)}
                                    className={`rounded-md px-2.5 py-1 text-xs ${
                                        scope === key
                                            ? "bg-[#1a1916] text-[#f9f6ef]"
                                            : "text-[#7a7770]"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <div className="flex rounded-lg border border-[#e8e2d4] p-0.5">
                            {SORTS.map(({ key, label }) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setSortBy(key)}
                                    className={`rounded-md px-2.5 py-1 text-xs ${
                                        sortBy === key
                                            ? "bg-[#1a1916] text-[#f9f6ef]"
                                            : "text-[#7a7770]"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => void loadRooms()}
                            className="flex items-center gap-1.5 rounded-lg border border-[#e8e2d4] px-3 py-1.5 text-xs font-medium text-[#7a7770] hover:border-[#1a1916]/20 hover:text-[#1a1916]"
                        >
                            <RotateCw size={11} className={loading ? "animate-spin" : ""} />
                            Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <div
                                key={i}
                                className="h-56 animate-pulse rounded-2xl border border-[#e8e2d4] bg-white"
                            />
                        ))}
                    </div>
                ) : rooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e8e2d4] bg-white px-6 py-14 text-center sm:px-8 sm:py-20">
                        <h3 className="font-display text-xl font-semibold text-[#1a1916]">
                            Your canvas awaits.
                        </h3>
                        <p className="mt-1.5 max-w-xs text-sm text-[#7a7770]">
                            Create your first board and invite others to sketch,
                            brainstorm, and build together.
                        </p>
                        <button
                            type="button"
                            onClick={() => setCreateOpen(true)}
                            className="mt-6 flex items-center gap-2 rounded-xl bg-[#1a1916] px-5 py-2.5 text-sm font-semibold text-[#f9f6ef] hover:bg-[#2d2c26]"
                        >
                            <Plus className="h-4 w-4" />
                            Create First Board
                        </button>
                    </div>
                ) : noMatches ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e8e2d4] bg-white px-6 py-14 text-center">
                        <h3 className="font-display text-xl font-semibold text-[#1a1916]">
                            No board matches that.
                        </h3>
                        <p className="mt-1.5 max-w-xs text-sm text-[#7a7770]">
                            Try clearing filters, or join a board by link.
                        </p>
                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setQuery("");
                                    setScope("all");
                                }}
                                className="rounded-xl border border-[#e8e2d4] px-4 py-2 text-sm text-[#7a7770]"
                            >
                                Clear filters
                            </button>
                            {normalizedQuery ? (
                                <button
                                    type="button"
                                    onClick={() => void openBoardRef(query)}
                                    className="rounded-xl bg-[#1a1916] px-4 py-2 text-sm font-semibold text-[#f9f6ef]"
                                >
                                    Open “{normalizedQuery}”
                                </button>
                            ) : null}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

            {createOpen ? (
                <CreateBoardDialog
                    onClose={() => {
                        setCreateOpen(false);
                        setCreateError("");
                    }}
                    onCreate={(slug) => void handleCreate(slug)}
                    creating={creating}
                    error={createError}
                />
            ) : null}
            {joinOpen ? (
                <JoinBoardDialog
                    onClose={() => {
                        setJoinOpen(false);
                        setOpenError("");
                    }}
                    onJoin={(raw) => void openBoardRef(raw)}
                    opening={opening}
                    error={openError}
                />
            ) : null}
            {shareRoom ? (
                <ShareModal room={shareRoom} onClose={() => setShareRoom(null)} />
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

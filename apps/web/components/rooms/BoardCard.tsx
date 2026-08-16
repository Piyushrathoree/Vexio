"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
    ArrowRight,
    Check,
    Loader2,
    LogOut,
    MoreVertical,
    Pencil,
    Share2,
    Trash2,
    Users,
    X,
} from "lucide-react";
import {
    deleteRoom,
    leaveRoom,
    renameRoom,
    type Room,
    type RoomSummary,
} from "../../lib/rooms-api";
import { paletteForSlug } from "./board-accent";
import { BoardMiniature } from "./BoardMiniature";

const SLUG_PATTERN = /^[a-z0-9-]+$/;
const isValidSlug = (slug: string) =>
    slug.length >= 3 && slug.length <= 64 && SLUG_PATTERN.test(slug);

// Explicit locale: this is a client component, so it still renders on the
// server — an implicit locale would differ between the two and trip hydration.
function sheetDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date
        .toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "2-digit",
        })
        .replace(/\./g, "")
        .toUpperCase();
}

const ROLE_LABEL: Record<string, string> = {
    ADMIN: "OWNER",
    EDITOR: "EDITOR",
    VIEWER: "VIEWER",
};

export function BoardCard({
    room,
    isAdmin,
    onShare,
    onManageMembers,
    onRenamed,
    onLeft,
    onDeleted,
}: {
    room: RoomSummary;
    isAdmin: boolean;
    onShare: (room: RoomSummary) => void;
    onManageMembers: (room: RoomSummary) => void;
    onRenamed: (previousSlug: string, room: Room) => void;
    onLeft: (slug: string) => void;
    onDeleted: (slug: string) => void;
}) {
    const menuRef = useRef<HTMLDivElement>(null);
    const renameInputRef = useRef<HTMLInputElement>(null);

    const [menuOpen, setMenuOpen] = useState(false);
    const [renaming, setRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState(room.slug);
    const [renameSaving, setRenameSaving] = useState(false);
    const [renameError, setRenameError] = useState("");
    const [leaving, setLeaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [actionError, setActionError] = useState("");

    const palette = paletteForSlug(room.slug);
    const busy = renameSaving || leaving || deleting;
    const href = `/whiteboard/${room.slug}`;

    useEffect(() => {
        if (!menuOpen) return;
        function onPointerDown(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") setMenuOpen(false);
        }
        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [menuOpen]);

    useEffect(() => {
        if (renaming) renameInputRef.current?.focus();
    }, [renaming]);

    const startRename = () => {
        setRenameValue(room.slug);
        setRenameError("");
        setRenaming(true);
        setMenuOpen(false);
    };

    const submitRename = async (e: React.FormEvent) => {
        e.preventDefault();
        const next = renameValue.trim().toLowerCase();

        if (!isValidSlug(next)) {
            setRenameError(
                "Lowercase letters, numbers and hyphens — 3 to 64 characters."
            );
            return;
        }
        if (next === room.slug) {
            setRenaming(false);
            return;
        }

        setRenameSaving(true);
        setRenameError("");

        const result = await renameRoom(room.slug, next);

        setRenameSaving(false);

        if (!result.ok) {
            setRenameError(
                result.status === 409
                    ? "That slug is already taken."
                    : result.status === 403
                      ? "Only board owners can rename this board."
                      : result.message
            );
            return;
        }

        setRenaming(false);
        onRenamed(room.slug, result.data.room);
    };

    const handleLeave = async () => {
        setMenuOpen(false);
        if (!window.confirm(`Leave "${room.slug}"? You'll lose access to it.`)) {
            return;
        }

        setLeaving(true);
        setActionError("");

        const result = await leaveRoom(room.slug);

        setLeaving(false);

        if (!result.ok) {
            setActionError(result.message);
            return;
        }

        onLeft(room.slug);
    };

    const handleDelete = async () => {
        setMenuOpen(false);
        if (
            !window.confirm(
                `Delete "${room.slug}"? This permanently removes the board and cannot be undone.`
            )
        ) {
            return;
        }

        setDeleting(true);
        setActionError("");

        const result = await deleteRoom(room.slug);

        setDeleting(false);

        if (!result.ok) {
            setActionError(
                result.status === 403
                    ? "Only board owners can delete this board."
                    : result.message
            );
            return;
        }

        onDeleted(room.slug);
    };

    const menuItem =
        "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-[#7a7770] transition-colors hover:bg-[#1a1916]/5 hover:text-[#1a1916]";

    return (
        <article className="group relative flex flex-col rounded-2xl border border-[#e8e2d4] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1a1916]/15 hover:shadow-lg hover:shadow-[#1a1916]/8">
            <div
                className="relative h-36 overflow-hidden rounded-t-2xl"
                style={{ backgroundColor: palette.bg }}
            >
                {/* Hit target stays fully opaque so browsers that skip
                    opacity:0 layers still open the board. The dimmed
                    "Open Canvas" label is paint-only. */}
                <Link
                    href={href}
                    tabIndex={-1}
                    aria-label={`Open ${room.slug}`}
                    className="absolute inset-0 z-10"
                />
                <svg
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    viewBox="0 0 280 144"
                    fill="none"
                    preserveAspectRatio="xMidYMid slice"
                    aria-hidden
                >
                    <line x1="0" y1="48" x2="280" y2="48" stroke={palette.lines} strokeWidth="1" />
                    <line x1="0" y1="96" x2="280" y2="96" stroke={palette.lines} strokeWidth="1" />
                    <line x1="70" y1="0" x2="70" y2="144" stroke={palette.lines} strokeWidth="1" />
                    <line x1="140" y1="0" x2="140" y2="144" stroke={palette.lines} strokeWidth="1" />
                    <line x1="210" y1="0" x2="210" y2="144" stroke={palette.lines} strokeWidth="1" />
                    <path
                        d="M30 90 C 50 60, 70 110, 90 80 S 120 50, 140 70 S 170 95, 200 65 S 230 40, 260 60"
                        stroke={palette.accent}
                        strokeWidth="2"
                        strokeLinecap="round"
                        fill="none"
                        opacity="0.7"
                    />
                    <circle cx="90" cy="80" r="12" stroke={palette.accent} strokeWidth="1.5" fill="none" opacity="0.4" />
                    <rect x="170" y="40" width="40" height="28" rx="4" stroke={palette.accent} strokeWidth="1.5" fill="none" opacity="0.3" />
                </svg>

                {room.preview ? (
                    <div className="pointer-events-none absolute inset-0 opacity-80">
                        <BoardMiniature preview={room.preview} />
                    </div>
                ) : null}

                <span
                    className="font-display pointer-events-none absolute inset-0 flex select-none items-center justify-center text-6xl font-semibold sm:text-7xl"
                    style={{ color: palette.accent, opacity: 0.15 }}
                    aria-hidden
                >
                    {(room.slug[0] ?? "V").toUpperCase()}
                </span>

                <span className="pointer-events-none absolute inset-0 z-[11] flex items-center justify-center bg-[#1a1916]/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <span className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#1a1916] shadow-lg">
                        <ArrowRight className="h-4 w-4" />
                        Open Canvas
                    </span>
                </span>
            </div>

            <div ref={menuRef} className="absolute right-3 top-3 z-20">
                <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    disabled={busy}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    aria-label={`Actions for ${room.slug}`}
                    className="grid h-7 w-7 cursor-pointer place-items-center rounded-lg border border-white/10 bg-[#1a1916]/50 text-white/80 backdrop-blur transition-colors hover:text-white disabled:opacity-50"
                >
                    {busy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <MoreVertical className="h-3.5 w-3.5" />
                    )}
                </button>

                {menuOpen ? (
                    <div
                        role="menu"
                        className="absolute right-0 top-[calc(100%+6px)] z-30 w-48 rounded-xl border border-[#e8e2d4] bg-[#f9f6ef] p-1.5 shadow-lg"
                    >
                        <Link href={href} role="menuitem" onClick={() => setMenuOpen(false)} className={menuItem}>
                            <ArrowRight className="h-3.5 w-3.5" />
                            Open
                        </Link>
                        <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onShare(room); }} className={menuItem}>
                            <Share2 className="h-3.5 w-3.5" />
                            Share
                        </button>
                        {isAdmin ? (
                            <>
                                <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onManageMembers(room); }} className={menuItem}>
                                    <Users className="h-3.5 w-3.5" />
                                    Manage members
                                </button>
                                <button type="button" role="menuitem" onClick={startRename} className={menuItem}>
                                    <Pencil className="h-3.5 w-3.5" />
                                    Rename
                                </button>
                            </>
                        ) : null}
                        <div className="my-1 h-px bg-[#e8e2d4]" />
                        <button type="button" role="menuitem" onClick={() => void handleLeave()} className={menuItem}>
                            <LogOut className="h-3.5 w-3.5" />
                            Leave
                        </button>
                        {isAdmin ? (
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => void handleDelete()}
                                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-[#e04e1f] hover:bg-red-50"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                            </button>
                        ) : null}
                    </div>
                ) : null}
            </div>

            <div className="flex flex-1 flex-col gap-3 px-4 py-3.5">
                {renaming ? (
                    <form onSubmit={submitRename} className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                            <input
                                ref={renameInputRef}
                                type="text"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                disabled={renameSaving}
                                aria-label="New board slug"
                                className="h-8 flex-1 rounded-lg border border-[#e8e2d4] px-2 font-mono text-sm"
                            />
                            <button type="submit" disabled={renameSaving} aria-label="Save name" className="grid h-8 w-8 place-items-center text-[#e04e1f]">
                                {renameSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            </button>
                            <button type="button" onClick={() => { setRenaming(false); setRenameError(""); }} disabled={renameSaving} aria-label="Cancel rename" className="grid h-8 w-8 place-items-center text-[#b8b4ab]">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        {renameError ? <p className="text-xs text-[#e04e1f]">{renameError}</p> : null}
                    </form>
                ) : (
                    <h3 className="truncate text-sm font-semibold text-[#1a1916]">
                        <Link href={href}>{room.slug}</Link>
                    </h3>
                )}

                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-[#f2ede2] pt-2.5 text-xs text-[#b8b4ab]">
                    <span>{sheetDate(room.createdAt)}</span>
                    <span>{room.memberCount} member{room.memberCount === 1 ? "" : "s"}</span>
                    <span>{ROLE_LABEL[room.role] ?? room.role}</span>
                </div>

                {actionError ? (
                    <p className="text-xs text-[#e04e1f]">{actionError}</p>
                ) : null}
            </div>
        </article>
    );
}

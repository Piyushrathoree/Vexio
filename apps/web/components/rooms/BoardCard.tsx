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
import { accentForSlug } from "./board-accent";
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

    const accent = accentForSlug(room.slug);
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
        "focus-ring flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-ink-dim transition-colors hover:bg-white/[0.06] hover:text-ink";

    return (
        <article
            className="board-card card group"
            style={{ ["--accent" as string]: accent }}
        >
            {/* The sheet: a genuine dot-grid drafting surface carrying the board's
                own contents. Everything else on the card stays quiet. */}
            <div className="board-sheet">
                {room.preview ? (
                    <BoardMiniature preview={room.preview} />
                ) : (
                    <p className="board-empty-note">
                        {room.elementCount > 0
                            ? "nothing to show yet"
                            : "a blank sheet"}
                    </p>
                )}

                {/* Redundant with the title-block link below, so it's kept out of
                    the tab order rather than making every card cost two stops. */}
                <Link
                    href={href}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="absolute inset-0"
                />
            </div>

            {/* Sits on the card, not inside the clipped sheet, so the dropdown
                isn't cut off by the sheet's overflow. */}
            <div ref={menuRef} className="board-menu" data-open={menuOpen}>
                <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    disabled={busy}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    aria-label={`Actions for ${room.slug}`}
                    className="focus-ring grid h-7 w-7 cursor-pointer place-items-center rounded-lg border border-hairline bg-surface/80 text-ink-faint backdrop-blur transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-50"
                >
                    {busy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
                    ) : (
                        <MoreVertical className="h-3.5 w-3.5" />
                    )}
                </button>

                {menuOpen ? (
                    <div
                        role="menu"
                        aria-label={`Actions for ${room.slug}`}
                        className="glass absolute right-0 top-[calc(100%+6px)] z-30 w-48 rounded-xl p-1.5 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.8)]"
                    >
                        <Link
                            href={href}
                            role="menuitem"
                            onClick={() => setMenuOpen(false)}
                            className={menuItem}
                        >
                            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                            Open
                        </Link>
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                setMenuOpen(false);
                                onShare(room);
                            }}
                            className={menuItem}
                        >
                            <Share2 className="h-3.5 w-3.5" aria-hidden />
                            Share
                        </button>
                        {isAdmin ? (
                            <>
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        onManageMembers(room);
                                    }}
                                    className={menuItem}
                                >
                                    <Users className="h-3.5 w-3.5" aria-hidden />
                                    Manage members
                                </button>
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={startRename}
                                    className={menuItem}
                                >
                                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                                    Rename
                                </button>
                            </>
                        ) : null}
                        <div className="my-1 h-px bg-hairline" />
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => void handleLeave()}
                            className={menuItem}
                        >
                            <LogOut className="h-3.5 w-3.5" aria-hidden />
                            Leave
                        </button>
                        {isAdmin ? (
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => void handleDelete()}
                                className="focus-ring flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-[var(--color-coral)] transition-colors hover:bg-[var(--color-coral)]/10"
                            >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                Delete
                            </button>
                        ) : null}
                    </div>
                ) : null}
            </div>

            {/* Title block — a drawing sheet carries its identity and its
                measurements in a strip along the foot. */}
            <div className="sheet-block">
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
                                className="input h-8 flex-1 py-0 font-mono text-sm"
                            />
                            <button
                                type="submit"
                                disabled={renameSaving}
                                aria-label="Save name"
                                className="focus-ring grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-indigo transition-colors hover:bg-indigo/10 disabled:pointer-events-none disabled:opacity-50"
                            >
                                {renameSaving ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
                                ) : (
                                    <Check className="h-3.5 w-3.5" />
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setRenaming(false);
                                    setRenameError("");
                                }}
                                disabled={renameSaving}
                                aria-label="Cancel rename"
                                className="focus-ring grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-ink-faint transition-colors hover:bg-white/[0.06] hover:text-ink disabled:pointer-events-none disabled:opacity-50"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        {renameError ? (
                            <p className="text-xs text-[var(--color-coral)]">
                                {renameError}
                            </p>
                        ) : null}
                    </form>
                ) : (
                    <div className="flex min-w-0 items-center gap-2">
                        <span
                            className="board-dot"
                            style={{ background: accent }}
                            aria-hidden
                        />
                        <Link href={href} className="board-name focus-ring">
                            {room.slug}
                        </Link>
                    </div>
                )}

                <dl className="sheet-meta">
                    <div>
                        <dt>ELEM</dt>
                        <dd>{room.elementCount}</dd>
                    </div>
                    <div>
                        <dt>MEMB</dt>
                        <dd>{room.memberCount}</dd>
                    </div>
                    <div>
                        {/* Rooms carry no updatedAt, so this is the sheet's
                            creation date and is labelled as such. */}
                        <dt>DATE</dt>
                        <dd>{sheetDate(room.createdAt)}</dd>
                    </div>
                    <div className="ml-auto">
                        <dt className="sr-only">Your role</dt>
                        <dd>{ROLE_LABEL[room.role] ?? room.role}</dd>
                    </div>
                </dl>

                {actionError ? (
                    <p className="mt-2 text-xs text-[var(--color-coral)]">
                        {actionError}
                    </p>
                ) : null}
            </div>
        </article>
    );
}

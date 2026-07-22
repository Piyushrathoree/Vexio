"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw, Trash2, Users, X } from "lucide-react";
import {
    fetchRoomMembers,
    removeRoomMember,
    updateMemberRole,
    type MemberRole,
    type Room,
    type RoomMember,
} from "../../lib/rooms-api";

const btnGhost =
    "btn-ghost focus-ring inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 text-sm disabled:pointer-events-none disabled:opacity-50";

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const ROLE_OPTIONS: { value: MemberRole; label: string }[] = [
    { value: "ADMIN", label: "Admin" },
    { value: "EDITOR", label: "Editor" },
    { value: "VIEWER", label: "Viewer" },
];

// Each role gets its own accent from the existing palette so a long member
// list is scannable without adding a colour to the system.
const ROLE_ACCENT: Record<MemberRole, string> = {
    ADMIN: "var(--color-violet)",
    EDITOR: "var(--color-indigo)",
    VIEWER: "var(--color-amber)",
};

function formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
    });
}

function initialsOf(userId: string) {
    return userId.replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase() || "??";
}

export function MembersModal({
    room,
    currentUserId,
    onClose,
}: {
    room: Room;
    currentUserId?: string;
    onClose: () => void;
}) {
    const dialogRef = useRef<HTMLDivElement>(null);

    const [members, setMembers] = useState<RoomMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [rowError, setRowError] = useState<{ userId: string; message: string } | null>(
        null
    );
    const [busyUserId, setBusyUserId] = useState<string | null>(null);
    const [confirmingUserId, setConfirmingUserId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError("");
        const result = await fetchRoomMembers(room.slug);
        if (!result.ok) {
            setLoadError(
                result.status === 403
                    ? "Only board admins can see the member list."
                    : result.message
            );
            setLoading(false);
            return;
        }
        setMembers(result.data.members ?? []);
        setLoading(false);
    }, [room.slug]);

    useEffect(() => {
        void load();
    }, [load]);

    // Escape to close, Tab kept inside the dialog, focus handed back to
    // whatever opened it, page behind locked from scrolling.
    useEffect(() => {
        const dialog = dialogRef.current;
        const opener = document.activeElement as HTMLElement | null;
        dialog?.focus();

        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                e.stopPropagation();
                onClose();
                return;
            }
            if (e.key !== "Tab" || !dialog) return;

            const focusable = Array.from(
                dialog.querySelectorAll<HTMLElement>(FOCUSABLE)
            );
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (!first || !last) return;

            const active = document.activeElement;
            if (e.shiftKey) {
                if (active === first || active === dialog) {
                    e.preventDefault();
                    last.focus();
                }
            } else if (active === last) {
                e.preventDefault();
                first.focus();
            }
        }

        document.addEventListener("keydown", onKeyDown, true);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", onKeyDown, true);
            document.body.style.overflow = prevOverflow;
            opener?.focus?.();
        };
    }, [onClose]);

    const handleRoleChange = async (member: RoomMember, role: MemberRole) => {
        if (role === member.role) return;
        setBusyUserId(member.userId);
        setRowError(null);

        const result = await updateMemberRole(room.slug, member.userId, role);

        setBusyUserId(null);

        if (!result.ok) {
            setRowError({ userId: member.userId, message: result.message });
            return;
        }

        setMembers((prev) =>
            prev.map((m) => (m.userId === member.userId ? result.data.member : m))
        );
    };

    const handleRemove = async (member: RoomMember) => {
        setBusyUserId(member.userId);
        setRowError(null);

        const result = await removeRoomMember(room.slug, member.userId);

        setBusyUserId(null);
        setConfirmingUserId(null);

        if (!result.ok) {
            setRowError({ userId: member.userId, message: result.message });
            return;
        }

        setMembers((prev) => prev.filter((m) => m.userId !== member.userId));
    };

    return (
        <div
            className="fixed inset-0 z-[70] grid place-items-center px-4"
            role="presentation"
        >
            <button
                type="button"
                aria-label="Close dialog"
                tabIndex={-1}
                onClick={onClose}
                className="absolute inset-0 bg-[var(--color-canvas)]/80 backdrop-blur-sm"
            />
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="members-modal-title"
                tabIndex={-1}
                className="glass relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl p-5 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.8)] focus:outline-none sm:p-6"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="coord mb-1">
                            {`// ${members.length || 0} member${
                                members.length === 1 ? "" : "s"
                            }`}
                        </p>
                        <h2
                            id="members-modal-title"
                            className="truncate font-display text-lg font-bold leading-tight text-ink"
                        >
                            Manage &ldquo;{room.slug}&rdquo;
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="focus-ring grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-ink-dim transition-colors hover:bg-white/[0.06] hover:text-ink"
                    >
                        <X className="h-4 w-4" aria-hidden />
                    </button>
                </div>

                {loadError ? (
                    <div
                        className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-coral)]/30 bg-[var(--color-coral)]/10 px-4 py-3 text-sm text-[var(--color-coral)]"
                        role="alert"
                    >
                        <span className="min-w-0">{loadError}</span>
                        <button
                            type="button"
                            onClick={() => void load()}
                            className={`${btnGhost} h-8 px-3 text-xs`}
                        >
                            <RefreshCw className="h-3 w-3" aria-hidden />
                            Try again
                        </button>
                    </div>
                ) : null}

                <div className="-mx-1 mt-4 flex-1 overflow-y-auto px-1">
                    {loading ? (
                        <div
                            className="flex items-center justify-center gap-2.5 py-10 text-ink-faint"
                            role="status"
                            aria-live="polite"
                        >
                            <Loader2
                                className="h-4 w-4 animate-spin motion-reduce:animate-none"
                                aria-hidden
                            />
                            <span className="font-mono text-xs">
                                Loading members…
                            </span>
                        </div>
                    ) : members.length === 0 ? (
                        <div className="py-10 text-center">
                            <Users
                                className="mx-auto mb-3 h-6 w-6 text-ink-faint"
                                aria-hidden
                            />
                            <p className="text-sm text-ink-dim">
                                No one has joined this board yet.
                            </p>
                            <p className="mt-1 text-xs text-ink-faint">
                                Share the link and anyone who opens it lands
                                here as an editor.
                            </p>
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {members.map((member) => {
                                const isSelf = member.userId === currentUserId;
                                const isBusy = busyUserId === member.userId;
                                const isConfirming =
                                    confirmingUserId === member.userId;
                                const accent = ROLE_ACCENT[member.role];

                                return (
                                    <li
                                        key={member.userId}
                                        className="card px-3 py-2.5"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                                            <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                                <span
                                                    className="avatar"
                                                    style={{
                                                        height: "1.75rem",
                                                        width: "1.75rem",
                                                        fontSize: "0.625rem",
                                                        background: accent,
                                                        color: "var(--color-canvas)",
                                                    }}
                                                    aria-hidden
                                                >
                                                    {initialsOf(member.userId)}
                                                </span>
                                                <div className="min-w-0">
                                                    <p
                                                        className="truncate font-mono text-xs text-ink"
                                                        title={member.userId}
                                                    >
                                                        {member.userId}
                                                        {isSelf ? (
                                                            <span className="ml-1.5 text-ink-faint">
                                                                (you)
                                                            </span>
                                                        ) : null}
                                                    </p>
                                                    <p className="coord mt-0.5">
                                                        {`// joined ${formatDate(member.createdAt)}`}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 items-center gap-2">
                                                <select
                                                    value={member.role}
                                                    disabled={isBusy}
                                                    aria-label={`Role for ${member.userId}`}
                                                    onChange={(e) =>
                                                        void handleRoleChange(
                                                            member,
                                                            e.target
                                                                .value as MemberRole
                                                        )
                                                    }
                                                    className="input h-8 w-[6.5rem] cursor-pointer py-0 font-mono text-xs disabled:opacity-50"
                                                    style={{ color: accent }}
                                                >
                                                    {ROLE_OPTIONS.map(
                                                        (option) => (
                                                            <option
                                                                key={
                                                                    option.value
                                                                }
                                                                value={
                                                                    option.value
                                                                }
                                                            >
                                                                {option.label}
                                                            </option>
                                                        )
                                                    )}
                                                </select>

                                                {isConfirming ? null : (
                                                    <button
                                                        type="button"
                                                        disabled={isBusy}
                                                        onClick={() => {
                                                            setRowError(null);
                                                            setConfirmingUserId(
                                                                member.userId
                                                            );
                                                        }}
                                                        aria-label={`Remove ${member.userId} from this board`}
                                                        title="Remove from board"
                                                        className="focus-ring grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-ink-dim transition-colors hover:bg-[var(--color-coral)]/10 hover:text-[var(--color-coral)] disabled:pointer-events-none disabled:opacity-50"
                                                    >
                                                        {isBusy ? (
                                                            <Loader2
                                                                className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none"
                                                                aria-hidden
                                                            />
                                                        ) : (
                                                            <Trash2
                                                                className="h-3.5 w-3.5"
                                                                aria-hidden
                                                            />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {isConfirming ? (
                                            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--color-coral)]/30 bg-[var(--color-coral)]/[0.07] px-2.5 py-2">
                                                <span className="text-xs text-ink-dim">
                                                    They lose access to
                                                    &ldquo;{room.slug}&rdquo;
                                                    right away.
                                                </span>
                                                <span className="flex shrink-0 items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setConfirmingUserId(
                                                                null
                                                            )
                                                        }
                                                        className={`${btnGhost} h-7 px-2.5 text-xs`}
                                                    >
                                                        Keep them
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={isBusy}
                                                        onClick={() =>
                                                            void handleRemove(
                                                                member
                                                            )
                                                        }
                                                        className="focus-ring inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--color-coral)]/45 bg-[var(--color-coral)]/15 px-2.5 text-xs font-medium text-[var(--color-coral)] transition-colors hover:bg-[var(--color-coral)]/20 disabled:pointer-events-none disabled:opacity-50"
                                                    >
                                                        {isBusy ? (
                                                            <Loader2
                                                                className="h-3 w-3 animate-spin motion-reduce:animate-none"
                                                                aria-hidden
                                                            />
                                                        ) : null}
                                                        Remove from board
                                                    </button>
                                                </span>
                                            </div>
                                        ) : null}

                                        {rowError?.userId === member.userId ? (
                                            <p
                                                className="mt-2 rounded-lg border border-[var(--color-coral)]/30 bg-[var(--color-coral)]/10 px-2.5 py-1.5 text-xs text-[var(--color-coral)]"
                                                role="alert"
                                            >
                                                {rowError.message}
                                            </p>
                                        ) : null}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <div className="mt-4 flex items-center justify-end gap-2 border-t border-hairline pt-4">
                    <button type="button" onClick={onClose} className={btnGhost}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

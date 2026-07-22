"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Link2, X } from "lucide-react";
import { createRoomInvite, type InviteRole, type Room } from "../../lib/rooms-api";

const btnPrimary =
    "btn-primary focus-ring inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:pointer-events-none disabled:opacity-50";

const btnGhost =
    "btn-ghost focus-ring inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 text-sm disabled:pointer-events-none disabled:opacity-50";

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const ROLE_OPTIONS: { value: InviteRole; label: string; hint: string }[] = [
    { value: "EDITOR", label: "Editor", hint: "Can draw and edit the board" },
    { value: "VIEWER", label: "Viewer", hint: "Can watch, but not draw" },
];

const EXPIRY_OPTIONS: { value: string; label: string }[] = [
    { value: "", label: "Never" },
    { value: "1", label: "1 hour" },
    { value: "24", label: "24 hours" },
    { value: "168", label: "7 days" },
];

export function ShareModal({
    room,
    onClose,
}: {
    room: Room;
    onClose: () => void;
}) {
    const dialogRef = useRef<HTMLDivElement>(null);

    const [role, setRole] = useState<InviteRole>("EDITOR");
    const [expiresInHours, setExpiresInHours] = useState("");
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");
    const [inviteUrl, setInviteUrl] = useState("");
    const [copied, setCopied] = useState(false);

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

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setError("");
        setCopied(false);

        const hours = expiresInHours.trim() ? Number(expiresInHours) : undefined;
        const result = await createRoomInvite(room.slug, {
            role,
            expiresInHours: hours,
        });

        setCreating(false);

        if (!result.ok) {
            setError(
                result.status === 403
                    ? "Only board admins can create invite links. Ask an admin to share this board."
                    : result.message
            );
            return;
        }

        setInviteUrl(result.data.inviteUrl);
    };

    const handleCopy = async () => {
        if (!inviteUrl) return;
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setError("Your browser blocked the clipboard. Select the link above and copy it manually.");
        }
    };

    const roleHint =
        role === "EDITOR"
            ? "// anyone with this link can draw"
            : "// anyone with this link can watch";

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
                aria-labelledby="share-modal-title"
                tabIndex={-1}
                className="glass relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl p-5 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.8)] focus:outline-none sm:p-6"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="coord mb-1">{"// invite link"}</p>
                        <h2
                            id="share-modal-title"
                            className="font-display text-lg font-bold leading-tight text-ink"
                        >
                            Share &ldquo;{room.slug}&rdquo;
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

                <form onSubmit={handleGenerate} className="mt-5 space-y-5">
                    <fieldset className="min-w-0">
                        <legend className="mb-2 block text-sm font-medium text-ink">
                            What invitees get
                        </legend>
                        <div
                            className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                            role="radiogroup"
                            aria-label="What invitees get"
                        >
                            {ROLE_OPTIONS.map((opt) => {
                                const active = role === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={active}
                                        onClick={() => setRole(opt.value)}
                                        className={`focus-ring relative cursor-pointer rounded-xl border px-3 py-2.5 text-left transition-colors ${
                                            active
                                                ? "border-[var(--color-indigo)]/55 bg-[var(--color-indigo)]/10"
                                                : "border-hairline hover:bg-white/[0.04]"
                                        }`}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${
                                                    active
                                                        ? "bg-[var(--color-indigo)]"
                                                        : "bg-ink-faint"
                                                }`}
                                                aria-hidden
                                            />
                                            <span
                                                className={`text-sm font-medium ${
                                                    active
                                                        ? "text-ink"
                                                        : "text-ink-dim"
                                                }`}
                                            >
                                                {opt.label}
                                            </span>
                                        </span>
                                        <span className="mt-0.5 block text-xs text-ink-faint">
                                            {opt.hint}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="coord mt-2">{roleHint}</p>
                    </fieldset>

                    <fieldset className="min-w-0">
                        <legend className="mb-2 block text-sm font-medium text-ink">
                            Link expires
                        </legend>
                        <div
                            className="segmented flex-wrap"
                            role="radiogroup"
                            aria-label="Link expires"
                        >
                            {EXPIRY_OPTIONS.map((opt) => {
                                const active = expiresInHours === opt.value;
                                return (
                                    <button
                                        key={opt.value || "never"}
                                        type="button"
                                        role="radio"
                                        aria-checked={active}
                                        onClick={() =>
                                            setExpiresInHours(opt.value)
                                        }
                                        className={`focus-ring cursor-pointer ${
                                            active ? "is-active" : ""
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>

                    {error ? (
                        <p
                            className="rounded-xl border border-[var(--color-coral)]/30 bg-[var(--color-coral)]/10 px-3 py-2 text-xs leading-relaxed text-[var(--color-coral)]"
                            role="alert"
                        >
                            {error}
                        </p>
                    ) : null}

                    {inviteUrl ? (
                        <div className="min-w-0">
                            <span className="mb-2 block text-sm font-medium text-ink">
                                Shareable link
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="input flex min-w-0 flex-1 items-center gap-2 overflow-hidden font-mono text-xs">
                                    <Link2
                                        className="h-3.5 w-3.5 shrink-0 text-ink-faint"
                                        aria-hidden
                                    />
                                    <span className="truncate">
                                        {inviteUrl}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => void handleCopy()}
                                    className={`${btnGhost} shrink-0`}
                                >
                                    {copied ? (
                                        <>
                                            <Check
                                                className="h-3.5 w-3.5 text-[var(--color-mint)]"
                                                aria-hidden
                                            />
                                            Link copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy
                                                className="h-3.5 w-3.5"
                                                aria-hidden
                                            />
                                            Copy link
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : null}

                    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-hairline pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className={btnGhost}
                        >
                            Close
                        </button>
                        <button
                            type="submit"
                            disabled={creating}
                            className={btnPrimary}
                        >
                            {creating ? (
                                <>
                                    <span
                                        className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/25 border-t-black/70 motion-reduce:animate-none"
                                        aria-hidden
                                    />
                                    Generating link…
                                </>
                            ) : inviteUrl ? (
                                "Generate a new link"
                            ) : (
                                "Generate link"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
    ArrowRight,
    Check,
    Copy,
    DoorOpen,
    LogOut,
    Plus,
    ShieldAlert,
    ShieldCheck,
} from "lucide-react";

import { AuthGuard } from "../../components/AuthGuard";
import Navbar from "../../components/Navbar";
import { ProfileAvatar } from "../../components/profile/ProfileAvatar";
import { signOut, useSession } from "../../lib/auth-client";

const btnDestructive =
    "focus-ring inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--color-coral)]/30 bg-[var(--color-coral)]/10 px-4 text-sm text-[var(--color-coral)] transition-colors hover:bg-[var(--color-coral)]/15 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none";

const iconBtn = "icon-btn focus-ring";

// Label styling is written out rather than reusing `.coord` on purpose:
// `.coord` is unlayered CSS, so it would win over any Tailwind utility that
// tries to adjust its size, tracking or colour. `.coord` stays reserved for
// the `// ...` eyebrows.
const fieldLabel =
    "text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-ink-faint";

const fieldCell = "bg-[var(--color-canvas)] px-4 py-3.5 sm:px-5";

const linkTile =
    "focus-ring group flex items-center justify-between gap-3 rounded-xl border border-hairline bg-white/[0.02] px-4 py-3.5 transition-colors hover:border-white/20 hover:bg-white/[0.05] motion-reduce:transition-none";

function toDate(value: Date | string | null | undefined): Date | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatJoinDate(value: Date | string | null | undefined): string {
    const date = toDate(value);
    if (!date) return "Unknown";
    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
    });
}

function formatJoinYear(value: Date | string | null | undefined): string | null {
    const date = toDate(value);
    return date ? String(date.getFullYear()) : null;
}

function ProfileContent() {
    const { data, isPending } = useSession();
    const router = useRouter();
    const [signingOut, setSigningOut] = useState(false);
    const [signOutError, setSignOutError] = useState("");
    const [copied, setCopied] = useState(false);
    const [copyError, setCopyError] = useState("");

    const user = data?.user;

    const handleSignOut = async () => {
        setSigningOut(true);
        setSignOutError("");
        try {
            await signOut();
            router.replace("/login");
        } catch {
            setSigningOut(false);
            setSignOutError(
                "Couldn't sign out — check your connection and try again.",
            );
        }
    };

    const handleCopyId = async () => {
        if (!user?.id) return;
        try {
            await navigator.clipboard.writeText(user.id);
            setCopyError("");
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        } catch {
            setCopied(false);
            setCopyError(
                "Couldn't copy — your browser blocked clipboard access. Select the ID and copy it by hand.",
            );
        }
    };

    if (isPending || !user) {
        return (
            <div className="min-h-screen bg-[#f9f6ef] pt-14">
                <main className="relative z-10 flex min-h-screen items-center justify-center px-4">
                    <div className="flex flex-col items-center gap-3">
                        <span
                            className="h-8 w-8 animate-spin rounded-full border-2 border-hairline border-t-indigo motion-reduce:animate-none"
                            aria-hidden
                        />
                        <p className="coord">{"// loading your profile"}</p>
                    </div>
                </main>
            </div>
        );
    }

    const hasName = Boolean(user.name?.trim());
    const displayName =
        user.name?.trim() || user.email.split("@")[0] || "Vexio user";
    const joinYear = formatJoinYear(user.createdAt);

    return (
        <div className="min-h-screen bg-[#f9f6ef] pt-14">
            <Navbar />
            <div className="relative z-10 mx-auto max-w-6xl">
                <main className="px-4 pb-24 pt-8 sm:px-6">
                    <header className="mt-8">
                        <p className="coord mb-2">{"// account"}</p>
                        <div className="flex items-center gap-4 sm:gap-5">
                            <ProfileAvatar
                                name={displayName}
                                image={user.image}
                                size={72}
                                className="ring-2 ring-hairline"
                            />
                            <div className="min-w-0">
                                <h1 className="truncate font-display text-3xl font-bold tracking-tight text-ink">
                                    {displayName}
                                </h1>
                                <p className="mt-1 truncate text-sm text-ink-dim">
                                    {user.email}
                                </p>
                            </div>
                        </div>
                        <p className="mt-3 max-w-xl text-sm text-ink-dim">
                            Everything Vexio knows about you, and where your
                            session stands right now.
                        </p>
                    </header>

                    <div className="mt-8 grid gap-4 lg:grid-cols-3 lg:items-start">
                        {/* Title block — the drawing sheet's metadata panel. */}
                        <section className="artboard p-4 sm:p-5 lg:col-span-2">
                            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 px-1">
                                <h2 className="font-display text-lg font-semibold text-ink">
                                    Account details
                                </h2>
                                <p className="coord">
                                    {joinYear
                                        ? `// on file since ${joinYear}`
                                        : "// on file"}
                                </p>
                            </div>

                            <dl className="grid gap-px overflow-hidden rounded-xl border border-hairline bg-[var(--color-hairline)] sm:grid-cols-2">
                                <div className={fieldCell}>
                                    <dt className={fieldLabel}>Display name</dt>
                                    <dd className="mt-1.5">
                                        {hasName ? (
                                            <span className="block truncate text-sm text-ink">
                                                {displayName}
                                            </span>
                                        ) : (
                                            <span className="block text-base text-ink-dim">
                                                not set yet — we&apos;re using
                                                your email handle
                                            </span>
                                        )}
                                    </dd>
                                </div>

                                <div className={fieldCell}>
                                    <dt className={fieldLabel}>Email</dt>
                                    <dd
                                        className="mt-1.5 truncate text-sm text-ink"
                                        title={user.email}
                                    >
                                        {user.email}
                                    </dd>
                                </div>

                                <div className={fieldCell}>
                                    <dt className={fieldLabel}>Email status</dt>
                                    <dd className="mt-1.5">
                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                                                user.emailVerified
                                                    ? "border-[var(--color-mint)]/30 bg-[var(--color-mint)]/10 text-[var(--color-mint)]"
                                                    : "border-[var(--color-amber)]/30 bg-[var(--color-amber)]/10 text-[var(--color-amber)]"
                                            }`}
                                        >
                                            {user.emailVerified ? (
                                                <ShieldCheck
                                                    className="h-3.5 w-3.5"
                                                    aria-hidden
                                                />
                                            ) : (
                                                <ShieldAlert
                                                    className="h-3.5 w-3.5"
                                                    aria-hidden
                                                />
                                            )}
                                            {user.emailVerified
                                                ? "Verified"
                                                : "Not verified"}
                                        </span>
                                        {user.emailVerified ? null : (
                                            <span className="mt-1.5 block text-xs text-ink-faint">
                                                Open the verification link we
                                                emailed you to confirm this
                                                address.
                                            </span>
                                        )}
                                    </dd>
                                </div>

                                <div className={fieldCell}>
                                    <dt className={fieldLabel}>Member since</dt>
                                    <dd className="mt-1.5 text-sm text-ink">
                                        {formatJoinDate(user.createdAt)}
                                    </dd>
                                </div>

                                <div className={`${fieldCell} sm:col-span-2`}>
                                    <dt className={fieldLabel}>Account ID</dt>
                                    <dd className="mt-1.5 flex items-center gap-2">
                                        <span
                                            className="min-w-0 flex-1 truncate font-mono text-sm text-ink"
                                            title={user.id}
                                        >
                                            {user.id}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => void handleCopyId()}
                                            aria-label="Copy account ID"
                                            className={iconBtn}
                                        >
                                            {copied ? (
                                                <Check className="h-3.5 w-3.5 text-[var(--color-mint)]" />
                                            ) : (
                                                <Copy className="h-3.5 w-3.5" />
                                            )}
                                        </button>
                                    </dd>
                                    <p
                                        className="sr-only"
                                        role="status"
                                        aria-live="polite"
                                    >
                                        {copied ? "Account ID copied" : ""}
                                    </p>
                                    {copyError ? (
                                        <p className="mt-2 text-xs text-[var(--color-coral)]">
                                            {copyError}
                                        </p>
                                    ) : null}
                                </div>
                            </dl>
                        </section>

                        <aside className="grid gap-4">
                            <section className="card p-5 sm:p-6">
                                <p className="coord mb-2">{"// shortcuts"}</p>
                                <h2 className="font-display text-lg font-semibold text-ink">
                                    Boards
                                </h2>
                                <div className="mt-4 grid gap-3">
                                    <Link href="/rooms" className={linkTile}>
                                        <span className="flex min-w-0 items-center gap-3">
                                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-hairline bg-white/[0.03] text-indigo">
                                                <DoorOpen
                                                    className="h-4 w-4"
                                                    aria-hidden
                                                />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block text-sm font-semibold text-ink">
                                                    Open your boards
                                                </span>
                                                <span className="block truncate text-xs text-ink-dim">
                                                    Everything you started or
                                                    joined
                                                </span>
                                            </span>
                                        </span>
                                        <ArrowRight
                                            className="h-4 w-4 shrink-0 text-ink-dim transition-transform group-hover:translate-x-0.5 group-hover:text-ink motion-reduce:transition-none"
                                            aria-hidden
                                        />
                                    </Link>

                                    <Link
                                        href="/whiteboard"
                                        className={linkTile}
                                    >
                                        <span className="flex min-w-0 items-center gap-3">
                                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-hairline bg-white/[0.03] text-violet">
                                                <Plus
                                                    className="h-4 w-4"
                                                    aria-hidden
                                                />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block text-sm font-semibold text-ink">
                                                    Start a board
                                                </span>
                                                <span className="block truncate text-xs text-ink-dim">
                                                    Name it and open a blank
                                                    canvas
                                                </span>
                                            </span>
                                        </span>
                                        <ArrowRight
                                            className="h-4 w-4 shrink-0 text-ink-dim transition-transform group-hover:translate-x-0.5 group-hover:text-ink motion-reduce:transition-none"
                                            aria-hidden
                                        />
                                    </Link>
                                </div>
                            </section>

                            <section className="card p-5 sm:p-6">
                                <p className="coord mb-2">{"// this device"}</p>
                                <h2 className="font-display text-lg font-semibold text-ink">
                                    Sign out
                                </h2>
                                <p className="mt-1.5 text-sm text-ink-dim">
                                    Ends your session on this device. Your
                                    boards stay exactly as you left them.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => void handleSignOut()}
                                    disabled={signingOut}
                                    className={`${btnDestructive} mt-4 w-full sm:w-auto`}
                                >
                                    <LogOut className="h-4 w-4" aria-hidden />
                                    {signingOut ? "Signing out…" : "Sign out"}
                                </button>
                                {signOutError ? (
                                    <p className="mt-3 text-xs text-[var(--color-coral)]">
                                        {signOutError}
                                    </p>
                                ) : null}
                            </section>
                        </aside>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    return (
        <AuthGuard>
            <ProfileContent />
        </AuthGuard>
    );
}

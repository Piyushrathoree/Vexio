"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    Check,
    Compass,
    Copy,
    DoorOpen,
    KeyRound,
    LogOut,
    Mail,
    Plus,
    ShieldAlert,
    ShieldCheck,
    UserRound,
} from "lucide-react";

import { AuthGuard } from "../../components/AuthGuard";
import Navbar from "../../components/Navbar";
import { ProfileAvatar } from "../../components/profile/ProfileAvatar";
import { signOut, useSession } from "../../lib/auth-client";

const btnGhost =
    "btn-ghost focus-ring inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 text-sm";

const btnDestructive =
    "focus-ring inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--color-coral)]/30 bg-[var(--color-coral)]/10 px-4 text-sm text-[var(--color-coral)] transition-colors hover:bg-[var(--color-coral)]/15 disabled:pointer-events-none disabled:opacity-50";

const iconBtn = "icon-btn focus-ring";

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
    const [copied, setCopied] = useState(false);

    const user = data?.user;

    const handleSignOut = async () => {
        setSigningOut(true);
        await signOut();
        router.replace("/login");
    };

    const handleCopyId = async () => {
        if (!user?.id) return;
        try {
            await navigator.clipboard.writeText(user.id);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        } catch {
            // Clipboard access can be blocked — silent no-op.
        }
    };

    if (isPending || !user) {
        return (
            <div className="app">
                <div className="app-bg" aria-hidden />
                <main className="relative z-10 flex min-h-screen items-center justify-center px-4">
                    <div className="flex flex-col items-center gap-3">
                        <span
                            className="h-8 w-8 animate-spin rounded-full border-2 border-hairline border-t-indigo motion-reduce:animate-none"
                            aria-hidden
                        />
                        <p className="text-xs text-ink-dim">
                            Loading your profile…
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    const displayName =
        user.name?.trim() || user.email.split("@")[0] || "Vexio user";
    const joinYear = formatJoinYear(user.createdAt);
    const memberLabel = joinYear ? `Member since ${joinYear}` : "Member";

    return (
        <div className="app">
            <div className="app-bg" aria-hidden />
            <div className="relative z-10 mx-auto max-w-5xl">
                <Navbar />
                <main className="px-4 pb-24 pt-2 sm:px-6">
                    <section className="card mt-8 p-6 sm:p-8">
                        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
                            <ProfileAvatar
                                name={displayName}
                                image={user.image}
                                size={96}
                                className="ring-2 ring-hairline"
                            />
                            <div className="min-w-0 flex-1">
                                <p className="coord mb-2">{"// profile"}</p>
                                <h1 className="truncate font-display text-3xl font-bold tracking-tight text-ink">
                                    {displayName}
                                </h1>
                                <p className="mt-1.5 truncate text-sm text-ink-dim">
                                    {user.email}
                                </p>
                                <div className="chip mt-4">
                                    <span
                                        className="h-1.5 w-1.5 rounded-full bg-indigo"
                                        aria-hidden
                                    />
                                    <span>{memberLabel}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="mt-6 grid gap-4 lg:grid-cols-5">
                        <div className="card p-5 sm:p-6 lg:col-span-3">
                            <div className="mb-4 flex items-center gap-2">
                                <span className="grid h-7 w-7 place-items-center rounded-lg border border-hairline bg-white/[0.03] text-indigo">
                                    <UserRound className="h-4 w-4" />
                                </span>
                                <h2 className="text-base font-semibold text-ink">
                                    Account
                                </h2>
                            </div>

                            <dl className="divide-y divide-hairline">
                                <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                                    <dt className="flex items-center gap-2 text-sm text-ink-dim">
                                        <Mail className="h-4 w-4" />
                                        Email
                                    </dt>
                                    <dd className="truncate text-sm text-ink">
                                        {user.email}
                                    </dd>
                                </div>

                                <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                                    <dt className="flex items-center gap-2 text-sm text-ink-dim">
                                        {user.emailVerified ? (
                                            <ShieldCheck className="h-4 w-4" />
                                        ) : (
                                            <ShieldAlert className="h-4 w-4" />
                                        )}
                                        Verification
                                    </dt>
                                    <dd
                                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                                            user.emailVerified
                                                ? "border-[var(--color-mint)]/30 bg-[var(--color-mint)]/10 text-[var(--color-mint)]"
                                                : "border-[var(--color-coral)]/30 bg-[var(--color-coral)]/10 text-[var(--color-coral)]"
                                        }`}
                                    >
                                        {user.emailVerified
                                            ? "Verified"
                                            : "Pending"}
                                    </dd>
                                </div>

                                <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                                    <dt className="flex items-center gap-2 text-sm text-ink-dim">
                                        <CalendarDays className="h-4 w-4" />
                                        Member since
                                    </dt>
                                    <dd className="text-sm text-ink">
                                        {formatJoinDate(user.createdAt)}
                                    </dd>
                                </div>

                                <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                                    <dt className="flex items-center gap-2 text-sm text-ink-dim">
                                        <KeyRound className="h-4 w-4" />
                                        Account ID
                                    </dt>
                                    <dd className="flex items-center gap-2">
                                        <span
                                            className="max-w-[8.5rem] truncate font-mono text-sm text-ink sm:max-w-[12rem]"
                                            title={user.id}
                                        >
                                            {user.id}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                void handleCopyId()
                                            }
                                            aria-label="Copy account ID"
                                            className={iconBtn}
                                        >
                                            {copied ? (
                                                <Check className="h-3.5 w-3.5 text-indigo" />
                                            ) : (
                                                <Copy className="h-3.5 w-3.5" />
                                            )}
                                        </button>
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div className="card p-5 sm:p-6 lg:col-span-2">
                            <div className="mb-4 flex items-center gap-2">
                                <span className="grid h-7 w-7 place-items-center rounded-lg border border-hairline bg-white/[0.03] text-ink-dim">
                                    <Compass className="h-4 w-4" />
                                </span>
                                <h2 className="text-base font-semibold text-ink">
                                    Jump back in
                                </h2>
                            </div>

                            <div className="space-y-3">
                                <Link
                                    href="/rooms"
                                    className="card group flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:border-white/20 hover:bg-white/[0.04] focus-ring"
                                >
                                    <span className="flex min-w-0 items-center gap-3">
                                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-hairline bg-white/[0.03] text-indigo">
                                            <DoorOpen className="h-4 w-4" />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block text-sm font-semibold text-ink">
                                                Your rooms
                                            </span>
                                            <span className="block truncate text-xs text-ink-dim">
                                                Everything you&apos;ve
                                                started or joined
                                            </span>
                                        </span>
                                    </span>
                                    <ArrowRight className="h-4 w-4 shrink-0 text-ink-dim transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
                                </Link>

                                <Link
                                    href="/whiteboard"
                                    className="card group flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:border-white/20 hover:bg-white/[0.04] focus-ring"
                                >
                                    <span className="flex min-w-0 items-center gap-3">
                                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-hairline bg-white/[0.03] text-indigo">
                                            <Plus className="h-4 w-4" />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block text-sm font-semibold text-ink">
                                                New whiteboard
                                            </span>
                                            <span className="block truncate text-xs text-ink-dim">
                                                Open a blank canvas
                                            </span>
                                        </span>
                                    </span>
                                    <ArrowRight className="h-4 w-4 shrink-0 text-ink-dim transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="card mt-6 flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
                        <div>
                            <h2 className="text-base font-semibold text-ink">
                                Sign out
                            </h2>
                            <p className="mt-1 max-w-sm text-sm text-ink-dim">
                                Ends your session on this device. Your boards
                                stay exactly as you left them.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => void handleSignOut()}
                            disabled={signingOut}
                            className={btnDestructive}
                        >
                            <LogOut className="h-4 w-4" />
                            {signingOut ? "Signing out…" : "Sign out"}
                        </button>
                    </div>

                    <p className="mt-6 text-center sm:text-left">
                        <Link
                            href="/rooms"
                            className={`${btnGhost} inline-flex`}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to boards
                        </Link>
                    </p>
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

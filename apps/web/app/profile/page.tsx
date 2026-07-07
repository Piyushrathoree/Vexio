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
import { Reveal } from "../../components/Reveal";
import { ProfileAvatar } from "../../components/profile/ProfileAvatar";
import { signOut, useSession } from "../../lib/auth-client";

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
            // Clipboard access can be blocked or unavailable — the ID
            // stays fully visible either way, so this is a silent no-op.
        }
    };

    // AuthGuard already redirects unauthenticated visitors to /login and
    // holds its children back until the session resolves — this covers the
    // brief moment right after mount where the session hasn't hydrated yet.
    if (isPending || !user) {
        return (
            <div className="lp">
                <div className="lp-bg" aria-hidden />
                <main className="relative z-10 flex min-h-screen items-center justify-center px-4">
                    <div className="flex flex-col items-center gap-3">
                        <span
                            className="h-8 w-8 animate-spin rounded-full border-2 border-hairline border-t-[var(--color-indigo)]"
                            aria-hidden
                        />
                        <p className="font-mono text-xs text-ink-faint">
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
        <div className="lp">
            <div className="lp-bg" aria-hidden />

            <main className="relative z-10 min-h-screen px-4 pb-24 pt-6 sm:px-6">
                <div className="mx-auto max-w-5xl">
                    {/* Top bar */}
                    <header className="glass flex h-16 items-center justify-between rounded-2xl pl-5 pr-3">
                        <Link
                            href="/"
                            className="flex items-center gap-2.5"
                            aria-label="Vexio home"
                        >
                            <span className="grid h-6 w-6 place-items-center rounded-md bg-[var(--color-indigo)] text-[13px] font-bold text-[#0a0c12]">
                                V
                            </span>
                            <span className="font-display text-lg font-extrabold tracking-tight text-ink">
                                Vexio
                            </span>
                        </Link>

                        <Link
                            href="/rooms"
                            className="btn-ghost inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm"
                        >
                            <ArrowLeft className="h-[15px] w-[15px]" />
                            <span className="hidden sm:inline">Your rooms</span>
                        </Link>
                    </header>

                    <p className="coord mb-3 mt-10">// you</p>

                    {/* Hero identity block */}
                    <Reveal>
                        <section className="artboard relative overflow-hidden p-6 sm:p-8">
                            <div
                                className="aurora -left-16 -top-24 h-64 w-64 bg-[radial-gradient(circle,var(--color-indigo),transparent_60%)]"
                                aria-hidden
                            />
                            <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
                                <ProfileAvatar
                                    name={displayName}
                                    image={user.image}
                                    size={96}
                                    className="shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)] ring-4 ring-white/5"
                                />
                                <div className="min-w-0 flex-1">
                                    <h1 className="truncate font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                                        {displayName}
                                    </h1>
                                    <p className="mt-1.5 truncate font-mono text-sm text-ink-dim">
                                        {user.email}
                                    </p>
                                    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-hairline bg-white/[0.03] px-3 py-1.5">
                                        <span
                                            className="h-1.5 w-1.5 rounded-full bg-[var(--color-mint)]"
                                            aria-hidden
                                        />
                                        <span className="font-mono text-xs text-ink-dim">
                                            {memberLabel}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </Reveal>

                    {/* Details */}
                    <Reveal delay={80}>
                        <div className="mt-6 grid gap-4 lg:grid-cols-5">
                            {/* Account info */}
                            <div className="artboard p-5 sm:p-6 lg:col-span-3">
                                <div className="mb-4 flex items-center gap-2">
                                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--color-indigo)]/15 text-[var(--color-indigo)]">
                                        <UserRound className="h-4 w-4" />
                                    </span>
                                    <h2 className="font-display text-base font-bold text-ink">
                                        Account
                                    </h2>
                                </div>

                                <dl className="divide-y divide-hairline">
                                    <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                                        <dt className="flex items-center gap-2 text-sm text-ink-dim">
                                            <Mail className="h-4 w-4 text-ink-faint" />
                                            Email
                                        </dt>
                                        <dd className="truncate font-mono text-sm text-ink">
                                            {user.email}
                                        </dd>
                                    </div>

                                    <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                                        <dt className="flex items-center gap-2 text-sm text-ink-dim">
                                            {user.emailVerified ? (
                                                <ShieldCheck className="h-4 w-4 text-ink-faint" />
                                            ) : (
                                                <ShieldAlert className="h-4 w-4 text-ink-faint" />
                                            )}
                                            Verification
                                        </dt>
                                        <dd
                                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs ${
                                                user.emailVerified
                                                    ? "border-[var(--color-mint)]/30 bg-[var(--color-mint)]/10 text-[var(--color-mint)]"
                                                    : "border-[var(--color-amber)]/30 bg-[var(--color-amber)]/10 text-[var(--color-amber)]"
                                            }`}
                                        >
                                            {user.emailVerified
                                                ? "Verified"
                                                : "Pending"}
                                        </dd>
                                    </div>

                                    <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                                        <dt className="flex items-center gap-2 text-sm text-ink-dim">
                                            <CalendarDays className="h-4 w-4 text-ink-faint" />
                                            Member since
                                        </dt>
                                        <dd className="font-mono text-sm text-ink">
                                            {formatJoinDate(user.createdAt)}
                                        </dd>
                                    </div>

                                    <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                                        <dt className="flex items-center gap-2 text-sm text-ink-dim">
                                            <KeyRound className="h-4 w-4 text-ink-faint" />
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
                                                onClick={() => void handleCopyId()}
                                                aria-label="Copy account ID"
                                                className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-hairline text-ink-faint transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-indigo)]"
                                            >
                                                {copied ? (
                                                    <Check className="h-3.5 w-3.5 text-[var(--color-mint)]" />
                                                ) : (
                                                    <Copy className="h-3.5 w-3.5" />
                                                )}
                                            </button>
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            {/* Quick links */}
                            <div className="artboard p-5 sm:p-6 lg:col-span-2">
                                <div className="mb-4 flex items-center gap-2">
                                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/[0.05] text-ink-dim">
                                        <Compass className="h-4 w-4" />
                                    </span>
                                    <h2 className="font-display text-base font-bold text-ink">
                                        Jump back in
                                    </h2>
                                </div>

                                <div className="space-y-3">
                                    <Link
                                        href="/rooms"
                                        className="group flex items-center justify-between gap-3 rounded-xl border border-hairline bg-white/[0.02] px-4 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.04] focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-indigo)]"
                                    >
                                        <span className="flex min-w-0 items-center gap-3">
                                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--color-indigo)]/15 text-[var(--color-indigo)]">
                                                <DoorOpen className="h-4 w-4" />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block font-display text-sm font-bold text-ink">
                                                    Your rooms
                                                </span>
                                                <span className="block truncate text-xs text-ink-faint">
                                                    Everything you&apos;ve
                                                    started or joined
                                                </span>
                                            </span>
                                        </span>
                                        <ArrowRight className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
                                    </Link>

                                    <Link
                                        href="/whiteboard"
                                        className="group flex items-center justify-between gap-3 rounded-xl border border-hairline bg-white/[0.02] px-4 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.04] focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-indigo)]"
                                    >
                                        <span className="flex min-w-0 items-center gap-3">
                                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--color-violet)]/15 text-[var(--color-violet)]">
                                                <Plus className="h-4 w-4" />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block font-display text-sm font-bold text-ink">
                                                    New whiteboard
                                                </span>
                                                <span className="block truncate text-xs text-ink-faint">
                                                    Open a blank canvas
                                                </span>
                                            </span>
                                        </span>
                                        <ArrowRight className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </Reveal>

                    {/* Sign out */}
                    <Reveal delay={160}>
                        <div className="artboard mt-6 flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
                            <div>
                                <h2 className="font-display text-base font-bold text-ink">
                                    Sign out
                                </h2>
                                <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-dim">
                                    Ends your session on this device. Your
                                    boards stay exactly as you left them.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => void handleSignOut()}
                                disabled={signingOut}
                                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[var(--color-coral)]/30 bg-[var(--color-coral)]/10 px-4 py-2.5 text-sm font-medium text-[var(--color-coral)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-coral)]/50 hover:bg-[var(--color-coral)]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-coral)]/50 disabled:opacity-60 disabled:hover:translate-y-0"
                            >
                                <LogOut className="h-4 w-4" />
                                {signingOut ? "Signing out…" : "Sign out"}
                            </button>
                        </div>
                    </Reveal>
                </div>
            </main>
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

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "../../lib/auth-client";
import { AlertCircle, ArrowRight } from "lucide-react";

function GoogleIcon() {
    return (
        <svg viewBox="0 0 18 18" className="h-4 w-4 shrink-0" aria-hidden>
            <path
                fill="#4285F4"
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615Z"
            />
            <path
                fill="#34A853"
                d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
            />
            <path
                fill="#FBBC05"
                d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"
            />
            <path
                fill="#EA4335"
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58Z"
            />
        </svg>
    );
}

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const { error: signInError } = await signIn.email({
            email,
            password,
        });

        setLoading(false);

        if (signInError) {
            const msg = signInError.message ?? "Sign in failed";
            setError(
                msg.toLowerCase().includes("verify")
                    ? "Verify your email first — check your inbox for the link."
                    : msg
            );
            return;
        }

        router.push("/rooms");
    };

    const handleSocial = async (provider: "google" | "github") => {
        await signIn.social({
            provider,
            callbackURL: `${window.location.origin}/rooms`,
        });
    };

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 py-16 text-ink">
            <div className="lp-bg" aria-hidden />
            <div
                className="aurora inset-x-1/4 top-1/4 h-72 bg-[radial-gradient(circle,var(--color-indigo),transparent_60%)]"
                aria-hidden
            />

            <div className="artboard relative z-10 w-full max-w-md p-8 sm:p-10">
                <Link
                    href="/"
                    className="mb-8 flex items-center justify-center gap-2.5 rounded-lg transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-indigo)]/40"
                    aria-label="Vexio home"
                >
                    <span className="grid h-7 w-7 place-items-center rounded-md bg-[var(--color-indigo)] text-sm font-bold text-[#0a0c12]">
                        V
                    </span>
                    <span className="font-display text-xl font-extrabold tracking-tight text-ink">
                        Vexio
                    </span>
                </Link>

                <div className="mb-8 text-center">
                    <p className="coord mb-2">// log in</p>
                    <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
                        Welcome back
                    </h1>
                    <p className="mt-2 text-sm leading-relaxed text-ink-dim">
                        Pick up where you left off — log in to reopen your boards.
                    </p>
                </div>

                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div>
                        <label
                            htmlFor="email"
                            className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-ink-faint"
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-xl border border-hairline bg-white/[0.03] px-4 py-2.5 text-ink outline-none transition-colors placeholder:text-ink-faint focus-visible:border-[var(--color-indigo)] focus-visible:ring-2 focus-visible:ring-[var(--color-indigo)]/40"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="password"
                            className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-ink-faint"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-xl border border-hairline bg-white/[0.03] px-4 py-2.5 text-ink outline-none transition-colors placeholder:text-ink-faint focus-visible:border-[var(--color-indigo)] focus-visible:ring-2 focus-visible:ring-[var(--color-indigo)]/40"
                        />
                    </div>
                    <p className="text-right text-sm">
                        <Link
                            href="/forgot-password"
                            className="rounded text-ink-dim transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-indigo)]/40"
                        >
                            Forgot password?
                        </Link>
                    </p>
                    {error ? (
                        <div
                            role="alert"
                            className="flex items-start gap-2 rounded-lg border border-[var(--color-coral)]/30 bg-[var(--color-coral)]/10 px-3.5 py-2.5 text-sm text-[var(--color-coral)]"
                        >
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                            <span>{error}</span>
                        </div>
                    ) : null}
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary group inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? (
                            <>
                                <span
                                    className="h-4 w-4 rounded-full border-2 border-[#0a0c12]/30 border-t-[#0a0c12] motion-safe:animate-spin"
                                    aria-hidden
                                />
                                Logging in…
                            </>
                        ) : (
                            <>
                                Log in
                                <ArrowRight className="h-[15px] w-[15px] transition-transform group-hover:translate-x-1" />
                            </>
                        )}
                    </button>
                </form>

                <div className="my-6 flex items-center gap-3" aria-hidden>
                    <span className="h-px flex-1 bg-[rgba(255,255,255,0.09)]" />
                    <span className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
                        or
                    </span>
                    <span className="h-px flex-1 bg-[rgba(255,255,255,0.09)]" />
                </div>

                <button
                    type="button"
                    onClick={() => handleSocial("google")}
                    className="btn-ghost inline-flex w-full items-center justify-center gap-2.5 rounded-xl py-2.5 text-sm font-medium"
                >
                    <GoogleIcon />
                    Continue with Google
                </button>

                <p className="mt-6 text-center text-sm text-ink-dim">
                    New to Vexio?{" "}
                    <Link
                        href="/signup"
                        className="rounded text-[var(--color-indigo)] transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-indigo)]/40"
                    >
                        Create an account
                    </Link>
                </p>
            </div>
        </main>
    );
}

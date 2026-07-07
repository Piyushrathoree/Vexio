"use client";

import Link from "next/link";
import { useState } from "react";
import { requestPasswordReset } from "../../lib/auth-client";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        const { error: resetError } = await requestPasswordReset({
            email,
            redirectTo: `${window.location.origin}/reset-password`,
        });

        setLoading(false);

        if (resetError) {
            setError(resetError.message ?? "Something went wrong");
            return;
        }

        setMessage("Check your email for a reset link.");
    };

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 py-16 text-ink">
            <div className="lp-bg" aria-hidden />
            <div
                className="aurora inset-x-1/4 top-1/4 h-72 bg-[radial-gradient(circle,var(--color-amber),transparent_60%)]"
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
                    <p className="coord mb-2">// reset access</p>
                    <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
                        Forgot password
                    </h1>
                    <p className="mt-2 text-sm leading-relaxed text-ink-dim">
                        Tell us your email and we&apos;ll send a link back to your boards.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                    {error ? (
                        <div
                            role="alert"
                            className="flex items-start gap-2 rounded-lg border border-[var(--color-coral)]/30 bg-[var(--color-coral)]/10 px-3.5 py-2.5 text-sm text-[var(--color-coral)]"
                        >
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                            <span>{error}</span>
                        </div>
                    ) : null}
                    {message ? (
                        <div
                            role="status"
                            className="flex items-start gap-2 rounded-lg border border-[var(--color-mint)]/30 bg-[var(--color-mint)]/10 px-3.5 py-2.5 text-sm text-[var(--color-mint)]"
                        >
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                            <span>{message}</span>
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
                                Sending reset link…
                            </>
                        ) : (
                            <>
                                Send reset link
                                <ArrowRight className="h-[15px] w-[15px] transition-transform group-hover:translate-x-1" />
                            </>
                        )}
                    </button>
                </form>

                <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-sm text-ink-dim">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-1.5 rounded text-[var(--color-indigo)] transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-indigo)]/40"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to log in
                    </Link>
                </p>
            </div>
        </main>
    );
}

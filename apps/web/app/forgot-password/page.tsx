"use client";

import Link from "next/link";
import { useState } from "react";
import { requestPasswordReset } from "../../lib/auth-client";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

const cardClass = "artboard w-full p-8 sm:p-10";
const labelClass = "mb-1.5 block text-sm font-medium text-ink";
const btnPrimary =
    "btn-primary focus-ring group inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold disabled:pointer-events-none disabled:opacity-50";
const linkClass =
    "text-indigo underline-offset-4 transition-colors hover:underline focus-ring rounded-sm";

function AuthWordmark() {
    return (
        <Link
            href="/"
            className="focus-ring mb-8 flex justify-center rounded-lg transition-opacity hover:opacity-80"
            aria-label="Vexio home"
        >
            <span className="font-display text-xl font-bold tracking-tight text-ink">
                Vex<span className="text-indigo">io</span>
            </span>
        </Link>
    );
}

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
        <main className="app flex min-h-screen items-center justify-center px-4 py-16">
            <div className="app-bg" aria-hidden />
            <div className="relative z-10 w-full max-w-md">
                <div className={cardClass}>
                    <AuthWordmark />

                    <div className="mb-6 text-center">
                        <p className="coord mb-2">{"// reset access"}</p>
                        <h1 className="font-display text-xl font-bold tracking-tight text-ink">
                            Forgot password
                        </h1>
                        <p className="mt-1.5 text-sm text-ink-dim">
                            We&apos;ll email you a reset link.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className={labelClass}>
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
                                className="input"
                            />
                        </div>
                        {error ? (
                            <div
                                role="alert"
                                className="flex items-start gap-2 rounded-xl border border-[var(--color-coral)]/30 bg-[var(--color-coral)]/10 px-3.5 py-2.5 text-sm text-[var(--color-coral)]"
                            >
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                                <span>{error}</span>
                            </div>
                        ) : null}
                        {message ? (
                            <div
                                role="status"
                                className="flex items-start gap-2 rounded-xl border border-[var(--color-mint)]/30 bg-[var(--color-mint)]/10 px-3.5 py-2.5 text-sm text-[var(--color-mint)]"
                            >
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                                <span>{message}</span>
                            </div>
                        ) : null}
                        <button type="submit" disabled={loading} className={btnPrimary}>
                            {loading ? (
                                <>
                                    <span
                                        className="h-4 w-4 shrink-0 rounded-full border-2 border-[var(--color-canvas)]/30 border-t-[var(--color-canvas)] motion-safe:animate-spin motion-reduce:animate-none"
                                        aria-hidden
                                    />
                                    Sending reset link…
                                </>
                            ) : (
                                <>
                                    Send reset link
                                    <ArrowRight className="h-4 w-4 transition-transform duration-150 ease-out motion-safe:group-hover:translate-x-0.5 motion-reduce:transition-none" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-ink-dim">
                        <Link href="/login" className={`${linkClass} inline-flex items-center gap-1.5`}>
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to log in
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}

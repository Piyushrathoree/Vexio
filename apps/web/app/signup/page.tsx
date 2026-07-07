"use client";

import Link from "next/link";
import { useState } from "react";
import { signUp } from "../../lib/auth-client";
import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        const { error: signUpError } = await signUp.email({
            name,
            email,
            password,
        });

        setLoading(false);

        if (signUpError) {
            setError(signUpError.message ?? "Sign up failed");
            return;
        }

        setMessage("Check your email to verify your account, then sign in.");
    };

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 py-16 text-ink">
            <div className="lp-bg" aria-hidden />
            <div
                className="aurora inset-x-1/4 top-1/4 h-72 bg-[radial-gradient(circle,var(--color-violet),transparent_60%)]"
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
                    <p className="coord mb-2">// create account</p>
                    <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
                        Start your canvas
                    </h1>
                    <p className="mt-2 text-sm leading-relaxed text-ink-dim">
                        Create an account and open your first board in seconds.
                    </p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                        <label
                            htmlFor="name"
                            className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-ink-faint"
                        >
                            Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            placeholder="Ada Lovelace"
                            required
                            autoComplete="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-xl border border-hairline bg-white/[0.03] px-4 py-2.5 text-ink outline-none transition-colors placeholder:text-ink-faint focus-visible:border-[var(--color-indigo)] focus-visible:ring-2 focus-visible:ring-[var(--color-indigo)]/40"
                        />
                    </div>
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
                            placeholder="8+ chars, letter + number"
                            required
                            minLength={8}
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
                                Creating account…
                            </>
                        ) : (
                            <>
                                Create account
                                <ArrowRight className="h-[15px] w-[15px] transition-transform group-hover:translate-x-1" />
                            </>
                        )}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-ink-dim">
                    Already on Vexio?{" "}
                    <Link
                        href="/login"
                        className="rounded text-[var(--color-indigo)] transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-indigo)]/40"
                    >
                        Log in
                    </Link>
                </p>
            </div>
        </main>
    );
}

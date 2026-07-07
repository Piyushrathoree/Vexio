"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { resetPassword } from "../../lib/auth-client";
import { AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const tokenError = searchParams.get("error");

    const [password, setPassword] = useState("");
    const [error, setError] = useState(
        tokenError === "INVALID_TOKEN" ? "This reset link is invalid or expired." : ""
    );
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            setError("Missing reset token.");
            return;
        }

        setLoading(true);
        setError("");

        const { error: resetError } = await resetPassword({
            newPassword: password,
            token,
        });

        setLoading(false);

        if (resetError) {
            setError(resetError.message ?? "Could not reset password");
            return;
        }

        router.push("/login");
    };

    return (
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
                <p className="coord mb-2">// new password</p>
                <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
                    Reset password
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-ink-dim">
                    Choose a new password to finish signing back in.
                </p>
            </div>

            {token ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="password"
                            className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-ink-faint"
                        >
                            New password
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
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
                                Resetting password…
                            </>
                        ) : (
                            <>
                                Reset password
                                <ArrowRight className="h-[15px] w-[15px] transition-transform group-hover:translate-x-1" />
                            </>
                        )}
                    </button>
                </form>
            ) : (
                <div className="space-y-3">
                    <div
                        role="alert"
                        className="flex items-start gap-2 rounded-lg border border-[var(--color-coral)]/30 bg-[var(--color-coral)]/10 px-3.5 py-2.5 text-sm text-[var(--color-coral)]"
                    >
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                        <span>{error || "Invalid reset link."}</span>
                    </div>
                    <Link
                        href="/forgot-password"
                        className="group flex items-center justify-center gap-1.5 rounded-xl border border-hairline bg-white/[0.03] py-3 text-sm text-ink transition-colors hover:border-white/20 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-indigo)]/40"
                    >
                        Request a new link
                        <ArrowRight className="h-[15px] w-[15px] transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            )}

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
    );
}

export default function ResetPasswordPage() {
    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 py-16 text-ink">
            <div className="lp-bg" aria-hidden />
            <div
                className="aurora inset-x-1/4 top-1/4 h-72 bg-[radial-gradient(circle,var(--color-mint),transparent_60%)]"
                aria-hidden
            />
            <Suspense
                fallback={
                    <div className="artboard relative z-10 grid w-full max-w-md place-items-center p-8 sm:p-10">
                        <span
                            className="h-6 w-6 rounded-full border-2 border-hairline border-t-[var(--color-indigo)] motion-safe:animate-spin"
                            aria-hidden
                        />
                    </div>
                }
            >
                <ResetPasswordForm />
            </Suspense>
        </main>
    );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { resetPassword } from "../../lib/auth-client";
import { AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";

const cardClass = "artboard w-full p-8 sm:p-10";
const labelClass = "mb-1.5 block text-sm font-medium text-ink";
const btnPrimary =
    "btn-primary focus-ring group inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold disabled:pointer-events-none disabled:opacity-50";
const btnGhost =
    "btn-ghost focus-ring group inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm";
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
        <div className={cardClass}>
            <AuthWordmark />

                    <div className="mb-6 text-center">
                        <p className="coord mb-2">{"// new password"}</p>
                <h1 className="font-display text-xl font-bold tracking-tight text-ink">
                    Reset password
                </h1>
                <p className="mt-1.5 text-sm text-ink-dim">
                    Choose a new password for your account.
                </p>
            </div>

            {token ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="password" className={labelClass}>
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
                    <button type="submit" disabled={loading} className={btnPrimary}>
                        {loading ? (
                            <>
                                <span
                                    className="h-4 w-4 shrink-0 rounded-full border-2 border-[var(--color-canvas)]/30 border-t-[var(--color-canvas)] motion-safe:animate-spin motion-reduce:animate-none"
                                    aria-hidden
                                />
                                Resetting password…
                            </>
                        ) : (
                            <>
                                Reset password
                                <ArrowRight className="h-4 w-4 transition-transform duration-150 ease-out motion-safe:group-hover:translate-x-0.5 motion-reduce:transition-none" />
                            </>
                        )}
                    </button>
                </form>
            ) : (
                <div className="space-y-3">
                    <div
                        role="alert"
                        className="flex items-start gap-2 rounded-xl border border-[var(--color-coral)]/30 bg-[var(--color-coral)]/10 px-3.5 py-2.5 text-sm text-[var(--color-coral)]"
                    >
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                        <span>{error || "Invalid reset link."}</span>
                    </div>
                    <Link href="/forgot-password" className={btnGhost}>
                        Request a new link
                        <ArrowRight className="h-4 w-4 transition-transform duration-150 ease-out motion-safe:group-hover:translate-x-0.5 motion-reduce:transition-none" />
                    </Link>
                </div>
            )}

            <p className="mt-6 text-center text-sm text-ink-dim">
                <Link href="/login" className={`${linkClass} inline-flex items-center gap-1.5`}>
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to log in
                </Link>
            </p>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <main className="app flex min-h-screen items-center justify-center px-4 py-16">
            <div className="app-bg" aria-hidden />
            <div className="relative z-10 w-full max-w-md">
                <Suspense
                    fallback={
                        <div className={`${cardClass} grid place-items-center py-12`}>
                            <span
                                className="h-6 w-6 rounded-full border-2 border-ink-faint/30 border-t-ink motion-safe:animate-spin motion-reduce:animate-none"
                                aria-hidden
                            />
                        </div>
                    }
                >
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </main>
    );
}

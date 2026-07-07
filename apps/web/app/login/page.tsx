"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "../../lib/auth-client";
import { AlertCircle, ArrowRight } from "lucide-react";

const cardClass = "artboard w-full p-8 sm:p-10";
const labelClass = "mb-1.5 block text-sm font-medium text-ink";
const btnPrimary =
    "btn-primary focus-ring group inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold disabled:pointer-events-none disabled:opacity-50";
const btnGhost =
    "btn-ghost focus-ring inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm disabled:pointer-events-none disabled:opacity-50";
const linkClass =
    "text-indigo underline-offset-4 transition-colors hover:underline focus-ring rounded-sm";

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
        <main className="app flex min-h-screen items-center justify-center px-4 py-16">
            <div className="app-bg" aria-hidden />
            <div className="relative z-10 w-full max-w-md">
                <div className={cardClass}>
                    <AuthWordmark />

                    <div className="mb-6 text-center">
                        <p className="coord mb-2">{"// welcome back"}</p>
                        <h1 className="font-display text-xl font-bold tracking-tight text-ink">
                            Log in
                        </h1>
                        <p className="mt-1.5 text-sm text-ink-dim">
                            Open your boards and keep sketching.
                        </p>
                    </div>

                    <form onSubmit={handleEmailLogin} className="space-y-4">
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
                        <div>
                            <label htmlFor="password" className={labelClass}>
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
                                className="input"
                            />
                        </div>
                        <p className="text-right text-sm">
                            <Link href="/forgot-password" className={linkClass}>
                                Forgot password?
                            </Link>
                        </p>
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
                                    Logging in…
                                </>
                            ) : (
                                <>
                                    Log in
                                    <ArrowRight className="h-4 w-4 transition-transform duration-150 ease-out motion-safe:group-hover:translate-x-0.5 motion-reduce:transition-none" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="my-6 flex items-center gap-3" aria-hidden>
                        <span className="h-px flex-1 bg-hairline" />
                        <span className="text-sm text-ink-faint">or</span>
                        <span className="h-px flex-1 bg-hairline" />
                    </div>

                    <button
                        type="button"
                        onClick={() => handleSocial("google")}
                        className={btnGhost}
                    >
                        <GoogleIcon />
                        Continue with Google
                    </button>

                    <p className="mt-6 text-center text-sm text-ink-dim">
                        New to Vexio?{" "}
                        <Link href="/signup" className={linkClass}>
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}

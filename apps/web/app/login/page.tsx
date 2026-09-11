"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signIn, useSession } from "../../lib/auth-client";
import { setSessionMarker } from "../../lib/session-marker";
import { AlertCircle } from "lucide-react";
import {
    AuthBrandPanel,
    AuthFormShell,
    authInput,
    authLabel,
    authSubmit,
} from "../../components/AuthSplit";

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

const UNREACHABLE_MESSAGE =
    "Couldn't reach the server. Check that the API is running and that you're opening the app on the same host it expects.";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const getRedirectTarget = () => {
        if (typeof window === "undefined") return "/rooms";
        const redirect = new URLSearchParams(window.location.search).get(
            "redirect"
        );
        if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
            return redirect;
        }
        return "/rooms";
    };

    // An OAuth sign-in returns to a protected page with only the API-host
    // session cookie; the middleware can't see that and bounces here. Once
    // the session check confirms we're signed in, record the first-party
    // marker and continue to the intended page.
    const { data: session } = useSession();
    useEffect(() => {
        if (session) {
            setSessionMarker();
            router.replace(getRedirectTarget());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session]);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const { error: signInError } = await signIn.email({
                email,
                password,
            });

            if (signInError) {
                const msg = signInError.message || "Sign in failed";
                setError(
                    msg.toLowerCase().includes("verify")
                        ? "Verify your email first — check your inbox for the link."
                        : msg
                );
                return;
            }

            router.push(getRedirectTarget());
        } catch {
            // The auth client throws (rather than returning `error`) when the
            // request never gets a response — server down, wrong
            // NEXT_PUBLIC_AUTH_URL, or a CORS rejection because the page is
            // open on an origin other than WEB_URL. Without this the button
            // sat on "Signing in…" forever with nothing to explain why.
            setError(UNREACHABLE_MESSAGE);
        } finally {
            setLoading(false);
        }
    };

    const handleSocial = async (provider: "google" | "github") => {
        setError("");
        try {
            await signIn.social({
                provider,
                callbackURL: `${window.location.origin}${getRedirectTarget()}`,
            });
        } catch {
            setError(UNREACHABLE_MESSAGE);
        }
    };

    return (
        <main className="flex min-h-screen w-full overflow-x-hidden overflow-y-auto">
            <AuthBrandPanel
                headline="Draw anything."
                accent="Together."
                body="Collaborate on an infinite canvas. Sketch ideas, plan projects, and create without limits, in real-time."
            />
            <AuthFormShell>
                <h1 className="font-display mb-1.5 text-3xl font-semibold text-[#1a1916]">
                    Welcome back.
                </h1>
                <p className="mb-8 text-sm text-[#7a7770]">
                    Sign in to continue to Vexio
                </p>

                <form onSubmit={handleEmailLogin} className="space-y-5">
                    <div>
                        <label htmlFor="email" className={authLabel}>
                            Email
                            <span className="ml-0.5 text-[#e04e1f]">*</span>
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={authInput}
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className={authLabel}>
                            Password
                            <span className="ml-0.5 text-[#e04e1f]">*</span>
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Your password"
                            required
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={authInput}
                        />
                    </div>
                    <p className="text-right text-sm">
                        <Link
                            href="/forgot-password"
                            className="font-semibold text-[#1a1916] hover:text-[#e04e1f]"
                        >
                            Forgot password?
                        </Link>
                    </p>
                    {error ? (
                        <div
                            role="alert"
                            className="flex items-start gap-2 text-sm text-[#e04e1f]"
                        >
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    ) : null}
                    <button type="submit" disabled={loading} className={authSubmit}>
                        {loading ? "Signing in…" : "Sign In"}
                    </button>
                </form>

                <div className="my-6 flex items-center gap-3" aria-hidden>
                    <span className="h-px flex-1 bg-[#e8e2d4]" />
                    <span className="text-xs text-[#b8b4ab]">or</span>
                    <span className="h-px flex-1 bg-[#e8e2d4]" />
                </div>

                <button
                    type="button"
                    onClick={() => handleSocial("google")}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#e8e2d4] bg-white text-sm font-medium text-[#1a1916] transition-colors hover:border-[#1a1916]/20"
                >
                    <GoogleIcon />
                    Continue with Google
                </button>

                <p className="mt-6 text-center text-sm text-[#7a7770]">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/signup"
                        className="font-semibold text-[#1a1916] hover:text-[#e04e1f]"
                    >
                        Create one
                    </Link>
                </p>
            </AuthFormShell>
        </main>
    );
}

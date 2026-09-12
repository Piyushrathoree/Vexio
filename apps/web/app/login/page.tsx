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
import {
    SocialAuthButtons,
    SocialAuthDivider,
} from "../../components/SocialAuthButtons";

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

                <SocialAuthDivider />

                <SocialAuthButtons
                    redirectTo={getRedirectTarget()}
                    onError={setError}
                />

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

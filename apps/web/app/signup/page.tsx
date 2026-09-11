"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signUp } from "../../lib/auth-client";
import { AlertCircle } from "lucide-react";
import {
    AuthBrandPanel,
    AuthFormShell,
    authInput,
    authLabel,
    authSubmit,
} from "../../components/AuthSplit";

export default function SignupPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<React.ReactNode>("");
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const { error: signUpError } = await signUp.email({
                name,
                email,
                password,
            });

            if (signUpError) {
                // better-auth only reports a duplicate email when `autoSignIn`
                // is on (see packages/auth/auth.ts); otherwise this would be a
                // silent 200. The account may have been created via Google, in
                // which case there's no password to sign in with.
                if (signUpError.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
                    setError(
                        <>
                            An account with this email already exists.{" "}
                            <Link
                                href="/login"
                                className="font-semibold underline underline-offset-2"
                            >
                                Sign in
                            </Link>{" "}
                            instead — or use &ldquo;Continue with Google&rdquo; if
                            that&apos;s how you registered.
                        </>
                    );
                    return;
                }
                setError(signUpError.message || "Sign up failed");
                return;
            }

            // `autoSignIn` already set the session cookie, so land on the
            // dashboard rather than asking for a second sign-in.
            router.push("/rooms");
        } catch {
            setError(
                "Couldn't reach the server. Check that the API is running and that you're opening the app on the same host it expects."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen w-full overflow-x-hidden overflow-y-auto">
            <AuthBrandPanel
                headline="Your ideas"
                accent="deserve a canvas."
                body="Join teams who sketch, plan, and create together on Vexio — the collaborative whiteboard built for deep work."
            />
            <AuthFormShell>
                <h1 className="font-display mb-1.5 text-3xl font-semibold text-[#1a1916]">
                    Create an account.
                </h1>
                <p className="mb-8 text-sm text-[#7a7770]">
                    Start collaborating on Vexio for free
                </p>

                <form onSubmit={handleSignup} className="space-y-5">
                    <div>
                        <label htmlFor="name" className={authLabel}>
                            Name
                            <span className="ml-0.5 text-[#e04e1f]">*</span>
                        </label>
                        <input
                            id="name"
                            type="text"
                            placeholder="Your full name"
                            required
                            autoComplete="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={authInput}
                        />
                    </div>
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
                            placeholder="Choose a strong password"
                            required
                            minLength={8}
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={authInput}
                        />
                    </div>
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
                        {loading ? "Creating account…" : "Create Account"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-[#7a7770]">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="font-semibold text-[#1a1916] hover:text-[#e04e1f]"
                    >
                        Sign in
                    </Link>
                </p>
            </AuthFormShell>
        </main>
    );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "../../lib/auth-client";

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
        <main className="min-h-screen flex items-center justify-center px-6 bg-white">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center">
                    <Link href="/" className="text-2xl font-bold text-orange-600">
                        VEXIO
                    </Link>
                    <h1 className="mt-4 text-2xl font-semibold text-slate-900">
                        Sign in
                    </h1>
                </div>

                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-orange-500"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-orange-500"
                    />
                    <p className="text-right text-sm">
                        <Link
                            href="/forgot-password"
                            className="text-orange-600 hover:underline"
                        >
                            Forgot password?
                        </Link>
                    </p>
                    {error ? (
                        <p className="text-sm text-red-600">{error}</p>
                    ) : null}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-orange-500 py-2.5 font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <div className="space-y-2">
                    <button
                        type="button"
                        onClick={() => handleSocial("google")}
                        className="w-full rounded-lg border border-slate-300 py-2.5 font-medium hover:bg-slate-50"
                    >
                        Continue with Google
                    </button>
                </div>

                <p className="text-center text-sm text-slate-600">
                    No account?{" "}
                    <Link href="/signup" className="text-orange-600 hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </main>
    );
}

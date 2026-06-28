"use client";

import Link from "next/link";
import { useState } from "react";
import { signUp } from "../../lib/auth-client";

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
        <main className="min-h-screen flex items-center justify-center px-6 bg-white">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center">
                    <Link href="/" className="text-2xl font-bold text-orange-600">
                        VEXIO
                    </Link>
                    <h1 className="mt-4 text-2xl font-semibold text-slate-900">
                        Create account
                    </h1>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-orange-500"
                    />
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
                        placeholder="Password (8+ chars, letter + number)"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-orange-500"
                    />
                    {error ? (
                        <p className="text-sm text-red-600">{error}</p>
                    ) : null}
                    {message ? (
                        <p className="text-sm text-green-600">{message}</p>
                    ) : null}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-orange-500 py-2.5 font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                    >
                        {loading ? "Creating account..." : "Sign up"}
                    </button>
                </form>

                <p className="text-center text-sm text-slate-600">
                    Already have an account?{" "}
                    <Link href="/login" className="text-orange-600 hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </main>
    );
}

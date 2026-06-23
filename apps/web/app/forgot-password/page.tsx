"use client";

import Link from "next/link";
import { useState } from "react";
import { requestPasswordReset } from "../../lib/auth-client";

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
        <main className="min-h-screen flex items-center justify-center px-6 bg-white">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center">
                    <Link href="/" className="text-2xl font-bold text-orange-600">
                        VEXIO
                    </Link>
                    <h1 className="mt-4 text-2xl font-semibold text-slate-900">
                        Forgot password
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                        {loading ? "Sending..." : "Send reset link"}
                    </button>
                </form>

                <p className="text-center text-sm text-slate-600">
                    <Link href="/login" className="text-orange-600 hover:underline">
                        Back to sign in
                    </Link>
                </p>
            </div>
        </main>
    );
}

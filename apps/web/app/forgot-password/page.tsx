"use client";

import Link from "next/link";
import { useState } from "react";
import { requestPasswordReset } from "../../lib/auth-client";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import {
    AuthBrandPanel,
    AuthFormShell,
    authInput,
    authLabel,
    authSubmit,
} from "../../components/AuthSplit";

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
        <main className="flex min-h-screen w-full overflow-x-hidden overflow-y-auto">
            <AuthBrandPanel
                headline="We'll get you"
                accent="back in."
                body="Forgot your password? Enter your email and we'll send a reset link — no extra steps."
            />
            <AuthFormShell>
                <h1 className="font-display mb-1.5 text-3xl font-semibold text-[#1a1916]">
                    Forgot password.
                </h1>
                <p className="mb-8 text-sm text-[#7a7770]">
                    We&apos;ll email you a reset link.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
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
                    {error ? (
                        <div
                            role="alert"
                            className="flex items-start gap-2 text-sm text-[#e04e1f]"
                        >
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    ) : null}
                    {message ? (
                        <div
                            role="status"
                            className="flex items-start gap-2 text-sm text-[#5c8865]"
                        >
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{message}</span>
                        </div>
                    ) : null}
                    <button type="submit" disabled={loading} className={authSubmit}>
                        {loading ? "Sending…" : "Send reset link"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-[#7a7770]">
                    <Link
                        href="/login"
                        className="font-semibold text-[#1a1916] hover:text-[#e04e1f]"
                    >
                        Back to sign in
                    </Link>
                </p>
            </AuthFormShell>
        </main>
    );
}

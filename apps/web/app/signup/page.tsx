"use client";

import Link from "next/link";
import { useState } from "react";
import { signUp } from "../../lib/auth-client";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import {
    AuthBrandPanel,
    AuthFormShell,
    authInput,
    authLabel,
    authSubmit,
} from "../../components/AuthSplit";

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

        setMessage("Account created. Sign in to get started.");
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

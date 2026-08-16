"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { resetPassword } from "../../lib/auth-client";
import { AlertCircle } from "lucide-react";
import {
    AuthBrandPanel,
    AuthFormShell,
    authInput,
    authLabel,
    authSubmit,
} from "../../components/AuthSplit";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const tokenError = searchParams.get("error");

    const [password, setPassword] = useState("");
    const [error, setError] = useState(
        tokenError === "INVALID_TOKEN"
            ? "This reset link is invalid or expired."
            : ""
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
        <>
            <h1 className="font-display mb-1.5 text-3xl font-semibold text-[#1a1916]">
                Reset password.
            </h1>
            <p className="mb-8 text-sm text-[#7a7770]">
                Choose a new password for your account.
            </p>

            {token ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="password" className={authLabel}>
                            New password
                            <span className="ml-0.5 text-[#e04e1f]">*</span>
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
                        {loading ? "Resetting…" : "Reset password"}
                    </button>
                </form>
            ) : (
                <div className="space-y-3">
                    <div
                        role="alert"
                        className="flex items-start gap-2 text-sm text-[#e04e1f]"
                    >
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{error || "Invalid reset link."}</span>
                    </div>
                    <Link
                        href="/forgot-password"
                        className={authSubmit + " block text-center"}
                    >
                        Request a new link
                    </Link>
                </div>
            )}

            <p className="mt-6 text-center text-sm text-[#7a7770]">
                <Link
                    href="/login"
                    className="font-semibold text-[#1a1916] hover:text-[#e04e1f]"
                >
                    Back to sign in
                </Link>
            </p>
        </>
    );
}

export default function ResetPasswordPage() {
    return (
        <main className="flex min-h-screen w-full overflow-x-hidden overflow-y-auto">
            <AuthBrandPanel
                headline="A fresh start"
                accent="on the canvas."
                body="Set a new password and get back to sketching with your team."
            />
            <AuthFormShell>
                <Suspense
                    fallback={
                        <div className="grid place-items-center py-12">
                            <span className="h-6 w-6 rounded-full border-2 border-[#e8e2d4] border-t-[#1a1916] motion-safe:animate-spin" />
                        </div>
                    }
                >
                    <ResetPasswordForm />
                </Suspense>
            </AuthFormShell>
        </main>
    );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { resetPassword } from "../../lib/auth-client";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const tokenError = searchParams.get("error");

    const [password, setPassword] = useState("");
    const [error, setError] = useState(
        tokenError === "INVALID_TOKEN" ? "This reset link is invalid or expired." : ""
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
        <div className="w-full max-w-md space-y-6">
            <div className="text-center">
                <Link href="/" className="text-2xl font-bold text-orange-600">
                    VEXIO
                </Link>
                <h1 className="mt-4 text-2xl font-semibold text-slate-900">
                    Reset password
                </h1>
            </div>

            {token ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="password"
                        placeholder="New password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-orange-500"
                    />
                    {error ? (
                        <p className="text-sm text-red-600">{error}</p>
                    ) : null}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-orange-500 py-2.5 font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                    >
                        {loading ? "Saving..." : "Set new password"}
                    </button>
                </form>
            ) : (
                <p className="text-sm text-red-600 text-center">
                    {error || "Invalid reset link."}
                </p>
            )}

            <p className="text-center text-sm text-slate-600">
                <Link href="/login" className="text-orange-600 hover:underline">
                    Back to sign in
                </Link>
            </p>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <main className="min-h-screen flex items-center justify-center px-6 bg-white">
            <Suspense>
                <ResetPasswordForm />
            </Suspense>
        </main>
    );
}

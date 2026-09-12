"use client";

import { useState } from "react";
import { signIn } from "../lib/auth-client";

const UNREACHABLE_MESSAGE =
    "Couldn't reach the server. Check that the API is running and that you're opening the app on the same host it expects.";

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

const buttonClass =
    "flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#e8e2d4] bg-white text-sm font-medium text-[#1a1916] transition-colors hover:border-[#1a1916]/20 disabled:opacity-60";

/**
 * Google sign-in, shared by /login and /signup — better-auth treats both as the
 * same `sign-in/social` call (an unknown account is created on the spot), so
 * the two pages must offer the same providers or signing up with a provider
 * looks impossible from the signup page.
 *
 * `callbackURL` is where better-auth sends the browser once the provider hop
 * finishes. It is stored in the `better-auth.state` cookie, so that cookie has
 * to survive the return trip from the provider — see CROSS_SITE_AUTH in
 * packages/auth/auth.ts.
 */
export function SocialAuthButtons({
    redirectTo = "/rooms",
    onError,
}: {
    redirectTo?: string;
    onError?: (message: string) => void;
}) {
    const [pending, setPending] = useState<"google" | null>(null);

    const handleSocial = async (provider: "google") => {
        onError?.("");
        setPending(provider);
        try {
            await signIn.social({
                provider,
                callbackURL: `${window.location.origin}${redirectTo}`,
            });
        } catch {
            onError?.(UNREACHABLE_MESSAGE);
            setPending(null);
        }
        // On success the browser navigates away, so `pending` is never cleared.
    };

    return (
        <div className="flex flex-col gap-3">
            <button
                type="button"
                onClick={() => handleSocial("google")}
                disabled={pending !== null}
                className={buttonClass}
            >
                <GoogleIcon />
                {pending === "google" ? "Redirecting…" : "Continue with Google"}
            </button>
        </div>
    );
}

export function SocialAuthDivider() {
    return (
        <div className="my-6 flex items-center gap-3" aria-hidden>
            <span className="h-px flex-1 bg-[#e8e2d4]" />
            <span className="text-xs text-[#b8b4ab]">or</span>
            <span className="h-px flex-1 bg-[#e8e2d4]" />
        </div>
    );
}

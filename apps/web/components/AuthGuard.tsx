"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "../lib/auth-client";
import { clearSessionMarker, setSessionMarker } from "../lib/session-marker";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (session) {
            // Covers sign-ins that never went through the fetch client
            // (OAuth redirects land here with only the API-host cookie).
            setSessionMarker();
            return;
        }
        if (!isPending && !session) {
            clearSessionMarker();
            // Read the query string directly (rather than via
            // `useSearchParams`) so this component doesn't force every
            // protected page into a Suspense boundary just to build a
            // redirect target — this effect only ever runs in the browser
            // anyway.
            const search =
                typeof window !== "undefined" ? window.location.search : "";
            const redirectTo = `${pathname}${search}`;
            router.replace(
                `/login?redirect=${encodeURIComponent(redirectTo)}`,
            );
        }
    }, [session, isPending, router, pathname]);

    if (isPending) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-canvas">
                <div className="flex flex-col items-center gap-3">
                    <span
                        className="h-8 w-8 animate-spin rounded-full border-2 border-hairline border-t-[var(--color-indigo)]"
                        aria-hidden
                    />
                    <p className="font-mono text-xs text-ink-faint">
                        Loading…
                    </p>
                </div>
            </main>
        );
    }

    if (!session) {
        return null;
    }

    return children;
}

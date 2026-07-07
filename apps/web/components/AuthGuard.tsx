"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "../lib/auth-client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { data: session, isPending } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (!isPending && !session) {
            router.replace("/login");
        }
    }, [session, isPending, router]);

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

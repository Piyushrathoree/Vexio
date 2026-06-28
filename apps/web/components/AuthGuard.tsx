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
            <main className="flex min-h-screen items-center justify-center bg-white">
                <p className="text-slate-600">Loading...</p>
            </main>
        );
    }

    if (!session) {
        return null;
    }

    return children;
}

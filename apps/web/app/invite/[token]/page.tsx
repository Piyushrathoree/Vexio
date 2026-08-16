"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useSession } from "../../../lib/auth-client";
import { acceptInvite } from "../../../lib/rooms-api";

const cardClass = "artboard w-full p-8 sm:p-10 text-center";
const btnPrimary =
    "btn-primary focus-ring group inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold disabled:pointer-events-none disabled:opacity-50";
const btnGhost =
    "btn-ghost focus-ring group inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm";

function AuthWordmark() {
    return (
        <Link
            href="/"
            className="focus-ring mb-8 flex justify-center rounded-lg transition-opacity hover:opacity-80"
            aria-label="Vexio home"
        >
            <span className="text-xl font-semibold tracking-tight text-ink">
                Vexio
            </span>
        </Link>
    );
}

type Status = "checking" | "accepting" | "success" | "error";

export default function InviteAcceptPage() {
    const router = useRouter();
    const params = useParams<{ token: string }>();
    const token = Array.isArray(params?.token) ? params.token[0] : params?.token;

    const { data: session, isPending } = useSession();

    const [status, setStatus] = useState<Status>("checking");
    const [error, setError] = useState("");
    const attempted = useRef(false);
    const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (isPending) return;

        if (!token) {
            setStatus("error");
            setError("This invite link is missing its token.");
            return;
        }

        if (!session) {
            const redirectTo = `/invite/${encodeURIComponent(token)}`;
            router.replace(`/login?redirect=${encodeURIComponent(redirectTo)}`);
            return;
        }

        if (attempted.current) return;
        attempted.current = true;

        setStatus("accepting");

        void (async () => {
            const result = await acceptInvite(token);

            if (!result.ok) {
                setStatus("error");
                setError(
                    result.status === 404
                        ? "This invite link is invalid or has already been used."
                        : result.status === 400
                          ? "This invite link has expired."
                          : result.message
                );
                return;
            }

            setStatus("success");
            const slug = result.data.slug;
            redirectTimer.current = setTimeout(() => {
                router.replace(slug ? `/whiteboard/${slug}` : "/rooms");
            }, 700);
        })();

        return () => {
            if (redirectTimer.current) clearTimeout(redirectTimer.current);
        };
    }, [isPending, session, token, router]);

    return (
        <main className="app flex min-h-screen items-center justify-center px-4 py-16">
            <div className="app-bg" aria-hidden />
            <div className="relative z-10 w-full max-w-md">
                <div className={cardClass}>
                    <AuthWordmark />

                    {status === "checking" || status === "accepting" ? (
                        <>
                            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl border border-hairline bg-white/[0.03] text-indigo">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                            <h1 className="font-display text-xl font-bold tracking-tight text-ink">
                                Joining board…
                            </h1>
                            <p className="mt-1.5 text-sm text-ink-dim">
                                Hang tight while we confirm your invite.
                            </p>
                        </>
                    ) : null}

                    {status === "success" ? (
                        <>
                            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl border border-hairline bg-white/[0.03] text-[var(--color-mint)]">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <h1 className="font-display text-xl font-bold tracking-tight text-ink">
                                You&apos;re in
                            </h1>
                            <p className="mt-1.5 text-sm text-ink-dim">
                                Taking you to the board…
                            </p>
                        </>
                    ) : null}

                    {status === "error" ? (
                        <>
                            <div className="mb-6">
                                <p className="coord mb-2">{"// invite"}</p>
                                <h1 className="font-display text-xl font-bold tracking-tight text-ink">
                                    Couldn&apos;t join that board
                                </h1>
                            </div>
                            <div
                                role="alert"
                                className="flex items-start gap-2 rounded-xl border border-[var(--color-coral)]/30 bg-[var(--color-coral)]/10 px-3.5 py-2.5 text-left text-sm text-[var(--color-coral)]"
                            >
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                                <span>{error}</span>
                            </div>
                            <div className="mt-6 space-y-2">
                                <Link href="/rooms" className={btnPrimary}>
                                    Go to your boards
                                    <ArrowRight className="h-4 w-4 transition-transform duration-150 ease-out motion-safe:group-hover:translate-x-0.5 motion-reduce:transition-none" />
                                </Link>
                                <Link href="/" className={btnGhost}>
                                    Back home
                                </Link>
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </main>
    );
}

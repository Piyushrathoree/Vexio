"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AuthGuard } from "../../components/AuthGuard";
import { apiFetch } from "../../lib/api";

type Room = {
    id: number;
    slug: string;
    createdAt: string;
};

function RoomsContent() {
    const router = useRouter();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [newSlug, setNewSlug] = useState("");
    const [joinSlug, setJoinSlug] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    const loadRooms = useCallback(async () => {
        setLoading(true);
        setError("");

        const res = await apiFetch("/api/v1/rooms");
        if (!res.ok) {
            setError(`Failed to load rooms (${res.status})`);
            setLoading(false);
            return;
        }

        const json = await res.json();
        setRooms(json.data?.rooms ?? []);
        setLoading(false);
    }, []);

    useEffect(() => {
        void loadRooms();
    }, [loadRooms]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setError("");

        const res = await apiFetch("/api/v1/room", {
            method: "POST",
            body: JSON.stringify({ slug: newSlug.trim().toLowerCase() }),
        });

        setCreating(false);

        if (!res.ok) {
            const json = await res.json().catch(() => null);
            setError(json?.message ?? `Failed to create room (${res.status})`);
            return;
        }

        const json = await res.json();
        const room = json.data?.room as Room | undefined;
        if (room?.slug) {
            router.push(`/whiteboard/${room.slug}`);
        }
    };

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        const slug = joinSlug.trim().toLowerCase();
        if (!slug) return;
        router.push(`/whiteboard/${slug}`);
    };

    return (
        <main className="min-h-screen bg-white px-6 py-10 dark:bg-neutral-950">
            <div className="mx-auto max-w-lg space-y-8">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <Link
                            href="/"
                            className="text-2xl font-bold text-orange-600"
                        >
                            VEXIO
                        </Link>
                        <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-neutral-100">
                            Your rooms
                        </h1>
                    </div>
                    <button
                        type="button"
                        onClick={() => void loadRooms()}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
                    >
                        Refresh
                    </button>
                </div>

                <form
                    onSubmit={handleJoin}
                    className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-neutral-800"
                >
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-neutral-200">
                        Open a room
                    </h2>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="room-slug"
                            required
                            value={joinSlug}
                            onChange={(e) => setJoinSlug(e.target.value)}
                            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-orange-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                        />
                        <button
                            type="submit"
                            className="shrink-0 rounded-lg bg-slate-800 px-4 py-2.5 font-semibold text-white hover:bg-slate-900 dark:bg-neutral-100 dark:text-neutral-900"
                        >
                            Open
                        </button>
                    </div>
                </form>

                <form
                    onSubmit={handleCreate}
                    className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-neutral-800"
                >
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-neutral-200">
                        Create a room
                    </h2>
                    <input
                        type="text"
                        placeholder="new-room-slug"
                        required
                        value={newSlug}
                        onChange={(e) => setNewSlug(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-orange-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                    />
                    <button
                        type="submit"
                        disabled={creating}
                        className="w-full rounded-lg bg-orange-500 py-2.5 font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                    >
                        {creating ? "Creating..." : "Create & open"}
                    </button>
                </form>

                {error ? (
                    <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                        {error}
                    </p>
                ) : null}

                <div>
                    <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-neutral-200">
                        My rooms
                    </h2>
                    {loading ? (
                        <p className="text-slate-600 dark:text-neutral-400">
                            Loading...
                        </p>
                    ) : rooms.length === 0 ? (
                        <p className="text-slate-600 dark:text-neutral-400">
                            No rooms yet — create one above.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {rooms.map((room) => (
                                <li key={room.id}>
                                    <Link
                                        href={`/whiteboard/${room.slug}`}
                                        className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 hover:border-orange-400 dark:border-neutral-800 dark:hover:border-orange-500"
                                    >
                                        <span className="font-medium text-slate-900 dark:text-neutral-100">
                                            {room.slug}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            Open →
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </main>
    );
}

export default function RoomsPage() {
    return (
        <AuthGuard>
            <RoomsContent />
        </AuthGuard>
    );
}

"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Plus, Users, X } from "lucide-react";

const SLUG_PATTERN = /^[a-z0-9-]+$/;
export const isValidSlug = (slug: string) =>
    slug.length >= 3 && slug.length <= 64 && SLUG_PATTERN.test(slug);

function useDialogChrome(
    onClose: () => void,
    inputRef: RefObject<HTMLInputElement | null>
) {
    useEffect(() => {
        inputRef.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose, inputRef]);
}

export function CreateBoardDialog({
    onClose,
    onCreate,
    creating,
    error,
}: {
    onClose: () => void;
    onCreate: (slug: string) => void;
    creating: boolean;
    error: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [value, setValue] = useState("");
    const [touched, setTouched] = useState(false);
    const slug = value.trim().toLowerCase();
    const invalid = touched && slug.length > 0 && !isValidSlug(slug);

    useDialogChrome(onClose, inputRef);

    return (
        <section
            className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1a1916]/40 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm overflow-hidden rounded-2xl bg-[#f9f6ef] shadow-2xl shadow-[#1a1916]/20"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative border-b border-[#e8e2d4] px-6 pb-5 pt-6">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a1916]">
                        <Plus className="h-4 w-4 text-[#f9f6ef]" />
                    </div>
                    <h2 className="font-display text-xl font-semibold text-[#1a1916]">
                        New board
                    </h2>
                    <p className="mt-0.5 text-xs text-[#7a7770]">
                        Give your collaborative canvas a name.
                    </p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-5 top-5 rounded-lg p-1.5 text-[#b8b4ab] hover:bg-[#e8e2d4] hover:text-[#1a1916]"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <form
                    className="space-y-4 px-6 py-5"
                    onSubmit={(e) => {
                        e.preventDefault();
                        setTouched(true);
                        if (isValidSlug(slug)) onCreate(slug);
                    }}
                >
                    <input
                        ref={inputRef}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onBlur={() => setTouched(true)}
                        placeholder="quarterly-retro"
                        className="w-full rounded-lg border border-[#e8e2d4] bg-white px-3.5 py-2.5 font-mono text-sm text-[#1a1916] placeholder:text-[#c8c4bc] focus:border-[#1a1916]/20 focus:outline-none focus:ring-2 focus:ring-[#1a1916]/6"
                    />
                    <p className={`text-xs ${invalid ? "text-[#e04e1f]" : "text-[#b8b4ab]"}`}>
                        {invalid
                            ? "Lowercase letters, numbers and hyphens — 3 to 64 characters."
                            : "Lowercase letters, numbers, hyphens · 3–64 characters"}
                    </p>
                    {error ? (
                        <p className="text-xs text-[#e04e1f]">{error}</p>
                    ) : null}
                    <button
                        type="submit"
                        disabled={creating}
                        className="w-full rounded-xl bg-[#1a1916] px-4 py-2.5 text-sm font-semibold text-[#f9f6ef] hover:bg-[#2d2c26] disabled:opacity-60"
                    >
                        {creating ? "Creating…" : "Create board"}
                    </button>
                </form>
            </div>
        </section>
    );
}

export function JoinBoardDialog({
    onClose,
    onJoin,
    opening,
    error,
}: {
    onClose: () => void;
    onJoin: (raw: string) => void;
    opening: boolean;
    error: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [value, setValue] = useState("");

    useDialogChrome(onClose, inputRef);

    return (
        <section
            className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1a1916]/40 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm overflow-hidden rounded-2xl bg-[#f9f6ef] shadow-2xl shadow-[#1a1916]/20"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative border-b border-[#e8e2d4] px-6 pb-5 pt-6">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a1916]">
                        <Users className="h-4 w-4 text-[#f9f6ef]" />
                    </div>
                    <h2 className="font-display text-xl font-semibold text-[#1a1916]">
                        Join a board
                    </h2>
                    <p className="mt-0.5 text-xs text-[#7a7770]">
                        Paste a board link, invite, or slug.
                    </p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-5 top-5 rounded-lg p-1.5 text-[#b8b4ab] hover:bg-[#e8e2d4] hover:text-[#1a1916]"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <form
                    className="space-y-4 px-6 py-5"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (value.trim()) onJoin(value);
                    }}
                >
                    <input
                        ref={inputRef}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="paste a link, or a slug"
                        className="w-full rounded-lg border border-[#e8e2d4] bg-white px-3.5 py-2.5 font-mono text-sm text-[#1a1916] placeholder:text-[#c8c4bc] focus:border-[#1a1916]/20 focus:outline-none focus:ring-2 focus:ring-[#1a1916]/6"
                    />
                    {error ? (
                        <p className="text-xs text-[#e04e1f]">{error}</p>
                    ) : null}
                    <button
                        type="submit"
                        disabled={opening || !value.trim()}
                        className="w-full rounded-xl bg-[#1a1916] px-4 py-2.5 text-sm font-semibold text-[#f9f6ef] hover:bg-[#2d2c26] disabled:opacity-60"
                    >
                        {opening ? "Opening…" : "Open board"}
                    </button>
                </form>
            </div>
        </section>
    );
}

"use client";

import { useState } from "react";

const MARKER_COLORS = [
    "var(--color-indigo)",
    "var(--color-violet)",
    "var(--color-coral)",
    "var(--color-mint)",
    "var(--color-amber)",
];

function hashString(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash * 31 + value.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
}

function initialsFor(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return (parts[0] ?? "").slice(0, 2).toUpperCase();
    const first = parts[0]?.[0] ?? "";
    const last = parts[parts.length - 1]?.[0] ?? "";
    return `${first}${last}`.toUpperCase();
}

interface ProfileAvatarProps {
    name: string;
    image?: string | null;
    size?: number;
    className?: string;
}

export function ProfileAvatar({
    name,
    image,
    size = 88,
    className = "",
}: ProfileAvatarProps) {
    const [imageFailed, setImageFailed] = useState(false);
    const showImage = Boolean(image) && !imageFailed;
    const accent =
        MARKER_COLORS[hashString(name) % MARKER_COLORS.length] ??
        "var(--color-indigo)";

    return (
        <span
            className={`avatar relative overflow-hidden ${className}`}
            style={{
                width: size,
                height: size,
                background: showImage ? undefined : accent,
                fontSize: Math.max(12, size * 0.36),
            }}
        >
            {showImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={image ?? undefined}
                    alt=""
                    width={size}
                    height={size}
                    className="h-full w-full object-cover"
                    onError={() => setImageFailed(true)}
                />
            ) : (
                <span aria-hidden>{initialsFor(name)}</span>
            )}
        </span>
    );
}

export default ProfileAvatar;

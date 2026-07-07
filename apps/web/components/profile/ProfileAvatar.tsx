"use client";

import { useState } from "react";

// Mirrors the whiteboard's collaborator-presence marker cycle (see
// PRESENCE_MARKER_COLORS in app/whiteboard/[slug]/page.tsx) so a person's
// accent color feels consistent with the rest of the "Living Canvas".
const MARKER_COLORS = [
    "var(--color-indigo)",
    "var(--color-violet)",
    "var(--color-coral)",
    "var(--color-mint)",
    "var(--color-amber)",
];

// Stable hash so the same name always lands on the same marker color and
// the same initials, across reloads and devices.
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

// Large identity avatar for the profile hero: the user's photo when one
// loads successfully, otherwise initials on a marker-color disc derived
// from their name.
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
            className={`relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full border border-hairline ${className}`}
            style={{
                width: size,
                height: size,
                background: showImage ? undefined : accent,
            }}
        >
            {showImage ? (
                // A plain <img> sidesteps next/image's remote-domain
                // allowlist — social-login avatars can come from any
                // provider's CDN, and this is a small, non-LCP image.
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
                <span
                    className="font-display font-bold text-[#0a0c12]"
                    style={{ fontSize: Math.max(12, size * 0.36) }}
                    aria-hidden
                >
                    {initialsFor(name)}
                </span>
            )}
        </span>
    );
}

export default ProfileAvatar;

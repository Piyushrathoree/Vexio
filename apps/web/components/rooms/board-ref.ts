// Resolving whatever someone pasted into the "Open a board" box.
//
// People paste what they were handed: a bare slug, a full board URL
// (http://localhost:3001/whiteboard/my-board), or an invite link
// (/invite/<token>). The old dashboard only ever handled the bare-slug case
// and pushed straight at /whiteboard/<slug>, which 403'd for anyone who wasn't
// already a member and bounced them back with no explanation. Working out what
// was actually pasted is the first half of fixing that; joinRoom() is the
// second.

export type BoardRef =
    | { kind: "slug"; slug: string }
    | { kind: "invite"; token: string };

function decodeSafe(value: string) {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

export function parseBoardRef(raw: string): BoardRef | null {
    const value = raw.trim();
    if (!value) return null;

    let path: string | null = null;
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
        try {
            // Also drops any ?query or #fragment the link carried.
            path = new URL(value).pathname;
        } catch {
            return null;
        }
    } else if (value.includes("/")) {
        // Schemeless but path-shaped: "/whiteboard/x", "localhost:3001/…".
        path = value;
    }

    // No slash anywhere — it's a bare slug.
    if (path === null) return { kind: "slug", slug: value.toLowerCase() };

    const segments = path.split("/").filter(Boolean).map(decodeSafe);
    if (segments.length === 0) return null;

    const inviteAt = segments.lastIndexOf("invite");
    if (inviteAt >= 0) {
        const token = segments[inviteAt + 1];
        // A route segment with nothing after it is a truncated link, not a
        // board called "invite" — don't guess past it.
        return token ? { kind: "invite", token } : null;
    }

    const boardAt = segments.lastIndexOf("whiteboard");
    if (boardAt >= 0) {
        const slug = segments[boardAt + 1];
        return slug ? { kind: "slug", slug: slug.toLowerCase() } : null;
    }

    // Unrecognised shape — the last path segment is the best available guess.
    const last = segments[segments.length - 1];
    return last ? { kind: "slug", slug: last.toLowerCase() } : null;
}

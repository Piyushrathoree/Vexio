// A board's accent colour is derived from its slug, never from its position in
// the list. Sorting or filtering the dashboard must not repaint a board — the
// colour is part of that board's identity, so it has to be a pure function of
// something stable about the board itself.
//
// Values are the existing palette tokens from app/globals.css, inlined as hex
// because they're also handed to SVG paint attributes and color-mix().

export const BOARD_ACCENTS = [
    "#6e8cff", // indigo
    "#b98cff", // violet
    "#55e0ad", // mint
    "#ff7e82", // coral
    "#ffc96b", // amber
] as const;

// FNV-1a, 32-bit. Cheap, stable, and well spread for short ASCII slugs.
function hashSlug(slug: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < slug.length; i += 1) {
        h ^= slug.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
}

export function accentForSlug(slug: string): string {
    return BOARD_ACCENTS[hashSlug(slug) % BOARD_ACCENTS.length]!;
}

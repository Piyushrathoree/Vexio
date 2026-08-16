export type BoardPalette = { bg: string; accent: string; lines: string };

export const BOARD_PALETTES: BoardPalette[] = [
    { bg: "#1a1916", accent: "#e04e1f", lines: "#3d3c36" },
    { bg: "#2d1a0e", accent: "#e8845c", lines: "#3d2616" },
    { bg: "#0e1a2d", accent: "#5c88e8", lines: "#162236" },
    { bg: "#0e2d1a", accent: "#5ce8a0", lines: "#163d26" },
    { bg: "#2d0e2d", accent: "#d45ce8", lines: "#3d163d" },
];

export const BOARD_ACCENTS = BOARD_PALETTES.map((p) => p.accent);

function hashSlug(slug: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < slug.length; i += 1) {
        h ^= slug.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
}

export function paletteForSlug(slug: string): BoardPalette {
    return BOARD_PALETTES[hashSlug(slug) % BOARD_PALETTES.length]!;
}

export function accentForSlug(slug: string): string {
    return paletteForSlug(slug).accent;
}

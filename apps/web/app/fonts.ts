/** Loaded once in `app/layout.tsx`. Import that file's class, don't instantiate again. */
export const FONT_FAMILY =
    '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif';

export function getPlusJakartaStack(): string {
    if (typeof document === "undefined") {
        return FONT_FAMILY;
    }
    const loaded = getComputedStyle(document.documentElement)
        .getPropertyValue("--font-plus-jakarta")
        .trim();
    return loaded ? `${loaded}, ${FONT_FAMILY}` : FONT_FAMILY;
}

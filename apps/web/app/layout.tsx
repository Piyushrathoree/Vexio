import "@repo/ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import {
    Bricolage_Grotesque,
    Inter,
    JetBrains_Mono,
    Kalam,
} from "next/font/google";

// Display voice — characterful contemporary grotesque.
const bricolage = Bricolage_Grotesque({
    subsets: ["latin"],
    weight: ["400", "600", "700", "800"],
    variable: "--font-bricolage",
    display: "swap",
});

// Body / UI — precise and quiet.
const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

// Hand — sketch annotations on the canvas.
const kalam = Kalam({
    subsets: ["latin"],
    weight: ["400", "700"],
    variable: "--font-kalam",
    display: "swap",
});

// Utility — technical labels, tool chips, coordinates.
const jetbrains = JetBrains_Mono({
    subsets: ["latin"],
    weight: ["400", "500", "700"],
    variable: "--font-jetbrains",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Vexio — the collaborative canvas",
    description:
        "A real-time whiteboard where teams think out loud. Sketch together, watch live cursors, and turn a prompt into a clean SVG without leaving the board.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html
            lang="en"
            className={`${bricolage.variable} ${inter.variable} ${kalam.variable} ${jetbrains.variable} scroll-smooth motion-reduce:scroll-auto`}
            suppressHydrationWarning
        >
            <body className={inter.className}>{children}</body>
        </html>
    );
}

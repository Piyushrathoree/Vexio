import "@repo/ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono, Kalam } from "next/font/google";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

const bricolage = Bricolage_Grotesque({
    subsets: ["latin"],
    variable: "--font-bricolage",
    display: "swap",
});

// Hand — sketch annotations on the canvas (unported whiteboard chrome).
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
            className={`${inter.className} ${inter.variable} ${bricolage.variable} ${kalam.variable} ${jetbrains.variable} scroll-smooth motion-reduce:scroll-auto`}
        >
            <body>{children}</body>
        </html>
    );
}

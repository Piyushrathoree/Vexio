import "@repo/ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    variable: "--font-plus-jakarta",
    display: "swap",
    weight: ["400", "500", "600", "700", "800"],
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
            className={`${plusJakarta.variable} scroll-smooth motion-reduce:scroll-auto`}
        >
            <body className={`${plusJakarta.className} antialiased`}>
                {children}
            </body>
        </html>
    );
}

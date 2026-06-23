import "@repo/ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import { Inter, Kalam } from "next/font/google";

// Modern, clean sans-serif for UI
const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

// Handwritten style for whiteboard text
const kalam = Kalam({
    subsets: ["latin"],
    weight: ["400", "700"],
    variable: "--font-kalam",
});

export const metadata: Metadata = {
    title: "Vexio - Collaborative Whiteboard",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html
            lang="en"
            className={`${inter.variable} ${kalam.variable}`}
            suppressHydrationWarning
        >
            <body className={inter.className}>{children}</body>
        </html>
    );
}

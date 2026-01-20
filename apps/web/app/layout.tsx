import "@repo/ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import { Kalam } from "next/font/google"

const kalam = Kalam({
    subsets: ["latin"],
    weight: ["400", "700"],
})
export const metadata: Metadata = {
    title: "Create Turborepo",
}
export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">

            <body className={`${kalam.className}`}>{children}</body>
        </html>
    );
}
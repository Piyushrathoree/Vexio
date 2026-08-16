import Link from "next/link";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import Logo from "./Logo";

export function AuthBrandPanel({
    headline,
    accent,
    body,
}: {
    headline: string;
    accent: string;
    body: string;
}) {
    return (
        <aside className="relative hidden flex-col bg-[#141410] lg:flex lg:w-[52%]">
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.035]"
                style={{
                    backgroundImage:
                        "radial-gradient(circle, #f9f6ef 1px, transparent 1px)",
                    backgroundSize: "30px 30px",
                }}
            />
            <div className="pointer-events-none absolute bottom-[-40px] right-[-60px] opacity-[0.06]">
                <svg width="480" height="480" viewBox="0 0 480 480" fill="none">
                    <path
                        d="M 460 240 C 458 116, 358 22, 232 26 C 110 30, 18 124, 22 248 C 26 370, 120 460, 244 458 C 366 456, 462 366, 460 242"
                        stroke="#f9f6ef"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        fill="none"
                    />
                </svg>
            </div>
            <div className="pointer-events-none absolute right-[16%] top-[22%] opacity-[0.18]">
                <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                    <circle cx="8" cy="8" r="3" fill="#e04e1f" />
                    <circle cx="22" cy="4" r="1.8" fill="#e04e1f" />
                    <circle cx="36" cy="12" r="2.5" fill="#e04e1f" />
                    <circle cx="14" cy="32" r="1.5" fill="#e04e1f" />
                    <circle cx="38" cy="36" r="3" fill="#e04e1f" />
                </svg>
            </div>
            <div className="relative flex h-full flex-col justify-between p-12">
                <Logo light />
                <div>
                    <h2 className="font-display text-5xl font-semibold leading-[1.08] tracking-tight text-white/65">
                        {headline}
                        <br />
                        <span className="text-[#e04e1f]/75">{accent}</span>
                    </h2>
                    <p className="mt-5 max-w-[280px] text-sm leading-relaxed text-white/28">
                        {body}
                    </p>
                </div>
                <p className="text-[11px] text-white/18">
                    &copy; {new Date().getFullYear()} Vexio. All rights reserved.
                </p>
            </div>
        </aside>
    );
}

export function AuthFormShell({ children }: { children: ReactNode }) {
    return (
        <div className="relative flex w-full flex-col items-center justify-center bg-[#f9f6ef] px-6 lg:w-[48%]">
            <Link
                href="/"
                className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full border border-[#e8e2d4] text-[#b8b4ab] transition-all hover:border-[#1a1916]/25 hover:text-[#1a1916]"
                aria-label="Back to home"
            >
                <X size={15} />
            </Link>
            <div className="w-full max-w-[340px]">{children}</div>
        </div>
    );
}

export const authLabel =
    "mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-[#7a7770]";
export const authInput =
    "w-full rounded-lg border border-[#e8e2d4] bg-white px-3.5 py-2.5 text-sm text-[#1a1916] placeholder:text-[#c8c4bc] transition-all duration-150 focus:border-[#1a1916]/20 focus:outline-none focus:ring-2 focus:ring-[#1a1916]/6";
export const authSubmit =
    "w-full rounded-xl bg-[#1a1916] px-4 py-3 text-sm font-semibold text-[#f9f6ef] shadow-sm transition-all duration-150 hover:bg-[#2d2c26] disabled:cursor-not-allowed disabled:opacity-60";

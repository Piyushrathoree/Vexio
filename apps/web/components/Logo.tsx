import Link from "next/link";

interface LogoProps {
    light?: boolean;
    size?: "sm" | "md";
}

export default function Logo({ light = false, size = "md" }: LogoProps) {
    const markSize = size === "sm" ? 26 : 30;
    const textSize = size === "sm" ? "text-lg" : "text-xl";
    const markBg = light ? "#f9f6ef" : "#1a1916";
    const frameLine = light ? "rgba(26,25,22,0.25)" : "rgba(249,246,239,0.2)";
    const wordPrimary = light ? "#f9f6ef" : "#1a1916";
    const wordSecondary = light ? "rgba(249,246,239,0.5)" : "#9a9690";

    return (
        <Link
            className="focus-ring flex items-center gap-2.5 rounded-lg"
            href="/"
            aria-label="Vexio home"
        >
            <svg
                width={markSize}
                height={markSize}
                viewBox="0 0 30 30"
                fill="none"
                aria-hidden="true"
            >
                <rect width="30" height="30" rx="7" fill={markBg} />
                <rect
                    x="6"
                    y="6"
                    width="18"
                    height="18"
                    rx="2.5"
                    stroke={frameLine}
                    strokeWidth="1.2"
                    fill="none"
                />
                <path
                    d="M8 17 C 11 13, 14 20, 17 16 S 20 11, 23 14"
                    stroke="#e04e1f"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    fill="none"
                />
                <circle cx="23" cy="14" r="1.2" fill="#e04e1f" />
            </svg>
            <span
                className={`${textSize} font-semibold tracking-tight`}
            >
                <span style={{ color: wordPrimary }}>Vex</span>
                <span style={{ color: wordSecondary }}>io</span>
            </span>
        </Link>
    );
}

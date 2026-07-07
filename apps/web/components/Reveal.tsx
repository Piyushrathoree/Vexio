"use client";

import {
    useEffect,
    useRef,
    useState,
    type ElementType,
    type ReactNode,
} from "react";

interface RevealProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    as?: ElementType;
    id?: string;
}

// Fades content up the first time it scrolls into view. Respects
// prefers-reduced-motion via CSS (the .reveal rule is disabled there).
export function Reveal({
    children,
    className = "",
    delay = 0,
    as: Tag = "div",
    id,
}: RevealProps) {
    const ref = useRef<HTMLElement | null>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry && entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <Tag
            id={id}
            ref={ref as never}
            style={{ ["--d" as string]: `${delay}ms` }}
            className={`reveal ${inView ? "is-in" : ""} ${className}`}
        >
            {children}
        </Tag>
    );
}

export default Reveal;

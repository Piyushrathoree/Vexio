import React from "react";

interface BadgeProps {
    icon?: React.ReactNode;
    text: string;
    className2?: string;
}

const Badge = ({ icon, text, className2 }: BadgeProps) => {
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-sm mb-4 ${className2}`}
        >
            {icon}
            {text}
        </span>
    );
};

export default Badge;

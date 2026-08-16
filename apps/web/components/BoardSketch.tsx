const ink = {
    terracotta: "#e04e1f",
    coral: "#ff8a62",
    blue: "#6e8cff",
    blueSoft: "#9bb6ff",
    mint: "#5ce8a0",
    amber: "#e8aa5a",
    cream: "#f4ead8",
    yellow: "#ffc96b",
    pink: "#ff9eb5",
    green: "#b8f0c8",
    white: "#f9f6ef",
};

function SketchFilter({ id }: { id: string }) {
    return (
        <filter id={id} x="-6%" y="-6%" width="112%" height="112%">
            <feTurbulence
                type="fractalNoise"
                baseFrequency="0.85"
                numOctaves="2"
                seed="3"
                result="n"
            />
            <feDisplacementMap
                in="SourceGraphic"
                in2="n"
                scale="1.35"
                xChannelSelector="R"
                yChannelSelector="G"
            />
        </filter>
    );
}

function Box({
    x,
    y,
    w,
    h,
    stroke,
    fill = "transparent",
    rx = 12,
    filter,
}: {
    x: number;
    y: number;
    w: number;
    h: number;
    stroke: string;
    fill?: string;
    rx?: number;
    filter?: string;
}) {
    return (
        <g filter={filter ? `url(#${filter})` : undefined}>
            <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx={rx}
                fill={fill}
                stroke={stroke}
                strokeWidth="2.3"
            />
            <rect
                x={x + 1.4}
                y={y - 0.8}
                width={w - 2.2}
                height={h + 1.4}
                rx={rx}
                fill="none"
                stroke={stroke}
                strokeWidth="0.9"
                opacity="0.32"
            />
        </g>
    );
}

function Arrow({
    x1,
    y1,
    x2,
    y2,
    stroke,
    filter,
}: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    stroke: string;
    filter?: string;
}) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2 + (x2 - x1 > 0 ? -10 : 10);
    const a1 = angle - Math.PI / 7;
    const a2 = angle + Math.PI / 7;
    const len = 11;
    return (
        <g filter={filter ? `url(#${filter})` : undefined} fill="none">
            <path
                d={`M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`}
                stroke={stroke}
                strokeWidth="2.2"
                strokeLinecap="round"
            />
            <path
                d={`M${x2} ${y2} L${x2 - len * Math.cos(a1)} ${y2 - len * Math.sin(a1)} M${x2} ${y2} L${x2 - len * Math.cos(a2)} ${y2 - len * Math.sin(a2)}`}
                stroke={stroke}
                strokeWidth="2.2"
                strokeLinecap="round"
            />
        </g>
    );
}

function Sticky({
    x,
    y,
    rotate,
    fill,
    title,
    note,
}: {
    x: number;
    y: number;
    rotate: number;
    fill: string;
    title: string;
    note?: string;
}) {
    return (
        <g transform={`rotate(${rotate} ${x + 58} ${y + 36})`}>
            <rect
                x={x}
                y={y}
                width="116"
                height="72"
                rx="4"
                fill={fill}
                stroke="rgba(26,25,22,0.08)"
            />
            <text
                x={x + 12}
                y={y + 28}
                fill="#2a2418"
                fontSize="13"
                fontWeight="700"
            >
                {title}
            </text>
            {note ? (
                <text x={x + 12} y={y + 48} fill="#5c4a28" fontSize="11">
                    {note}
                </text>
            ) : null}
        </g>
    );
}

function Cursor({
    x,
    y,
    color,
    name,
}: {
    x: number;
    y: number;
    color: string;
    name: string;
}) {
    const w = 12 + name.length * 6.6;
    return (
        <g transform={`translate(${x} ${y})`}>
            <path
                d="M1 1 L1 18 L6.5 13.5 L10 22 L13.2 20.4 L9.4 12 L15 12 Z"
                fill={color}
                stroke="#191a1f"
                strokeWidth="1"
            />
            <rect x="10" y="16" width={w} height="18" rx="5" fill={color} />
            <text
                x={16}
                y={29}
                fill="#fff"
                fontSize="11"
                fontWeight="700"
            >
                {name}
            </text>
        </g>
    );
}

function Label({
    x,
    y,
    text,
    fill = ink.white,
    size = 13,
    weight = 600,
    anchor = "middle",
}: {
    x: number;
    y: number;
    text: string;
    fill?: string;
    size?: number;
    weight?: number;
    anchor?: "start" | "middle" | "end";
}) {
    return (
        <text
            x={x}
            y={y}
            fill={fill}
            fontSize={size}
            fontWeight={weight}
            textAnchor={anchor}
        >
            {text}
        </text>
    );
}

export function HeroBoardDrawing() {
    return (
        <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 1000 500"
            fill="none"
            aria-hidden
            style={{
                fontFamily:
                    "var(--font-plus-jakarta), ui-sans-serif, system-ui, sans-serif",
            }}
        >
            <SketchFilter id="sketch-hero" />

            <text
                x="48"
                y="86"
                fill={ink.cream}
                fontSize="28"
                fontWeight="700"
                transform="rotate(-3 48 86)"
            >
                checkout, this week
            </text>
            <path
                d="M46 98 C140 112 240 90 318 104"
                stroke={ink.terracotta}
                strokeWidth="3"
                strokeLinecap="round"
                filter="url(#sketch-hero)"
            />

            <Sticky
                x={44}
                y={128}
                rotate={-6}
                fill={ink.yellow}
                title="Guest checkout"
                note="don’t force account"
            />
            <Sticky
                x={78}
                y={214}
                rotate={4}
                fill={ink.pink}
                title="Too many fields"
                note="cut address line 2"
            />
            <Sticky
                x={36}
                y={308}
                rotate={-3}
                fill={ink.green}
                title="Apple Pay"
                note="ship if we can"
            />

            <g filter="url(#sketch-hero)">
                <ellipse
                    cx="390"
                    cy="168"
                    rx="58"
                    ry="36"
                    fill="#6e8cff18"
                    stroke={ink.blue}
                    strokeWidth="2.3"
                />
            </g>
            <Label x={390} y={173} text="visit" fill={ink.blueSoft} />

            <Box
                x={488}
                y={134}
                w={118}
                h={70}
                stroke={ink.terracotta}
                fill="#e04e1f22"
                filter="sketch-hero"
            />
            <Label x={547} y={175} text="cart" fill={ink.coral} />

            <g filter="url(#sketch-hero)">
                <path
                    d="M680 168 L734 128 L788 168 L734 208 Z"
                    fill="#5ce8a018"
                    stroke={ink.mint}
                    strokeWidth="2.3"
                />
            </g>
            <Label x={734} y={173} text="pay?" fill={ink.mint} />

            <Box
                x={830}
                y={134}
                w={118}
                h={70}
                stroke={ink.amber}
                fill="#e8aa5a18"
                filter="sketch-hero"
            />
            <Label x={889} y={175} text="receipt" fill={ink.amber} />

            <Arrow x1={448} y1={168} x2={484} y2={168} stroke={ink.blue} filter="sketch-hero" />
            <Arrow x1={610} y1={168} x2={676} y2={168} stroke={ink.terracotta} filter="sketch-hero" />
            <Arrow x1={790} y1={168} x2={826} y2={168} stroke={ink.mint} filter="sketch-hero" />

            <Box
                x={678}
                y={248}
                w={112}
                h={56}
                stroke={ink.coral}
                fill="#e04e1f14"
                filter="sketch-hero"
            />
            <Label x={734} y={282} text="retry" fill={ink.coral} size={12} />
            <Arrow x1={734} y1={210} x2={734} y2={244} stroke={ink.mint} filter="sketch-hero" />

            <g filter="url(#sketch-hero)">
                <rect
                    x="792"
                    y="248"
                    width="168"
                    height="228"
                    rx="28"
                    fill="#12131a"
                    stroke={ink.cream}
                    strokeWidth="2.4"
                />
                <rect
                    x="804"
                    y="268"
                    width="144"
                    height="190"
                    rx="12"
                    fill="#1c1d24"
                    stroke={ink.blue}
                    strokeWidth="1.6"
                />
                <rect x="848" y="254" width="56" height="8" rx="4" fill={ink.cream} opacity="0.35" />
                <rect x="818" y="284" width="116" height="18" rx="6" fill={ink.terracotta} opacity="0.85" />
                <rect x="818" y="314" width="116" height="10" rx="3" fill={ink.cream} opacity="0.2" />
                <rect x="818" y="332" width="88" height="10" rx="3" fill={ink.cream} opacity="0.14" />
                <rect x="818" y="360" width="116" height="36" rx="8" fill="#6e8cff22" stroke={ink.blue} />
                <rect x="818" y="408" width="116" height="28" rx="8" fill={ink.mint} opacity="0.8" />
            </g>
            <Label x={876} y={297} text="Pay" fill="#fff" size={11} />
            <Label x={876} y={382} text="•••• 4242" fill={ink.blueSoft} size={11} />
            <Label x={876} y={427} text="Confirm" fill="#14331c" size={11} weight={700} />

            <path
                d="M200 390 C280 350 360 420 470 360 C560 310 620 390 720 340"
                stroke={ink.amber}
                strokeWidth="2.6"
                strokeLinecap="round"
                filter="url(#sketch-hero)"
            />

            <Cursor x={520} y={188} color={ink.terracotta} name="Ava" />
            <Cursor x={700} y={112} color={ink.blue} name="Maya" />
            <Cursor x={210} y={268} color="#5c8865" name="Leo" />
        </svg>
    );
}

export function CollabBoardDrawing() {
    return (
        <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 560 420"
            fill="none"
            aria-hidden
            style={{
                fontFamily:
                    "var(--font-plus-jakarta), ui-sans-serif, system-ui, sans-serif",
            }}
        >
            <SketchFilter id="sketch-live" />

            <text
                x="36"
                y="58"
                fill={ink.cream}
                fontSize="22"
                fontWeight="700"
                transform="rotate(-4 36 58)"
            >
                standup
            </text>
            <path
                d="M34 70 C90 82 150 62 210 76"
                stroke={ink.terracotta}
                strokeWidth="3"
                strokeLinecap="round"
                filter="url(#sketch-live)"
            />

            <path
                d="M80 160 C90 110 160 100 170 160 C178 210 92 220 80 160 Z"
                stroke={ink.terracotta}
                strokeWidth="2.6"
                fill="#e04e1f18"
                filter="url(#sketch-live)"
            />
            <path
                d="M125 100 C125 80 125 70 125 58"
                stroke={ink.terracotta}
                strokeWidth="2.4"
                strokeLinecap="round"
                filter="url(#sketch-live)"
            />
            <path
                d="M125 58 C108 70 98 88 96 110"
                stroke={ink.terracotta}
                strokeWidth="2.2"
                strokeLinecap="round"
                filter="url(#sketch-live)"
            />

            <path
                d="M250 130 C310 90 390 100 420 160 C450 220 390 270 320 260 C250 250 220 190 250 130 Z"
                stroke={ink.blue}
                strokeWidth="2.6"
                fill="#6e8cff14"
                filter="url(#sketch-live)"
            />
            <path
                d="M300 180 C330 170 360 190 350 220"
                stroke={ink.blue}
                strokeWidth="2.2"
                strokeLinecap="round"
                filter="url(#sketch-live)"
            />

            <path
                d="M60 300 C120 270 170 330 240 290 C300 255 340 320 420 280"
                stroke={ink.amber}
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#sketch-live)"
            />

            <path
                d="M430 90 L448 146 L508 146 L460 180 L478 236 L430 202 L382 236 L400 180 L352 146 L412 146 Z"
                stroke={ink.mint}
                strokeWidth="2.2"
                fill="#5ce8a014"
                filter="url(#sketch-live)"
            />

            <Sticky
                x={390}
                y={300}
                rotate={6}
                fill={ink.yellow}
                title="Ship Fri"
                note="Maya + you"
            />

            <Cursor x={150} y={168} color={ink.terracotta} name="You" />
            <Cursor x={340} y={148} color={ink.blue} name="Maya" />
        </svg>
    );
}

export function BlankBoardSketch() {
    return (
        <svg
            viewBox="0 0 280 160"
            fill="none"
            className="h-[120px] w-[210px]"
            aria-hidden
            style={{
                fontFamily:
                    "var(--font-plus-jakarta), ui-sans-serif, system-ui, sans-serif",
            }}
        >
            <SketchFilter id="sketch-cta" />
            <rect
                x="8"
                y="8"
                width="264"
                height="144"
                rx="16"
                fill="#191a1f"
                stroke="#1a1916"
                strokeWidth="2"
            />
            <g opacity="0.35">
                {Array.from({ length: 8 }).map((_, i) =>
                    Array.from({ length: 14 }).map((_, j) => (
                        <circle
                            key={`${i}-${j}`}
                            cx={28 + j * 18}
                            cy={28 + i * 16}
                            r="1"
                            fill={ink.cream}
                        />
                    ))
                )}
            </g>
            <path
                d="M48 96 C90 70 120 110 168 78 C198 58 220 88 244 72"
                stroke={ink.terracotta}
                strokeWidth="2.6"
                strokeLinecap="round"
                filter="url(#sketch-cta)"
            />
            <text
                x="48"
                y="52"
                fill={ink.cream}
                fontSize="13"
                fontWeight="700"
                opacity="0.7"
            >
                your-slug
            </text>
        </svg>
    );
}

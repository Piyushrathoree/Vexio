export type ShapeType =
    | "rectangle"
    | "circle"
    | "line"
    | "pencil"
    | "diamond"
    | "arrow"
    | "text";

export interface Shape {
    id: string;
    type: ShapeType;
    x: number;
    y: number;
    width?: number;
    height?: number;
    endX?: number;
    endY?: number;
    points?: { x: number; y: number }[];
    text?: string; // For text elements
    options: {
        stroke: string;
        fill?: string;
        strokeWidth: number;
        roughness?: number;
        fontSize?: number;
        fontFamily?: string;
    };
}

// ---------------------------------
// TOOLS
// ---------------------------------
//

export type shapes =
    | "rectangle"
    | "circle"
    | "triangle"
    | "line"
    | "ellipse"
    | "arrow";
export type Tool = "select" | "pen" | "eraser" | "text" | shapes;

export interface BaseElement {
    id: string;
    type: string;
    x: number;
    y: number;
    z: number;
    stroke: string;
    strokeWidth: number;
    fill: string;
    opacity: number;
    roughness: number;
    rotation?: number;
}

export interface Rect extends BaseElement {
    width: number;
    height: number;
    type: "rectangle";
    x: number;
    y: number;
    borderRadius: number;
}

export interface Circle extends BaseElement {
    radius: number;
    type: "circle";
}

// export interface Triangle extends BaseElement {
//   sideLength: number;
//   type: 'triangle';
//   x: number;
//   y: number;
// }

export interface Line extends BaseElement {
    x: number;
    y: number;
    type: "line";
    endX: number;
    endY: number;
    startBinding?: Binding;
    endBinding?: Binding;
}

export interface Ellipse extends BaseElement {
    width: number;
    height: number;
    type: "ellipse";
    x: number;
    y: number;
}

export interface Arrow extends BaseElement {
    x: number;
    y: number;
    type: "arrow";
    endX: number;
    endY: number;
    arrowHeadStart?: number;
    arrowHeadEnd?: number;
    startBinding?: Binding;
    endBinding?: Binding;
}

export interface Binding {
    elementId: string;
    position: number; // 0-1
    gap: number;
}

export interface Text extends BaseElement {
    text: string;
    type: "text";
    x: number;
    y: number;
    fontSize: number;
    textAlign: "left" | "center" | "right";
    fontFamily: string;
}

export interface Image extends BaseElement {
    src: string;
    type: "image";
    x: number;
    y: number;
}

export interface PathElement extends BaseElement {
    type: "path";
    points: { x: number; y: number }[];
    smoothing?: number;
}

export type whiteboardElement =
    | Rect
    | Circle
    | Line
    | Ellipse
    | Arrow
    | Text
    | Image
    | PathElement;

export interface Camera {
    x: number;
    y: number;
    zoom: number;
}

export function generateId(): string {
    return (
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
    );
}

export const DEFAULT_ELEMENT_PROPS = {
    stroke: "#000",
    strokeWidth: 2,
    fill: "transparent",
    opacity: 1,
    zIndex: 0,
    roughness: 1,
};

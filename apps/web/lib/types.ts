export type Point = { x: number; y: number };
export type StrokePoint = Point & { t: number; pressure: number };
export type Tool =
    | "select"
    | "hand"
    | "pen"
    | "eraser"
    | "line"
    | "arrow"
    | "rect"
    | "ellipse"
    | "diamond"
    | "text";

export type ShapeType = "line" | "arrow" | "rect" | "ellipse" | "diamond";
export type FillableShapeType = "rect" | "ellipse" | "diamond";
export type DrawableType = ShapeType | "pen" | "text";

export interface BaseElement {
    id: string;
    type: DrawableType;
    color: string;
    thickness: number;
}

export interface ShapeElement extends BaseElement {
    type: ShapeType;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    fill: string | null;
}

export interface PenElement extends BaseElement {
    type: "pen";
    points: StrokePoint[];
}

export interface TextElement extends BaseElement {
    type: "text";
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    text: string;
    fontFamily: string;
}

export interface ActiveTextEditor {
    x: number;
    y: number;
    screenX: number;
    screenY: number;
    elementId?: string;
    width?: number;
    height?: number;
    text: string;
    color: string;
    thickness: number;
    fontFamily: string;
}

export type DrawingElement = ShapeElement | PenElement | TextElement;

export type PointerMode =
    | "drawing"
    | "panning"
    | "moving"
    | "resizing"
    | "erasing";
export type ResizeHandle =
    | "start"
    | "end"
    | "n"
    | "ne"
    | "e"
    | "se"
    | "s"
    | "sw"
    | "w"
    | "nw";

export interface ResizeHandleDescriptor {
    id: ResizeHandle;
    point: Point;
    cursorClass: string;
}

export interface PointerState {
    mode: PointerMode;
    pointerId: number;
    lastWorld: Point;
    lastScreen: Point;
    elementId?: string;
    resizeHandle?: ResizeHandle;
    originElement?: DrawingElement;
}

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
    | "triangle"
    | "star"
    | "sticky"
    | "text";

export type ShapeType =
    | "line"
    | "arrow"
    | "rect"
    | "ellipse"
    | "diamond"
    | "triangle"
    | "star";
export type FillableShapeType =
    | "rect"
    | "ellipse"
    | "diamond"
    | "triangle"
    | "star";
export type DrawableType = ShapeType | "pen" | "text" | "sticky";

// Stroke rendering style shared by all stroked shapes. Optional on the wire so
// legacy elements (which never carried it) still deserialize as "solid".
export type StrokeStyle = "solid" | "dashed";

export interface BaseElement {
    id: string;
    type: DrawableType;
    color: string;
    thickness: number;
    strokeStyle?: StrokeStyle;
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
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
}

// A sticky note: a filled, rounded card that also carries editable text. It
// reuses the x1/y1/x2/y2 box the shape/resize/move helpers already understand,
// so it serializes over the wire like any other element.
export interface StickyElement extends BaseElement {
    type: "sticky";
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    text: string;
    fill: string;
    fontFamily: string;
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
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
    // Present only while editing a sticky note — paints the textarea like the
    // card so the on-canvas element can be hidden behind it during editing.
    fill?: string;
    fontFamily: string;
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
}

export type DrawingElement =
    | ShapeElement
    | PenElement
    | TextElement
    | StickyElement;

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

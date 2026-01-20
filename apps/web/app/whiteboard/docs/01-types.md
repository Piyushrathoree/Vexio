# Step 1: Types & Data Model

Every element on the whiteboard is stored as a JavaScript object. The canvas just **renders** what these objects describe.

## `core/types.ts`

```typescript
/**
 * ENHANCED WHITEBOARD TYPES
 */

// ============================================
// TOOLS
// ============================================

export type Tool = 
  | 'select' | 'hand' | 'pen' | 'eraser'
  | 'rectangle' | 'ellipse' | 'circle' | 'diamond'
  | 'line' | 'arrow' | 'text' | 'sticky';

// ============================================
// BASE ELEMENT
// ============================================

export interface BaseElement {
  id: string;
  type: string;
  x: number;
  y: number;
  zIndex: number;
  stroke: string;
  strokeWidth: number;
  fill: string;
  opacity: number;
  roughness: number;
  locked?: boolean;
  rotation?: number;
}

// ============================================
// SHAPES
// ============================================

export interface RectangleElement extends BaseElement {
  type: 'rectangle';
  width: number;
  height: number;
  borderRadius?: number;
}

export interface EllipseElement extends BaseElement {
  type: 'ellipse';
  width: number;
  height: number;
}

export interface CircleElement extends BaseElement {
  type: 'circle';
  radius: number;  // x,y is CENTER
}

export interface DiamondElement extends BaseElement {
  type: 'diamond';
  width: number;
  height: number;
}

// ============================================
// LINES & ARROWS
// ============================================

export interface LineElement extends BaseElement {
  type: 'line';
  endX: number;
  endY: number;
  startBinding?: Binding;
  endBinding?: Binding;
}

export interface ArrowElement extends BaseElement {
  type: 'arrow';
  endX: number;
  endY: number;
  arrowHeadStart?: ArrowHead;
  arrowHeadEnd?: ArrowHead;
  startBinding?: Binding;
  endBinding?: Binding;
}

export type ArrowHead = 'none' | 'arrow' | 'dot' | 'bar' | 'triangle';

export interface Binding {
  elementId: string;
  position: number;  // 0-1
  gap: number;
}

// ============================================
// TEXT & STICKY
// ============================================

export interface PathElement extends BaseElement {
  type: 'path';
  points: { x: number; y: number }[];
  smoothing?: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface StickyElement extends BaseElement {
  type: 'sticky';
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fontFamily: string;
}

// ============================================
// UNION & HELPERS
// ============================================

export type WhiteboardElement = 
  | PathElement | RectangleElement | EllipseElement
  | CircleElement | DiamondElement | LineElement
  | ArrowElement | TextElement | StickyElement;

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const DEFAULT_ELEMENT_PROPS = {
  stroke: '#000000',
  strokeWidth: 2,
  fill: 'transparent',
  opacity: 1,
  roughness: 1,
};
```

## Shape Coordinates

| Shape | x, y means |
|-------|------------|
| Rectangle | Top-left corner |
| Ellipse | Top-left of bounding box |
| Circle | **Center point** |
| Diamond | Top-left of bounding box |
| Line/Arrow | Start point |
| Text | Baseline start |

---

**Prev:** [Step 0: Setup](./00-setup.md)  
**Next:** [Step 2: Canvas Basics](./02-canvas-basics.md)

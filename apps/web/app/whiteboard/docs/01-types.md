# Step 1: Types & Data Model

Every element on the whiteboard is stored as a JavaScript object. The canvas just **renders** what these objects describe.

## `core/types.ts`

```typescript
/**
 * WHITEBOARD TYPES
 * 
 * The "data model" - all elements are stored as objects,
 * and the canvas renders them.
 */

// ============================================
// TOOLS
// ============================================

export type Tool = 
  | 'select'    // Click to select, drag to move
  | 'hand'      // Pan the canvas
  | 'pen'       // Freehand drawing
  | 'eraser'    // Click to delete
  | 'rectangle' // Draw rectangles
  | 'ellipse'   // Draw ellipses
  | 'line'      // Draw lines
  | 'arrow'     // Draw arrows
  | 'text';     // Add text

// ============================================
// ELEMENT TYPES
// ============================================

// Base properties all elements share
export interface BaseElement {
  id: string;           // Unique identifier
  type: string;         // Element type
  x: number;            // X position
  y: number;            // Y position
  zIndex: number;       // Layer order
  stroke: string;       // Stroke color
  strokeWidth: number;  // Stroke thickness
  fill: string;         // Fill color
  opacity: number;      // 0-1
  roughness: number;    // 0 = smooth, 1+ = sketchy
}

// Freehand path (pen tool)
export interface PathElement extends BaseElement {
  type: 'path';
  points: { x: number; y: number }[];
}

// Rectangle
export interface RectangleElement extends BaseElement {
  type: 'rectangle';
  width: number;
  height: number;
}

// Ellipse
export interface EllipseElement extends BaseElement {
  type: 'ellipse';
  width: number;
  height: number;
}

// Line
export interface LineElement extends BaseElement {
  type: 'line';
  endX: number;
  endY: number;
}

// Arrow
export interface ArrowElement extends BaseElement {
  type: 'arrow';
  endX: number;
  endY: number;
}

// Text
export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
}

// Union of all element types
export type WhiteboardElement = 
  | PathElement 
  | RectangleElement 
  | EllipseElement 
  | LineElement 
  | ArrowElement
  | TextElement;

// ============================================
// CAMERA
// ============================================

export interface Camera {
  x: number;      // Pan X offset
  y: number;      // Pan Y offset
  zoom: number;   // Scale (1 = 100%)
}

// ============================================
// HELPERS
// ============================================

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

## Key Concepts

### Why Store Elements as Data?

The canvas is "dumb" - it's just pixels. By storing elements as data objects:
- We can easily serialize/save them
- We can send them over WebSocket
- We can undo/redo by storing history
- We can select and manipulate them

### Element Types

Each shape type has different properties:
- **Path**: Array of points
- **Rectangle**: x, y, width, height
- **Ellipse**: x, y, width, height
- **Line/Arrow**: x, y, endX, endY
- **Text**: x, y, text string

---

**Prev:** [Step 0: Setup](./00-setup.md)  
**Next:** [Step 2: Canvas Basics](./02-canvas-basics.md)

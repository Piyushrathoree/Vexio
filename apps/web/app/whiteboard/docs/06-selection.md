# Step 6: Selection System

How do we know which element was clicked? **Hit testing!**

## Create `core/hitTest.ts`

```typescript
import type { WhiteboardElement } from './types';

/**
 * Find which element was clicked
 * Check in reverse order (top elements first)
 */
export function hitTest(
  x: number,
  y: number,
  elements: WhiteboardElement[]
): WhiteboardElement | null {
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    if (isPointInElement(x, y, el)) {
      return el;
    }
  }
  return null;
}

function isPointInElement(
  x: number, 
  y: number, 
  el: WhiteboardElement
): boolean {
  const padding = 5; // Click tolerance

  switch (el.type) {
    // ========================================
    // RECTANGLE
    // ========================================
    case 'rectangle':
      return (
        x >= el.x - padding &&
        x <= el.x + el.width + padding &&
        y >= el.y - padding &&
        y <= el.y + el.height + padding
      );

    // ========================================
    // ELLIPSE (uses ellipse equation)
    // ========================================
    case 'ellipse': {
      const cx = el.x + el.width / 2;
      const cy = el.y + el.height / 2;
      const rx = el.width / 2 + padding;
      const ry = el.height / 2 + padding;
      
      // Ellipse equation: (x-cx)²/rx² + (y-cy)²/ry² <= 1
      return ((x - cx) ** 2) / (rx ** 2) + 
             ((y - cy) ** 2) / (ry ** 2) <= 1;
    }

    // ========================================
    // LINE / ARROW (distance to line segment)
    // ========================================
    case 'line':
    case 'arrow':
      return distanceToLine(
        x, y, 
        el.x, el.y, 
        el.endX, el.endY
      ) < padding + el.strokeWidth;

    // ========================================
    // PATH (check each line segment)
    // ========================================
    case 'path':
      for (let i = 1; i < el.points.length; i++) {
        const p1 = el.points[i - 1];
        const p2 = el.points[i];
        if (distanceToLine(x, y, p1.x, p1.y, p2.x, p2.y) < 
            padding + el.strokeWidth) {
          return true;
        }
      }
      return false;

    // ========================================
    // TEXT (approximate bounding box)
    // ========================================
    case 'text':
      const textWidth = el.text.length * el.fontSize * 0.6;
      return (
        x >= el.x - padding &&
        x <= el.x + textWidth + padding &&
        y >= el.y - el.fontSize - padding &&
        y <= el.y + padding
      );

    default:
      return false;
  }
}

/**
 * Calculate distance from point to line segment
 */
function distanceToLine(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): number {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;
  
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  return Math.sqrt((px - xx) ** 2 + (py - yy) ** 2);
}
```

## Selection State

```typescript
const [selectedId, setSelectedId] = useState<string | null>(null);
const isDraggingRef = useRef(false);
```

## Select on Click

```typescript
// POINTER DOWN
if (currentTool === 'select') {
  const world = screenToWorld(screenX, screenY);
  const hit = hitTest(world.x, world.y, elements);
  
  if (hit) {
    setSelectedId(hit.id);
    isDraggingRef.current = true;
  } else {
    setSelectedId(null);
  }
}
```

## Move Selected Element

```typescript
// POINTER MOVE
if (isDraggingRef.current && selectedId) {
  const world = screenToWorld(screenX, screenY);
  const dx = world.x - startPosRef.current.x;
  const dy = world.y - startPosRef.current.y;
  
  startPosRef.current = world;
  
  setElements(prev => prev.map(el => {
    if (el.id !== selectedId) return el;
    
    // Create updated element
    const updated = { ...el, x: el.x + dx, y: el.y + dy };
    
    // Also move end point for lines/arrows
    if ('endX' in updated) {
      updated.endX += dx;
      updated.endY += dy;
    }
    
    // Also move all points for paths
    if ('points' in updated) {
      updated.points = updated.points.map(p => ({
        x: p.x + dx,
        y: p.y + dy,
      }));
    }
    
    return updated;
  }));
}

// POINTER UP
isDraggingRef.current = false;
```

## Draw Selection Box

```typescript
function drawSelectionBox(
  ctx: CanvasRenderingContext2D, 
  element: WhiteboardElement
) {
  ctx.save();
  ctx.strokeStyle = '#4f46e5';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  
  // Calculate bounding box
  let x = element.x;
  let y = element.y;
  let w = 0;
  let h = 0;
  
  if ('width' in element) {
    w = element.width;
    h = element.height;
  } else if ('endX' in element) {
    x = Math.min(element.x, element.endX);
    y = Math.min(element.y, element.endY);
    w = Math.abs(element.endX - element.x);
    h = Math.abs(element.endY - element.y);
  } else if ('points' in element) {
    const xs = element.points.map(p => p.x);
    const ys = element.points.map(p => p.y);
    x = Math.min(...xs);
    y = Math.min(...ys);
    w = Math.max(...xs) - x;
    h = Math.max(...ys) - y;
  }
  
  ctx.strokeRect(x - 5, y - 5, w + 10, h + 10);
  ctx.restore();
}
```

## Delete with Keyboard

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      if (selectedId) {
        setElements(prev => prev.filter(el => el.id !== selectedId));
        setSelectedId(null);
      }
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selectedId]);
```

---

**Prev:** [Step 5: Tools](./05-tools.md)  
**Next:** [Step 7: Toolbar UI](./07-toolbar.md)

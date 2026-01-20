# Step 6: Selection & Hit Testing

How to detect which element was clicked.

## `core/hitTest.ts`

```typescript
import type { WhiteboardElement } from './types';

export function hitTest(x: number, y: number, elements: WhiteboardElement[]): WhiteboardElement | null {
  for (let i = elements.length - 1; i >= 0; i--) {
    if (isPointInElement(x, y, elements[i])) return elements[i];
  }
  return null;
}

function isPointInElement(x: number, y: number, el: WhiteboardElement): boolean {
  const p = 5; // padding

  switch (el.type) {
    case 'rectangle':
    case 'sticky':
      return x >= el.x - p && x <= el.x + el.width + p &&
             y >= el.y - p && y <= el.y + el.height + p;

    case 'ellipse': {
      const cx = el.x + el.width / 2, cy = el.y + el.height / 2;
      const rx = el.width / 2 + p, ry = el.height / 2 + p;
      return ((x - cx)**2) / (rx**2) + ((y - cy)**2) / (ry**2) <= 1;
    }

    case 'circle':
      // x,y is center for circle
      return Math.sqrt((x - el.x)**2 + (y - el.y)**2) <= el.radius + p;

    case 'diamond': {
      const cx = el.x + el.width / 2, cy = el.y + el.height / 2;
      const dx = Math.abs(x - cx) / (el.width / 2 + p);
      const dy = Math.abs(y - cy) / (el.height / 2 + p);
      return dx + dy <= 1;
    }

    case 'line':
    case 'arrow':
      return distToLine(x, y, el.x, el.y, el.endX, el.endY) < p + el.strokeWidth;

    case 'path':
      for (let i = 1; i < el.points.length; i++) {
        const a = el.points[i-1], b = el.points[i];
        if (distToLine(x, y, a.x, a.y, b.x, b.y) < p + el.strokeWidth) return true;
      }
      return false;

    case 'text':
      const tw = el.text.length * el.fontSize * 0.6;
      return x >= el.x - p && x <= el.x + tw + p &&
             y >= el.y - el.fontSize - p && y <= el.y + p;

    default: return false;
  }
}

function distToLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
  const dot = A*C + B*D, lenSq = C*C + D*D;
  let t = lenSq ? dot / lenSq : -1;
  t = Math.max(0, Math.min(1, t));
  return Math.sqrt((px - (x1 + t*C))**2 + (py - (y1 + t*D))**2);
}
```

## Moving Elements

```typescript
if (isDraggingRef.current && selectedId) {
  const dx = world.x - prevWorld.x;
  const dy = world.y - prevWorld.y;

  setElements(prev => prev.map(el => {
    if (el.id !== selectedId || el.locked) return el;
    
    const updated = { ...el, x: el.x + dx, y: el.y + dy };
    if ('endX' in updated) { updated.endX += dx; updated.endY += dy; }
    if ('points' in updated) {
      updated.points = updated.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
    }
    return updated;
  }));
}
```

## Delete with Keyboard

```typescript
useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if ((e.key === 'Backspace' || e.key === 'Delete') && selectedId) {
      const el = elements.find(e => e.id === selectedId);
      if (el && !el.locked) {
        setElements(prev => prev.filter(e => e.id !== selectedId));
        setSelectedId(null);
      }
    }
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, [selectedId, elements]);
```

---

**Prev:** [Step 5: Tools](./05-tools.md)  
**Next:** [Step 7: Toolbar](./07-toolbar.md)

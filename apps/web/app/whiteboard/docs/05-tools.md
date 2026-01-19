# Step 5: Tool Implementation

Each tool has different behavior for pointer events.

## Tool State

```typescript
const [currentTool, setCurrentTool] = useState<Tool>('pen');
const isDrawingRef = useRef(false);
const startPosRef = useRef({ x: 0, y: 0 });
const currentPathRef = useRef<{ x: number; y: number }[]>([]);
```

## Pen Tool (Freehand)

```typescript
// POINTER DOWN
if (currentTool === 'pen') {
  isDrawingRef.current = true;
  const world = screenToWorld(screenX, screenY);
  currentPathRef.current = [world];
}

// POINTER MOVE
if (isDrawingRef.current && currentTool === 'pen') {
  const world = screenToWorld(screenX, screenY);
  currentPathRef.current.push(world);
}

// POINTER UP
if (currentTool === 'pen' && currentPathRef.current.length > 1) {
  const newElement: PathElement = {
    id: generateId(),
    type: 'path',
    x: 0,
    y: 0,
    zIndex: elements.length,
    points: [...currentPathRef.current],
    stroke: strokeColor,
    strokeWidth,
    fill: 'transparent',
    opacity: 1,
    roughness: 0, // Paths are smooth
  };
  setElements(prev => [...prev, newElement]);
}
currentPathRef.current = [];
isDrawingRef.current = false;
```

## Rectangle Tool

```typescript
// POINTER DOWN
if (currentTool === 'rectangle') {
  isDrawingRef.current = true;
  startPosRef.current = screenToWorld(screenX, screenY);
}

// POINTER MOVE
// (Track end position for preview)

// POINTER UP
if (currentTool === 'rectangle') {
  const start = startPosRef.current;
  const end = screenToWorld(screenX, screenY);
  
  const newElement: RectangleElement = {
    id: generateId(),
    type: 'rectangle',
    x: Math.min(start.x, end.x),      // Top-left X
    y: Math.min(start.y, end.y),      // Top-left Y
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
    zIndex: elements.length,
    stroke: strokeColor,
    strokeWidth,
    fill: fillColor,
    opacity: 1,
    roughness: 1,
  };
  setElements(prev => [...prev, newElement]);
}
```

## Ellipse Tool

Same as rectangle, but type is `'ellipse'`:

```typescript
const newElement: EllipseElement = {
  id: generateId(),
  type: 'ellipse',
  x: Math.min(start.x, end.x),
  y: Math.min(start.y, end.y),
  width: Math.abs(end.x - start.x),
  height: Math.abs(end.y - start.y),
  // ... rest same as rectangle
};
```

## Line & Arrow Tools

```typescript
// POINTER UP
if (currentTool === 'line' || currentTool === 'arrow') {
  const start = startPosRef.current;
  const end = screenToWorld(screenX, screenY);
  
  const newElement: LineElement | ArrowElement = {
    id: generateId(),
    type: currentTool,  // 'line' or 'arrow'
    x: start.x,
    y: start.y,
    endX: end.x,
    endY: end.y,
    zIndex: elements.length,
    stroke: strokeColor,
    strokeWidth,
    fill: 'transparent',
    opacity: 1,
    roughness: 1,
  };
  setElements(prev => [...prev, newElement]);
}
```

## Text Tool

```typescript
// POINTER DOWN
if (currentTool === 'text') {
  const world = screenToWorld(screenX, screenY);
  const text = prompt('Enter text:');
  
  if (text) {
    const newElement: TextElement = {
      id: generateId(),
      type: 'text',
      x: world.x,
      y: world.y,
      zIndex: elements.length,
      stroke: strokeColor,
      strokeWidth: 1,
      fill: 'transparent',
      opacity: 1,
      roughness: 0,
      text,
      fontSize: 24,
      fontFamily: 'sans-serif',
    };
    setElements(prev => [...prev, newElement]);
  }
}
```

## Eraser Tool

```typescript
import { hitTest } from '../core/hitTest';

// POINTER DOWN
if (currentTool === 'eraser') {
  const world = screenToWorld(screenX, screenY);
  const hit = hitTest(world.x, world.y, elements);
  
  if (hit) {
    setElements(prev => prev.filter(el => el.id !== hit.id));
  }
}
```

## Complete Pointer Handler

```typescript
const handlePointerDown = useCallback((e: React.PointerEvent) => {
  const rect = canvasRef.current!.getBoundingClientRect();
  const screenX = e.clientX - rect.left;
  const screenY = e.clientY - rect.top;
  const world = screenToWorld(screenX, screenY);
  
  startPosRef.current = world;
  
  switch (currentTool) {
    case 'hand':
      isPanningRef.current = true;
      lastPanPosRef.current = { x: e.clientX, y: e.clientY };
      break;
      
    case 'select':
      const hit = hitTest(world.x, world.y, elements);
      setSelectedId(hit?.id ?? null);
      if (hit) isDraggingRef.current = true;
      break;
      
    case 'eraser':
      const target = hitTest(world.x, world.y, elements);
      if (target) {
        setElements(prev => prev.filter(el => el.id !== target.id));
      }
      break;
      
    case 'text':
      const text = prompt('Enter text:');
      if (text) {
        // Create text element...
      }
      break;
      
    case 'pen':
      isDrawingRef.current = true;
      currentPathRef.current = [world];
      break;
      
    case 'rectangle':
    case 'ellipse':
    case 'line':
    case 'arrow':
      isDrawingRef.current = true;
      break;
  }
}, [currentTool, elements, screenToWorld]);
```

---

**Prev:** [Step 4: RoughJS](./04-roughjs.md)  
**Next:** [Step 6: Selection System](./06-selection.md)

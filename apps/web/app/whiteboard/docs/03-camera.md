# Step 3: Camera System (Pan & Zoom)

This is what makes the canvas feel **infinite**!

## The Camera State

```typescript
interface Camera {
  x: number;    // Pan offset X
  y: number;    // Pan offset Y
  zoom: number; // Scale (1 = 100%)
}

const [camera, setCamera] = useState<Camera>({ 
  x: 0, 
  y: 0, 
  zoom: 1 
});
```

## Screen vs World Coordinates

This is **crucial** to understand:

```
┌─────────────────────────────────┐
│  SCREEN (what you see)          │
│  ┌───────────────────┐          │
│  │  Viewport         │          │
│  │    ╔═════════╗    │          │
│  │    ║  WORLD  ║    │ ← Infinite
│  │    ║ Content ║    │   canvas
│  │    ╚═════════╝    │          │
│  └───────────────────┘          │
│          ↑                      │
│    Camera position              │
└─────────────────────────────────┘
```

### Convert Screen → World

When the user clicks, we get **screen** coordinates. But elements are stored in **world** coordinates.

```typescript
function screenToWorld(screenX: number, screenY: number) {
  return {
    x: (screenX - camera.x) / camera.zoom,
    y: (screenY - camera.y) / camera.zoom,
  };
}
```

### Apply Camera in Render

Before drawing elements, apply the camera transform:

```typescript
function render() {
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Draw background (in screen space)
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(0, 0, width, height);
  
  // Draw grid (affected by camera)
  drawGrid(ctx, width, height, camera);
  
  // Apply camera transform
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);
  
  // Draw elements (in world space)
  for (const element of elements) {
    drawElement(ctx, element);
  }
  
  // Restore to screen space
  ctx.restore();
  
  // Draw UI (in screen space)
  drawToolbar();
}
```

## Panning (Hand Tool)

```typescript
const isPanningRef = useRef(false);
const lastPanPosRef = useRef({ x: 0, y: 0 });

function handlePointerDown(e: React.PointerEvent) {
  // Middle mouse button OR hand tool
  if (e.button === 1 || currentTool === 'hand') {
    isPanningRef.current = true;
    lastPanPosRef.current = { x: e.clientX, y: e.clientY };
  }
}

function handlePointerMove(e: React.PointerEvent) {
  if (isPanningRef.current) {
    const dx = e.clientX - lastPanPosRef.current.x;
    const dy = e.clientY - lastPanPosRef.current.y;
    
    setCamera(prev => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
    }));
    
    lastPanPosRef.current = { x: e.clientX, y: e.clientY };
  }
}

function handlePointerUp() {
  isPanningRef.current = false;
}
```

## Zooming (Scroll Wheel)

The trick: zoom **toward the mouse position**, not the center.

```typescript
function handleWheel(e: React.WheelEvent) {
  e.preventDefault();
  
  const canvas = canvasRef.current;
  if (!canvas) return;
  
  // Get mouse position
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  // Calculate zoom
  const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
  const newZoom = Math.max(0.1, Math.min(5, camera.zoom * zoomFactor));
  
  // Zoom toward mouse position (the magic formula!)
  const newX = mouseX - (mouseX - camera.x) * (newZoom / camera.zoom);
  const newY = mouseY - (mouseY - camera.y) * (newZoom / camera.zoom);
  
  setCamera({ x: newX, y: newY, zoom: newZoom });
}
```

## Grid with Camera

Update grid to account for camera:

```typescript
function drawGrid(
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number, 
  camera: Camera
) {
  const gridSize = 40;
  
  // Offset grid by camera position
  const offsetX = camera.x % (gridSize * camera.zoom);
  const offsetY = camera.y % (gridSize * camera.zoom);
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  
  for (let x = offsetX; x < width; x += gridSize * camera.zoom) {
    for (let y = offsetY; y < height; y += gridSize * camera.zoom) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
```

---

**Prev:** [Step 2: Canvas Basics](./02-canvas-basics.md)  
**Next:** [Step 4: Drawing with RoughJS](./04-roughjs.md)

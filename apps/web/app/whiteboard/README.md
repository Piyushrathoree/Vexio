# 🎨 Building a Whiteboard from Scratch

A step-by-step guide to building a real-time collaborative whiteboard like tldraw, excalidraw, or Figma's FigJam.

---

## 📚 Learning Resources

### Core Technologies

| Technology | What You'll Learn | Documentation |
|------------|-------------------|---------------|
| **HTML5 Canvas API** | Drawing, transforms, paths | [MDN Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial) |
| **Pointer Events** | Mouse, touch, stylus input | [MDN Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) |
| **requestAnimationFrame** | 60fps render loop | [MDN RAF Guide](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) |
| **WebSocket API** | Real-time sync | [MDN WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) |
| **React + Next.js** | UI framework | [Next.js Docs](https://nextjs.org/docs) |

### Deep Dives

- 📖 [Canvas Performance Tips](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)
- 📖 [Coordinate Systems & Transforms](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/transform)
- 📖 [Bezier Curves for Smooth Lines](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/bezierCurveTo)
- 📖 [Hit Testing Algorithms](https://www.redblobgames.com/articles/visibility/)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     WHITEBOARD APP                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Canvas    │  │   Toolbar   │  │   State Manager     │ │
│  │  (Render)   │◄─┤   (Tools)   │  │   (Elements)        │ │
│  └──────▲──────┘  └─────────────┘  └──────────▲──────────┘ │
│         │                                      │            │
│  ┌──────┴──────────────────────────────────────┴──────────┐ │
│  │                    Event Handlers                      │ │
│  │         (pointerdown, pointermove, pointerup)          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND SERVICES                        │
├──────────────────────────┬──────────────────────────────────┤
│     WebSocket Server     │        HTTP Server               │
│   (Real-time broadcast)  │      (Save/Load data)            │
└──────────────────────────┴──────────────────────────────────┘
```

---

## 🛠️ Step-by-Step Implementation

### Step 1: Canvas Setup

**Goal**: Get a canvas element rendering in React/Next.js

**Key Concepts**:
- `useRef` to access the canvas DOM element
- `getContext('2d')` to get the drawing API
- Handle DPI for crisp rendering on retina displays

```typescript
// Get the 2D drawing context
const canvas = canvasRef.current;
const ctx = canvas.getContext('2d');
```

📖 [MDN: Canvas basic usage](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Basic_usage)

---

### Step 2: Render Loop

**Goal**: Continuously redraw the canvas at 60fps

**Key Concepts**:
- `requestAnimationFrame` for smooth animation
- Clear → Draw pattern
- Game loop architecture

```typescript
function render() {
    ctx.clearRect(0, 0, width, height);  // Clear
    drawBackground();                      // Draw background
    drawElements();                        // Draw all shapes
    requestAnimationFrame(render);         // Schedule next frame
}
```

📖 [MDN: Animations](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Basic_animations)

---

### Step 3: Freehand Drawing

**Goal**: Draw with mouse/touch/stylus

**Key Concepts**:
- Pointer events (unified mouse + touch)
- Track drawing state
- Store points in an array
- Render as a path

```typescript
canvas.addEventListener('pointerdown', (e) => {
    isDrawing = true;
    path = [{ x: e.offsetX, y: e.offsetY }];
});

canvas.addEventListener('pointermove', (e) => {
    if (isDrawing) {
        path.push({ x: e.offsetX, y: e.offsetY });
    }
});

canvas.addEventListener('pointerup', () => {
    isDrawing = false;
    savePathAsElement(path);
});
```

📖 [MDN: Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)

---

### Step 4: Camera System (Pan & Zoom)

**Goal**: Create an infinite canvas with pan/zoom

**Key Concepts**:
- Screen coordinates vs World coordinates
- Camera transform (translate + scale)
- Zoom toward mouse position

```typescript
// The camera offset and zoom
const camera = { x: 0, y: 0, zoom: 1 };

// Convert screen position to world position
function screenToWorld(screenX, screenY) {
    return {
        x: (screenX - camera.x) / camera.zoom,
        y: (screenY - camera.y) / camera.zoom
    };
}

// Apply camera in render
ctx.translate(camera.x, camera.y);
ctx.scale(camera.zoom, camera.zoom);
```

📖 [MDN: Transformations](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/transform)

---

### Step 5: Shape Tools

**Goal**: Add rectangle, ellipse, line tools

**Key Concepts**:
- Tool state machine
- Preview while dragging
- Calculate bounding box from start/end points

```typescript
// Drawing a rectangle
ctx.fillRect(x, y, width, height);

// Drawing an ellipse
ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);

// Drawing a line
ctx.moveTo(x1, y1);
ctx.lineTo(x2, y2);
ctx.stroke();
```

📖 [MDN: Drawing shapes](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes)

---

### Step 6: Selection & Manipulation

**Goal**: Click to select, drag to move

**Key Concepts**:
- Hit testing (is point inside shape?)
- Bounding box calculation
- Transform handles

```typescript
// Hit test for rectangle
function isPointInRect(px, py, rect) {
    return px >= rect.x && px <= rect.x + rect.width &&
           py >= rect.y && py <= rect.y + rect.height;
}
```

📖 [Point in polygon algorithms](https://en.wikipedia.org/wiki/Point_in_polygon)

---

### Step 7: WebSocket Sync

**Goal**: Real-time collaboration

**Key Concepts**:
- WebSocket connection
- Message protocol
- Broadcast to room
- Optimistic updates

```typescript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:8080');

// Send element to server
ws.send(JSON.stringify({
    type: 'element_add',
    roomId: 1,
    element: newElement
}));

// Receive from server
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'element_add') {
        elements.push(data.element);
    }
};
```

📖 [MDN: WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

---

## 📁 File Structure

```
app/whiteboard/
├── [roomId]/
│   └── page.tsx         # Room page (entry point)
├── page.tsx             # Index (redirects to room)
├── components/
│   └── Canvas.tsx       # Main canvas component
├── core/
│   └── types.ts         # TypeScript types
└── hooks/
    └── useWhiteboardSync.ts  # WebSocket hook (later)
```

---

## 🔗 Inspiration & References

- [tldraw](https://github.com/tldraw/tldraw) - Open source whiteboard
- [excalidraw](https://github.com/excalidraw/excalidraw) - Sketch-style whiteboard
- [perfect-freehand](https://github.com/steveruizok/perfect-freehand) - Smooth stroke algorithm
- [roughjs](https://roughjs.com/) - Hand-drawn style graphics

---

## 🚀 Run the Whiteboard

```bash
# Start the dev server
cd apps/web
bun run dev

# Open in browser
open http://localhost:3001/whiteboard/1
```

---

## 📝 Current Progress

- ✅ Phase 1: Project Setup
- ✅ Phase 2: Render Loop
- ✅ Phase 3: Freehand Drawing
- ✅ Phase 4: Pan & Zoom
- 🔄 Phase 5: Shape Tools
- ⏳ Phase 6: Selection
- ⏳ Phase 7: Premium UI
- ⏳ Phase 8: WebSocket Sync

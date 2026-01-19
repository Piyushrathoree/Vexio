# Step 4: Drawing with RoughJS

RoughJS gives shapes a **hand-drawn, sketchy look** like Excalidraw.

## Install

```bash
bun add roughjs
```

## Basic Usage

```typescript
import rough from 'roughjs';

// Create rough canvas wrapper
const rc = rough.canvas(canvasElement);

// Draw a sketchy rectangle
rc.rectangle(10, 10, 200, 100, {
  stroke: '#000',
  strokeWidth: 2,
  fill: '#82c8e5',
  fillStyle: 'solid',
  roughness: 1, // 0 = smooth, 1+ = sketchy
});

// Draw a sketchy ellipse
rc.ellipse(150, 150, 200, 100, {
  stroke: '#e63946',
  fill: '#ffd166',
});

// Draw a sketchy line
rc.line(0, 0, 200, 200, {
  stroke: '#2a9d8f',
  strokeWidth: 3,
});
```

## Create `core/renderer.ts`

```typescript
import rough from 'roughjs';
import type { WhiteboardElement } from './types';

export function drawElement(
  ctx: CanvasRenderingContext2D,
  element: WhiteboardElement,
  roughCanvas: ReturnType<typeof rough.canvas>
) {
  // RoughJS options from element
  const options = {
    stroke: element.stroke,
    strokeWidth: element.strokeWidth,
    fill: element.fill === 'transparent' ? undefined : element.fill,
    fillStyle: 'solid' as const,
    roughness: element.roughness ?? 1,
  };

  switch (element.type) {
    // ========================================
    // RECTANGLE
    // ========================================
    case 'rectangle':
      roughCanvas.rectangle(
        element.x,
        element.y,
        element.width,
        element.height,
        options
      );
      break;

    // ========================================
    // ELLIPSE
    // ========================================
    case 'ellipse':
      roughCanvas.ellipse(
        element.x + element.width / 2,  // center X
        element.y + element.height / 2, // center Y
        element.width,
        element.height,
        options
      );
      break;

    // ========================================
    // LINE
    // ========================================
    case 'line':
      roughCanvas.line(
        element.x,
        element.y,
        element.endX,
        element.endY,
        options
      );
      break;

    // ========================================
    // ARROW
    // ========================================
    case 'arrow':
      // Draw line part
      roughCanvas.line(
        element.x,
        element.y,
        element.endX,
        element.endY,
        options
      );
      // Draw arrowhead
      drawArrowhead(
        ctx, 
        element.x, element.y, 
        element.endX, element.endY, 
        element.stroke
      );
      break;

    // ========================================
    // PATH (Freehand - use native canvas)
    // ========================================
    case 'path':
      if (element.points.length < 2) return;
      
      ctx.save();
      ctx.strokeStyle = element.stroke;
      ctx.lineWidth = element.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(element.points[0].x, element.points[0].y);
      
      for (let i = 1; i < element.points.length; i++) {
        ctx.lineTo(element.points[i].x, element.points[i].y);
      }
      
      ctx.stroke();
      ctx.restore();
      break;

    // ========================================
    // TEXT
    // ========================================
    case 'text':
      ctx.save();
      ctx.font = `${element.fontSize}px ${element.fontFamily}`;
      ctx.fillStyle = element.stroke;
      ctx.fillText(element.text, element.x, element.y);
      ctx.restore();
      break;
  }
}

// Helper: Draw arrowhead
function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  color: string
) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLength = 15;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLength * Math.cos(angle - Math.PI / 6),
    y2 - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    x2 - headLength * Math.cos(angle + Math.PI / 6),
    y2 - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}
```

## Use in Render Loop

```typescript
import rough from 'roughjs';
import { drawElement } from '../core/renderer';

function render() {
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  const rc = rough.canvas(canvas);  // Create rough canvas
  
  // Clear
  ctx.clearRect(0, 0, width, height);
  
  // Apply camera
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);
  
  // Draw elements with RoughJS
  for (const element of elements) {
    drawElement(ctx, element, rc);
  }
  
  ctx.restore();
  
  requestAnimationFrame(render);
}
```

## Roughness Levels

| Value | Effect |
|-------|--------|
| 0 | Smooth lines |
| 1 | Slight roughness (default) |
| 2+ | Very sketchy |

```typescript
// Smooth
{ roughness: 0 }

// Natural hand-drawn
{ roughness: 1 }

// Very rough
{ roughness: 2.5 }
```

---

**Prev:** [Step 3: Camera](./03-camera.md)  
**Next:** [Step 5: Tool Implementation](./05-tools.md)

# Step 2: Canvas Basics

## The Core Concepts

1. **Canvas Ref** - React needs a ref to access the DOM element
2. **2D Context** - The API for drawing
3. **Render Loop** - Continuously redraw at 60fps
4. **DPI Handling** - Make canvas crisp on retina displays

## Basic Canvas Component

```tsx
'use client';

import { useRef, useEffect, useCallback } from 'react';

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);

  // THE RENDER LOOP
  // This runs ~60 times per second
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // 1. Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // 2. Draw background
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, width, height);
    
    // 3. Draw grid
    drawGrid(ctx, width, height);
    
    // 4. Draw elements (we'll add this later)
    // for (const el of elements) { drawElement(ctx, el); }
    
    // 5. Request next frame
    animationFrameRef.current = requestAnimationFrame(render);
  }, []);

  // Handle canvas resize and DPI
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      
      // Device pixel ratio (2 on retina displays)
      const dpr = window.devicePixelRatio || 1;
      const rect = parent.getBoundingClientRect();
      
      // Set canvas size (multiply by DPR for sharpness)
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      // Set display size
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      // Scale context to account for DPR
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Start the render loop
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full touch-none cursor-crosshair"
    />
  );
}

// Draw a dot grid background
function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gridSize = 40;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  
  for (let x = 0; x < width; x += gridSize) {
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
```

## Key Concepts Explained

### Why `requestAnimationFrame`?

```typescript
// BAD: Blocks the thread, can't be interrupted
while (true) { draw(); }

// GOOD: Browser schedules it optimally at 60fps
function render() {
  draw();
  requestAnimationFrame(render);
}
```

### Why Handle DPI?

On a 2x retina display, if you don't handle DPI:
- Canvas looks blurry
- 1 CSS pixel = 2 device pixels

Fix: Make canvas 2x bigger, then scale it down with CSS.

### The Clear → Draw Pattern

Every frame, we:
1. Clear everything
2. Draw background
3. Draw all elements
4. Draw UI overlays

This is the same pattern games use!

---

**Prev:** [Step 1: Types](./01-types.md)  
**Next:** [Step 3: Camera System](./03-camera.md)

# Step 4: Drawing with RoughJS

RoughJS gives shapes a **hand-drawn, sketchy look**.

## Install

```bash
bun add roughjs
```

## Create `core/renderer.ts`

```typescript
import rough from 'roughjs';
import type { WhiteboardElement } from './types';

export function drawElement(
  ctx: CanvasRenderingContext2D,
  el: WhiteboardElement,
  rc: ReturnType<typeof rough.canvas>
) {
  const opts = {
    stroke: el.stroke,
    strokeWidth: el.strokeWidth,
    fill: el.fill === 'transparent' ? undefined : el.fill,
    fillStyle: 'solid' as const,
    roughness: el.roughness ?? 1,
  };

  // Apply rotation if set
  if (el.rotation) {
    ctx.save();
    const cx = el.x + ('width' in el ? el.width / 2 : 0);
    const cy = el.y + ('height' in el ? el.height / 2 : 0);
    ctx.translate(cx, cy);
    ctx.rotate((el.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }

  switch (el.type) {
    case 'rectangle':
      if (el.borderRadius && el.borderRadius > 0) {
        // Rounded rectangle (native canvas)
        ctx.beginPath();
        ctx.roundRect(el.x, el.y, el.width, el.height, el.borderRadius);
        if (el.fill !== 'transparent') { ctx.fillStyle = el.fill; ctx.fill(); }
        ctx.strokeStyle = el.stroke; ctx.lineWidth = el.strokeWidth; ctx.stroke();
      } else {
        rc.rectangle(el.x, el.y, el.width, el.height, opts);
      }
      break;

    case 'ellipse':
      rc.ellipse(el.x + el.width/2, el.y + el.height/2, el.width, el.height, opts);
      break;

    case 'circle':
      // x,y is CENTER for circle
      rc.circle(el.x, el.y, el.radius * 2, opts);
      break;

    case 'diamond':
      const points = [
        [el.x + el.width/2, el.y],              // top
        [el.x + el.width, el.y + el.height/2],  // right
        [el.x + el.width/2, el.y + el.height],  // bottom
        [el.x, el.y + el.height/2],             // left
      ];
      rc.polygon(points as [number, number][], opts);
      break;

    case 'line':
      rc.line(el.x, el.y, el.endX, el.endY, opts);
      break;

    case 'arrow':
      rc.line(el.x, el.y, el.endX, el.endY, opts);
      drawArrowhead(ctx, el.x, el.y, el.endX, el.endY, el.stroke, el.arrowHeadEnd);
      if (el.arrowHeadStart && el.arrowHeadStart !== 'none') {
        drawArrowhead(ctx, el.endX, el.endY, el.x, el.y, el.stroke, el.arrowHeadStart);
      }
      break;

    case 'path':
      if (el.points.length < 2) break;
      ctx.save();
      ctx.strokeStyle = el.stroke;
      ctx.lineWidth = el.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(el.points[0].x, el.points[0].y);
      for (let i = 1; i < el.points.length; i++) {
        ctx.lineTo(el.points[i].x, el.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
      break;

    case 'text':
      ctx.save();
      ctx.font = `${el.fontSize}px ${el.fontFamily}`;
      ctx.fillStyle = el.stroke;
      ctx.textAlign = el.textAlign || 'left';
      ctx.fillText(el.text, el.x, el.y);
      ctx.restore();
      break;

    case 'sticky':
      // Draw sticky note background
      ctx.save();
      ctx.fillStyle = el.fill || '#fef08a';
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      ctx.fillRect(el.x, el.y, el.width, el.height);
      ctx.restore();
      // Draw text
      ctx.fillStyle = el.stroke;
      ctx.font = `${el.fontSize}px ${el.fontFamily}`;
      ctx.fillText(el.text, el.x + 10, el.y + el.fontSize + 10);
      break;
  }

  if (el.rotation) ctx.restore();
}

function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  color: string, style?: string
) {
  if (!style || style === 'none') return;
  
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const len = 15;

  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;

  switch (style) {
    case 'arrow':
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - len * Math.cos(angle - Math.PI/6), y2 - len * Math.sin(angle - Math.PI/6));
      ctx.lineTo(x2 - len * Math.cos(angle + Math.PI/6), y2 - len * Math.sin(angle + Math.PI/6));
      ctx.closePath();
      ctx.fill();
      break;
    case 'dot':
      ctx.beginPath();
      ctx.arc(x2, y2, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'bar':
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x2 - 8 * Math.cos(angle + Math.PI/2), y2 - 8 * Math.sin(angle + Math.PI/2));
      ctx.lineTo(x2 + 8 * Math.cos(angle + Math.PI/2), y2 + 8 * Math.sin(angle + Math.PI/2));
      ctx.stroke();
      break;
  }
  ctx.restore();
}
```

---

**Prev:** [Step 3: Camera](./03-camera.md)  
**Next:** [Step 5: Tools](./05-tools.md)

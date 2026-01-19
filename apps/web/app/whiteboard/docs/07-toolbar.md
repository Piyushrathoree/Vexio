# Step 7: Toolbar UI

A premium glassmorphism toolbar with Tailwind CSS.

## Create `components/Toolbar.tsx`

```tsx
'use client';

import type { Tool } from '../core/types';

interface ToolbarProps {
  currentTool: Tool;
  setCurrentTool: (tool: Tool) => void;
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  fillColor: string;
  setFillColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  zoom: number;
}

const tools: { id: Tool; icon: string; key: string }[] = [
  { id: 'select', icon: '↖', key: 'V' },
  { id: 'hand', icon: '✋', key: 'H' },
  { id: 'pen', icon: '✏️', key: 'P' },
  { id: 'eraser', icon: '🧹', key: 'E' },
  { id: 'rectangle', icon: '▢', key: 'R' },
  { id: 'ellipse', icon: '⬭', key: 'O' },
  { id: 'line', icon: '╱', key: 'L' },
  { id: 'arrow', icon: '→', key: 'A' },
  { id: 'text', icon: 'T', key: 'T' },
];

export default function Toolbar(props: ToolbarProps) {
  const { currentTool, setCurrentTool, strokeColor, setStrokeColor,
          fillColor, setFillColor, strokeWidth, setStrokeWidth, zoom } = props;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50
      flex items-center gap-2 px-4 py-3 bg-white/10 backdrop-blur-xl
      border border-white/20 rounded-2xl shadow-2xl">
      
      {tools.map((t) => (
        <button key={t.id} onClick={() => setCurrentTool(t.id)}
          title={`${t.id} (${t.key})`}
          className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center
            transition-all ${currentTool === t.id
              ? 'bg-indigo-500 text-white scale-110'
              : 'text-slate-400 hover:bg-white/10'}`}>
          {t.icon}
        </button>
      ))}

      <div className="w-px h-8 bg-white/20 mx-2" />

      <input type="color" value={strokeColor}
        onChange={(e) => setStrokeColor(e.target.value)}
        className="w-8 h-8 rounded-lg cursor-pointer" title="Stroke" />

      <input type="color" value={fillColor === 'transparent' ? '#fff' : fillColor}
        onChange={(e) => setFillColor(e.target.value)}
        className="w-8 h-8 rounded-lg cursor-pointer" title="Fill" />

      <input type="range" min="1" max="20" value={strokeWidth}
        onChange={(e) => setStrokeWidth(Number(e.target.value))}
        className="w-20 accent-indigo-500" />

      <span className="text-slate-400 text-sm">{Math.round(zoom * 100)}%</span>
    </div>
  );
}
```

---

**Prev:** [Step 6: Selection](./06-selection.md)  
**Next:** [Step 8: WebSocket Sync](./08-websocket.md)

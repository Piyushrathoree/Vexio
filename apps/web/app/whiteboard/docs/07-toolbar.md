# Step 7: Toolbar UI

Premium toolbar with all tools.

## `components/Toolbar.tsx`

```tsx
'use client';
import type { Tool } from '../core/types';

const tools: { id: Tool; icon: string; key: string }[] = [
  { id: 'select', icon: '↖', key: 'V' },
  { id: 'hand', icon: '✋', key: 'H' },
  { id: 'pen', icon: '✏️', key: 'P' },
  { id: 'eraser', icon: '🧹', key: 'E' },
  { id: 'rectangle', icon: '▢', key: 'R' },
  { id: 'ellipse', icon: '⬭', key: 'O' },
  { id: 'circle', icon: '○', key: 'C' },
  { id: 'diamond', icon: '◇', key: 'D' },
  { id: 'line', icon: '╱', key: 'L' },
  { id: 'arrow', icon: '→', key: 'A' },
  { id: 'text', icon: 'T', key: 'T' },
  { id: 'sticky', icon: '📝', key: 'S' },
];

interface Props {
  currentTool: Tool;
  setCurrentTool: (t: Tool) => void;
  strokeColor: string;
  setStrokeColor: (c: string) => void;
  fillColor: string;
  setFillColor: (c: string) => void;
  strokeWidth: number;
  setStrokeWidth: (w: number) => void;
  zoom: number;
}

export default function Toolbar(props: Props) {
  const { currentTool, setCurrentTool, strokeColor, setStrokeColor,
          fillColor, setFillColor, strokeWidth, setStrokeWidth, zoom } = props;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50
      flex items-center gap-1 px-3 py-2 bg-white/10 backdrop-blur-xl
      border border-white/20 rounded-2xl shadow-2xl">

      {tools.map(t => (
        <button key={t.id} onClick={() => setCurrentTool(t.id)}
          title={`${t.id} (${t.key})`}
          className={`w-9 h-9 rounded-lg text-base flex items-center justify-center
            transition-all ${currentTool === t.id
              ? 'bg-indigo-500 text-white scale-110'
              : 'text-slate-400 hover:bg-white/10'}`}>
          {t.icon}
        </button>
      ))}

      <div className="w-px h-6 bg-white/20 mx-1" />

      <input type="color" value={strokeColor}
        onChange={e => setStrokeColor(e.target.value)}
        className="w-7 h-7 rounded cursor-pointer" title="Stroke" />

      <input type="color" value={fillColor === 'transparent' ? '#ffffff' : fillColor}
        onChange={e => setFillColor(e.target.value)}
        className="w-7 h-7 rounded cursor-pointer" title="Fill" />

      <button onClick={() => setFillColor(fillColor === 'transparent' ? '#ffffff' : 'transparent')}
        className={`w-7 h-7 rounded text-xs ${fillColor === 'transparent' ? 'text-indigo-400' : 'text-slate-400'}`}>
        ∅
      </button>

      <div className="w-px h-6 bg-white/20 mx-1" />

      <input type="range" min="1" max="20" value={strokeWidth}
        onChange={e => setStrokeWidth(Number(e.target.value))}
        className="w-16 accent-indigo-500" />

      <span className="text-slate-400 text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
    </div>
  );
}
```

## Keyboard Shortcuts

```typescript
useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return;
    const map: Record<string, Tool> = {
      v: 'select', h: 'hand', p: 'pen', e: 'eraser',
      r: 'rectangle', o: 'ellipse', c: 'circle', d: 'diamond',
      l: 'line', a: 'arrow', t: 'text', s: 'sticky',
    };
    const tool = map[e.key.toLowerCase()];
    if (tool) setCurrentTool(tool);
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, []);
```

---

**Prev:** [Step 6: Selection](./06-selection.md)  
**Next:** [Step 8: WebSocket](./08-websocket.md)

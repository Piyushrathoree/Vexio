# 🎨 Building a Whiteboard from Scratch

A step-by-step guide to building a collaborative whiteboard with RoughJS.

---

## 📁 Documentation

| Step | Topic | Link |
|------|-------|------|
| 0 | [Setup & Installation](./docs/00-setup.md) | Install dependencies |
| 1 | [Types & Data Model](./docs/01-types.md) | Element types, tools, camera |
| 2 | [Canvas Basics](./docs/02-canvas-basics.md) | Render loop, DPI handling |
| 3 | [Camera System](./docs/03-camera.md) | Pan & zoom |
| 4 | [Drawing with RoughJS](./docs/04-roughjs.md) | Sketchy shapes |
| 5 | [Tool Implementation](./docs/05-tools.md) | Pen, shapes, eraser |
| 6 | [Selection System](./docs/06-selection.md) | Hit testing, move, delete |
| 7 | [Toolbar UI](./docs/07-toolbar.md) | Premium toolbar with Tailwind |
| 8 | [WebSocket Sync](./docs/08-websocket.md) | Real-time collaboration |

---

## 📁 File Structure

```
app/whiteboard/
├── [roomId]/page.tsx      # Room entry
├── page.tsx               # Index redirect
├── components/
│   ├── Canvas.tsx         # Main canvas
│   └── Toolbar.tsx        # Tool buttons
├── core/
│   ├── types.ts           # TypeScript types
│   ├── renderer.ts        # RoughJS drawing
│   └── hitTest.ts         # Click detection
├── hooks/
│   └── useWhiteboardSync.ts
└── docs/                  # This guide!
```

---

## 🚀 Quick Start

```bash
cd apps/web
bun add roughjs
bun run dev
# Open http://localhost:3001/whiteboard/1
```

---

## ⌨️ Keyboard Shortcuts

| Key | Tool |
|-----|------|
| V | Select |
| H | Hand (pan) |
| P | Pen |
| E | Eraser |
| R | Rectangle |
| O | Ellipse |
| L | Line |
| A | Arrow |
| T | Text |
| Backspace | Delete selected |

---

## 🔗 Resources

- [RoughJS](https://roughjs.com/)
- [MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Excalidraw](https://github.com/excalidraw/excalidraw)

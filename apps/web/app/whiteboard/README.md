# 🎨 Building a Whiteboard from Scratch

A step-by-step guide to building a collaborative whiteboard with RoughJS.

---

## 📁 Documentation

| Step | Topic |
|------|-------|
| [00-setup](./docs/00-setup.md) | Install & file structure |
| [01-types](./docs/01-types.md) | Types & data model |
| [02-canvas-basics](./docs/02-canvas-basics.md) | Render loop |
| [03-camera](./docs/03-camera.md) | Pan & zoom |
| [04-roughjs](./docs/04-roughjs.md) | Sketchy shapes |
| [05-tools](./docs/05-tools.md) | All tools |
| [06-selection](./docs/06-selection.md) | Hit testing |
| [07-toolbar](./docs/07-toolbar.md) | UI |
| [08-websocket](./docs/08-websocket.md) | Real-time sync |

---

## 🛠️ Tools

| Key | Tool | Key | Tool |
|-----|------|-----|------|
| V | Select | C | Circle |
| H | Hand | D | Diamond |
| P | Pen | L | Line |
| E | Eraser | A | Arrow |
| R | Rectangle | T | Text |
| O | Ellipse | S | Sticky |

---

## 🚀 Quick Start

```bash
cd apps/web
bun add roughjs
bun run dev
# http://localhost:3001/whiteboard/1
```

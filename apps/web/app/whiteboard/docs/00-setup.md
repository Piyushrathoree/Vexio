# Step 0: Setup & Installation

## Install RoughJS

```bash
cd apps/web
bun add roughjs
```

## File Structure to Create

Create these folders and files:

```bash
mkdir -p app/whiteboard/core
mkdir -p app/whiteboard/components
mkdir -p app/whiteboard/hooks
```

```
app/whiteboard/
├── [roomId]/
│   └── page.tsx           # Room page
├── page.tsx               # Index (redirect)
├── components/
│   ├── Canvas.tsx         # Main canvas
│   └── Toolbar.tsx        # Tool bar
├── core/
│   ├── types.ts           # Type definitions
│   ├── renderer.ts        # Drawing logic
│   └── hitTest.ts         # Click detection
└── hooks/
    └── useWhiteboardSync.ts  # WebSocket
```

## Create the Pages

### `app/whiteboard/page.tsx`

```tsx
import { redirect } from 'next/navigation';
export default async function WhiteboardIndexPage() {
  // Call your HTTP server to create a new room
  const response = await fetch('http://localhost:8000/api/v1/room', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  const { roomId } = await response.json();
  
  redirect(`/whiteboard/${roomId}`);
}
```

### `app/whiteboard/[roomId]/page.tsx`

```tsx
import Canvas from '../components/Canvas';

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default async function WhiteboardPage({ params }: PageProps) {
  const { roomId } = await params;
  
  return (
    <main className="w-screen h-screen overflow-hidden bg-slate-900">
      <Canvas roomId={roomId} />
    </main>
  );
}
```

---

**Next:** [Step 1: Types & Data Model](./01-types.md)

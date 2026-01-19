# Step 8: WebSocket Sync

Real-time collaboration with your existing WebSocket server.

## Message Protocol

```typescript
// Client → Server
{ type: "join_room", roomId: number }
{ type: "element_add", roomId: number, element: Element }
{ type: "element_update", roomId: number, element: Element }
{ type: "element_delete", roomId: number, elementId: string }

// Server → Client (broadcast)
{ type: "element_add", element: Element, userId: string }
{ type: "element_update", element: Element }
{ type: "element_delete", elementId: string }
```

## Create `hooks/useWhiteboardSync.ts`

```typescript
'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { WhiteboardElement } from '../core/types';

interface Props {
  roomId: string;
  onElementAdd: (el: WhiteboardElement) => void;
  onElementUpdate: (el: WhiteboardElement) => void;
  onElementDelete: (id: string) => void;
}

export function useWhiteboardSync({
  roomId, onElementAdd, onElementUpdate, onElementDelete
}: Props) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    const ws = new WebSocket(`ws://localhost:8080?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join_room', roomId: Number(roomId) }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'element_add') onElementAdd(data.element);
      if (data.type === 'element_update') onElementUpdate(data.element);
      if (data.type === 'element_delete') onElementDelete(data.elementId);
    };

    return () => ws.close();
  }, [roomId, onElementAdd, onElementUpdate, onElementDelete]);

  const sendElement = useCallback((element: WhiteboardElement) => {
    wsRef.current?.send(JSON.stringify({
      type: 'element_add', roomId: Number(roomId), element
    }));
  }, [roomId]);

  const deleteElement = useCallback((elementId: string) => {
    wsRef.current?.send(JSON.stringify({
      type: 'element_delete', roomId: Number(roomId), elementId
    }));
  }, [roomId]);

  return { sendElement, deleteElement };
}
```

## Update WS Server

Add to `ws-server/index.ts`:

```typescript
if (parsedData.type === "element_add") {
  broadcastToRoom(Number(parsedData.roomId), JSON.stringify(parsedData), Users);
}

if (parsedData.type === "element_delete") {
  broadcastToRoom(Number(parsedData.roomId), JSON.stringify(parsedData), Users);
}
```

## Use in Canvas

```typescript
const { sendElement, deleteElement } = useWhiteboardSync({
  roomId,
  onElementAdd: (el) => setElements(prev => [...prev, el]),
  onElementUpdate: (el) => setElements(prev => 
    prev.map(e => e.id === el.id ? el : e)),
  onElementDelete: (id) => setElements(prev => 
    prev.filter(e => e.id !== id)),
});

// When creating element:
const newEl = { ... };
setElements(prev => [...prev, newEl]);
sendElement(newEl);  // Broadcast to others
```

---

**Prev:** [Step 7: Toolbar](./07-toolbar.md)  
**Done!** 🎉

"use client";

import type { ClientMessage } from "./whiteboard-socket";

// Offline outbox: while the socket is closed we persist outgoing element ops
// (add/update/delete) to localStorage keyed per slug, then flush them in order
// once the socket reconnects and the room_state snapshot has arrived.
//
// Only durable element mutations are queued here — ephemeral messages
// (cursor/selection/join/leave) are intentionally never persisted.

export type OutboxMessage = Extract<
    ClientMessage,
    { type: "element_add" } | { type: "element_update" } | { type: "element_delete" }
>;

const OUTBOX_PREFIX = "whiteboard-outbox:";
// Hard cap so a long offline session can't blow out localStorage. When the cap
// is hit we drop the OLDEST op — coalescing (below) keeps drags from ever
// filling this in practice.
const MAX_OUTBOX = 500;

const outboxKey = (slug: string) => `${OUTBOX_PREFIX}${slug}`;

const elementId = (msg: OutboxMessage): string | null => {
    if (msg.type === "element_delete") return msg.elementId;
    const el = msg.element as { id?: unknown } | null;
    return el && typeof el.id === "string" ? el.id : null;
};

export const loadOutbox = (slug: string): OutboxMessage[] => {
    if (!slug || typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(outboxKey(slug));
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as OutboxMessage[]) : [];
    } catch {
        return [];
    }
};

const writeOutbox = (slug: string, queue: OutboxMessage[]) => {
    if (typeof window === "undefined") return;
    try {
        if (queue.length === 0) {
            localStorage.removeItem(outboxKey(slug));
        } else {
            localStorage.setItem(outboxKey(slug), JSON.stringify(queue));
        }
    } catch {
        // storage full / disabled — nothing we can safely do, drop silently.
    }
};

// Append an op, coalescing consecutive element_update ops for the same element
// id so a drag (hundreds of updates) collapses to a single trailing op. Adds
// and deletes are always appended to preserve ordering/causality.
export const enqueueOutbox = (slug: string, msg: OutboxMessage) => {
    if (!slug || typeof window === "undefined") return;
    const queue = loadOutbox(slug);

    if (msg.type === "element_update") {
        const id = elementId(msg);
        // Replace the last op for this id if it is also an update (coalesce).
        for (let i = queue.length - 1; i >= 0; i--) {
            const prev = queue[i];
            if (!prev) continue;
            if (elementId(prev) !== id) continue;
            if (prev.type === "element_update") {
                queue[i] = msg;
                writeOutbox(slug, queue);
                return;
            }
            // Hit an add/delete for this id first — must keep ordering.
            break;
        }
    }

    queue.push(msg);
    while (queue.length > MAX_OUTBOX) queue.shift();
    writeOutbox(slug, queue);
};

export const clearOutbox = (slug: string) => {
    if (!slug || typeof window === "undefined") return;
    try {
        localStorage.removeItem(outboxKey(slug));
    } catch {
        // ignore
    }
};

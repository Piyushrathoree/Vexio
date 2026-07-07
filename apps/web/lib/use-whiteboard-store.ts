"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DrawingElement } from "./types";
import { getBearerToken } from "./auth-client";
import {
    buildWhiteboardSocketUrl,
    normalizeSlug,
    safeSend,
    WS_CLOSE_UNAUTHORIZED,
    type ServerMessage,
} from "./whiteboard-socket";
import {
    clearOutbox,
    enqueueOutbox,
    loadOutbox,
    type OutboxMessage,
} from "./whiteboard-outbox";

export type RemoteCursor = {
    userId: string;
    name: string;
    x: number;
    y: number;
};
export type RemoteSelection = {
    userId: string;
    name: string;
    elementIds: string[];
};
export type RemoteUser = { userId: string; name: string };

const storageKey = (slug: string) => `whiteboard:${slug}`;

// Trailing-send throttle windows. Local state updates stay immediate; only the
// wire traffic is coalesced to these rates.
const UPDATE_THROTTLE_MS = 33; // ~30fps for element_update while dragging
const CURSOR_THROTTLE_MS = 33; // ~30fps for cursor presence
const SELECTION_THROTTLE_MS = 60; // ~16fps for selection presence

// Reconnect / backoff tuning.
const MAX_RECONNECT_ATTEMPTS = 8;
const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

// The bearer token is written to localStorage asynchronously by better-auth
// (from the get-session response). On a freshly-loaded guarded page it may not
// be present the instant this hook mounts — poll briefly rather than bailing
// out permanently (the original blocker: the socket effect ran once, saw no
// token, and never opened once the token finally arrived).
const TOKEN_WAIT_MS = 300;
const MAX_TOKEN_WAIT_TRIES = 20; // ~6s

const loadStoredElements = (slug: string): DrawingElement[] => {
    if (!slug || typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(storageKey(slug));
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as DrawingElement[]) : [];
    } catch {
        return [];
    }
};

const elementSignature = (el: DrawingElement) => JSON.stringify(el);

const diffElements = (
    slug: string,
    prev: DrawingElement[],
    next: DrawingElement[]
): OutboxMessage[] => {
    const prevById = new Map(prev.map((el) => [el.id, el]));
    const nextById = new Map(next.map((el) => [el.id, el]));
    const messages: OutboxMessage[] = [];

    for (const el of prev) {
        if (!nextById.has(el.id)) {
            messages.push({ type: "element_delete", slug, elementId: el.id });
        }
    }

    for (const el of next) {
        const previous = prevById.get(el.id);
        if (!previous) {
            messages.push({ type: "element_add", slug, element: el });
        } else if (elementSignature(previous) !== elementSignature(el)) {
            messages.push({ type: "element_update", slug, element: el });
        }
    }

    return messages;
};

// Replay a durable op onto a local element array — used to reconcile queued
// offline ops on top of the server's room_state snapshot so the user's own
// unsynced edits are preserved instead of being wiped by the snapshot.
const applyOpToElements = (
    elements: DrawingElement[],
    op: OutboxMessage
): DrawingElement[] => {
    if (op.type === "element_delete") {
        return elements.filter((el) => el.id !== op.elementId);
    }
    const incoming = op.element as DrawingElement;
    if (!incoming || typeof incoming.id !== "string") return elements;
    return elements.some((el) => el.id === incoming.id)
        ? elements.map((el) => (el.id === incoming.id ? incoming : el))
        : [...elements, incoming];
};

export const useWhiteboardStore = (slug: string) => {
    const roomSlug = normalizeSlug(slug);

    const [elements, setElements] = useState<DrawingElement[]>(() =>
        typeof window !== "undefined" && getBearerToken()
            ? []
            : loadStoredElements(roomSlug)
    );
    const [past, setPast] = useState<DrawingElement[][]>([]);
    const [future, setFuture] = useState<DrawingElement[][]>([]);
    const [loaded, setLoaded] = useState(false);
    const [synced, setSynced] = useState(() =>
        typeof window !== "undefined" ? !getBearerToken() : true
    );
    const [connected, setConnected] = useState(false);
    const [reconnecting, setReconnecting] = useState(false);
    const [wsError, setWsError] = useState<string | null>(null);
    const [remoteUserIds, setRemoteUserIds] = useState<string[]>([]);
    const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
    const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);
    const [remoteSelections, setRemoteSelections] = useState<RemoteSelection[]>(
        []
    );

    const socketRef = useRef<WebSocket | null>(null);
    // Invoke to force an immediate manual reconnect (assigned by the socket
    // effect; exposed to the UI as `reconnect()`).
    const reconnectRef = useRef<(() => void) | null>(null);

    // Coalesced element_update state (trailing-edge send).
    const pendingUpdatesRef = useRef<Map<string, DrawingElement>>(new Map());
    const updateFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
        null
    );

    // Throttled ephemeral presence senders.
    const cursorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingCursorRef = useRef<{ x: number; y: number } | null>(null);
    const selectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
        null
    );
    const pendingSelectionRef = useRef<string[] | null>(null);

    // Route a durable op to the wire when connected, otherwise persist it to the
    // per-slug offline outbox. Anonymous (token-less) users never touch the wire
    // or the outbox — they rely on the localStorage mirror below.
    const queueOrSendOp = useCallback(
        (msg: OutboxMessage) => {
            if (!getBearerToken()) return;
            const socket = socketRef.current;
            if (socket && socket.readyState === WebSocket.OPEN) {
                safeSend(socket, msg);
            } else {
                enqueueOutbox(roomSlug, msg);
            }
        },
        [roomSlug]
    );

    // Send (or queue) the latest coalesced position for every dragged element.
    const flushPendingUpdates = useCallback(() => {
        if (updateFlushTimerRef.current) {
            clearTimeout(updateFlushTimerRef.current);
            updateFlushTimerRef.current = null;
        }
        const pending = pendingUpdatesRef.current;
        if (pending.size === 0) return;
        for (const el of pending.values()) {
            queueOrSendOp({
                type: "element_update",
                slug: roomSlug,
                element: el,
            });
        }
        pending.clear();
    }, [queueOrSendOp, roomSlug]);

    useEffect(() => {
        const authed = !!getBearerToken();
        setLoaded(false);
        setPast([]);
        setFuture([]);
        setSynced(!authed);
        setWsError(null);
        setRemoteUserIds([]);
        setRemoteUsers([]);
        setRemoteCursors([]);
        setRemoteSelections([]);
        setElements(authed ? [] : loadStoredElements(roomSlug));
        setLoaded(true);
    }, [roomSlug]);

    // Anonymous (token-less) localStorage mirror — unchanged behavior.
    useEffect(() => {
        if (!loaded || !roomSlug) return;
        if (getBearerToken()) return;

        localStorage.setItem(storageKey(roomSlug), JSON.stringify(elements));

        const onStorage = (event: StorageEvent) => {
            if (event.key !== storageKey(roomSlug) || !event.newValue) return;
            if (getBearerToken()) return;
            try {
                const parsed = JSON.parse(event.newValue);
                if (!Array.isArray(parsed)) return;
                setElements(parsed as DrawingElement[]);
            } catch {
                // ignore
            }
        };

        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, [elements, loaded, roomSlug]);

    // Socket lifecycle: connect, reconnect (exponential backoff + jitter),
    // honor close code 4001, flush the offline outbox after room_state.
    useEffect(() => {
        if (typeof window === "undefined" || !roomSlug) return;

        let cancelled = false;
        let reconnectAttempts = 0;
        let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
        let tokenWaitTimeout: ReturnType<typeof setTimeout> | null = null;
        let tokenWaitTries = 0;

        const backoffDelay = (attempt: number) => {
            const exp = Math.min(
                MAX_RECONNECT_DELAY_MS,
                BASE_RECONNECT_DELAY_MS * 2 ** (attempt - 1)
            );
            // Full jitter avoids thundering-herd reconnect storms.
            return exp + Math.floor(Math.random() * 1000);
        };

        const clearTimers = () => {
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
                reconnectTimeout = null;
            }
            if (tokenWaitTimeout) {
                clearTimeout(tokenWaitTimeout);
                tokenWaitTimeout = null;
            }
        };

        const connect = () => {
            if (cancelled) return;

            const token = getBearerToken();
            if (!token) {
                // Token not ready yet — poll briefly, then fall back to
                // anonymous/local-only mode.
                setConnected(false);
                setReconnecting(false);
                if (tokenWaitTries < MAX_TOKEN_WAIT_TRIES) {
                    tokenWaitTries += 1;
                    tokenWaitTimeout = setTimeout(() => {
                        tokenWaitTimeout = null;
                        if (!cancelled) connect();
                    }, TOKEN_WAIT_MS);
                } else {
                    setSynced(true);
                }
                return;
            }

            setReconnecting(reconnectAttempts > 0);
            setWsError(null);

            const socket = new WebSocket(buildWhiteboardSocketUrl());
            socketRef.current = socket;

            socket.onopen = () => {
                if (cancelled) return;
                reconnectAttempts = 0;
                setConnected(true);
                setReconnecting(false);
                setWsError(null);
                safeSend(socket, { type: "join_room", slug: roomSlug });
            };

            socket.onmessage = (event) => {
                let parsed: ServerMessage;
                try {
                    parsed = JSON.parse(event.data);
                } catch {
                    return;
                }

                switch (parsed.type) {
                    case "room_state": {
                        const serverEls = Array.isArray(parsed.elements)
                            ? (parsed.elements as DrawingElement[])
                            : [];

                        // Reconcile: replay queued offline ops on top of the
                        // snapshot so unsynced local edits survive, then flush
                        // those ops to the server and clear the outbox.
                        const queued = loadOutbox(roomSlug);
                        let merged = serverEls;
                        for (const op of queued) {
                            merged = applyOpToElements(merged, op);
                        }

                        setSynced(true);
                        setWsError(null);
                        setElements(merged);
                        setPast([]);
                        setFuture([]);

                        for (const op of queued) {
                            safeSend(socketRef.current, op);
                        }
                        clearOutbox(roomSlug);
                        break;
                    }
                    case "element_add": {
                        const incoming = parsed.element as DrawingElement;
                        setElements((prev) =>
                            prev.some((item) => item.id === incoming.id)
                                ? prev
                                : [...prev, incoming]
                        );
                        break;
                    }
                    case "element_update": {
                        const incoming = parsed.element as DrawingElement;
                        setElements((prev) =>
                            prev.map((item) =>
                                item.id === incoming.id ? incoming : item
                            )
                        );
                        break;
                    }
                    case "element_delete": {
                        const { elementId } = parsed;
                        setElements((prev) =>
                            prev.filter((item) => item.id !== elementId)
                        );
                        break;
                    }
                    case "presence": {
                        const { userId, action } = parsed;
                        const name = parsed.name ?? "";
                        setRemoteUserIds((prev) => {
                            if (action === "joined") {
                                return prev.includes(userId)
                                    ? prev
                                    : [...prev, userId];
                            }
                            return prev.filter((id) => id !== userId);
                        });
                        setRemoteUsers((prev) => {
                            if (action === "joined") {
                                const existing = prev.find(
                                    (u) => u.userId === userId
                                );
                                if (!existing)
                                    return [...prev, { userId, name }];
                                // Roster stays deduped by userId; refresh a
                                // previously-unknown ("") name if we now have one.
                                return existing.name === name
                                    ? prev
                                    : prev.map((u) =>
                                          u.userId === userId
                                              ? { userId, name }
                                              : u
                                      );
                            }
                            return prev.filter((u) => u.userId !== userId);
                        });
                        if (action === "left") {
                            setRemoteCursors((prev) =>
                                prev.filter((c) => c.userId !== userId)
                            );
                            setRemoteSelections((prev) =>
                                prev.filter((s) => s.userId !== userId)
                            );
                        }
                        break;
                    }
                    case "cursor": {
                        const { userId, x, y } = parsed;
                        const name = parsed.name ?? "";
                        setRemoteCursors((prev) => [
                            ...prev.filter((c) => c.userId !== userId),
                            { userId, name, x, y },
                        ]);
                        break;
                    }
                    case "selection": {
                        const { userId, elementIds } = parsed;
                        const name = parsed.name ?? "";
                        setRemoteSelections((prev) => [
                            ...prev.filter((s) => s.userId !== userId),
                            { userId, name, elementIds },
                        ]);
                        break;
                    }
                    case "error": {
                        setWsError(parsed.message);
                        break;
                    }
                    default:
                        break;
                }
            };

            socket.onerror = () => {
                // onclose handles reconnect state.
            };

            socket.onclose = (event) => {
                if (cancelled) return;
                setConnected(false);
                setSynced(false);
                setRemoteUserIds([]);
                setRemoteUsers([]);
                setRemoteCursors([]);
                setRemoteSelections([]);

                // 4001 = unauthorized. Retrying only burns attempts against a
                // dead session — stop and surface a clear message instead.
                if (event.code === WS_CLOSE_UNAUTHORIZED) {
                    setReconnecting(false);
                    setWsError(
                        "Your session expired. Please log in again to keep collaborating."
                    );
                    return;
                }

                if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttempts += 1;
                    setReconnecting(true);
                    reconnectTimeout = setTimeout(() => {
                        reconnectTimeout = null;
                        if (!cancelled) connect();
                    }, backoffDelay(reconnectAttempts));
                } else {
                    setReconnecting(false);
                    setWsError(
                        "Connection lost. Click reconnect to try again."
                    );
                }
            };
        };

        // Manual reconnect: reset the attempt counter, drop any half-open
        // socket without letting its onclose schedule a retry, and reconnect now.
        const manualReconnect = () => {
            if (cancelled) return;
            clearTimers();
            reconnectAttempts = 0;
            tokenWaitTries = 0;
            setWsError(null);
            const existing = socketRef.current;
            if (existing) {
                existing.onopen = null;
                existing.onmessage = null;
                existing.onerror = null;
                existing.onclose = null;
                try {
                    existing.close();
                } catch {
                    // ignore
                }
                socketRef.current = null;
            }
            connect();
        };
        reconnectRef.current = manualReconnect;

        connect();

        return () => {
            cancelled = true;
            setReconnecting(false);
            clearTimers();
            reconnectRef.current = null;
            const socket = socketRef.current;
            if (socket) {
                safeSend(socket, { type: "leave_room", slug: roomSlug });
                socketRef.current = null;
                try {
                    socket.close();
                } catch {
                    // ignore
                }
            }
        };
    }, [roomSlug]);

    // Flush any coalesced final positions and tear down throttle timers when the
    // room changes or the hook unmounts (guarantees the trailing edge is sent).
    useEffect(() => {
        return () => {
            flushPendingUpdates();
            if (cursorTimerRef.current) {
                clearTimeout(cursorTimerRef.current);
                cursorTimerRef.current = null;
            }
            if (selectionTimerRef.current) {
                clearTimeout(selectionTimerRef.current);
                selectionTimerRef.current = null;
            }
            pendingCursorRef.current = null;
            pendingSelectionRef.current = null;
        };
    }, [roomSlug, flushPendingUpdates]);

    const applyHistory = useCallback(
        (compute: (prev: DrawingElement[]) => DrawingElement[]) => {
            setElements((prev) => {
                const next = compute(prev);
                setPast((history) => [...history, prev]);
                setFuture([]);
                return next;
            });
        },
        []
    );

    const addElement = useCallback(
        (el: DrawingElement) => {
            applyHistory((prev) => [...prev, el]);
            pendingUpdatesRef.current.delete(el.id);
            queueOrSendOp({ type: "element_add", slug: roomSlug, element: el });
        },
        [applyHistory, queueOrSendOp, roomSlug]
    );

    const updateElement = useCallback(
        (el: DrawingElement) => {
            // Local state updates immediately for responsiveness…
            applyHistory((prev) =>
                prev.map((item) => (item.id === el.id ? el : item))
            );
            // …but the wire send is coalesced to a trailing ~30fps per id.
            pendingUpdatesRef.current.set(el.id, el);
            if (!updateFlushTimerRef.current) {
                updateFlushTimerRef.current = setTimeout(() => {
                    updateFlushTimerRef.current = null;
                    flushPendingUpdates();
                }, UPDATE_THROTTLE_MS);
            }
        },
        [applyHistory, flushPendingUpdates]
    );

    const deleteElement = useCallback(
        (id: string) => {
            applyHistory((prev) => prev.filter((item) => item.id !== id));
            pendingUpdatesRef.current.delete(id);
            queueOrSendOp({
                type: "element_delete",
                slug: roomSlug,
                elementId: id,
            });
        },
        [applyHistory, queueOrSendOp, roomSlug]
    );

    const undo = useCallback(() => {
        setPast((history) => {
            if (history.length === 0) return history;
            const newPast = [...history];
            const previousElements = newPast.pop();
            if (previousElements) {
                setElements((current) => {
                    for (const op of diffElements(
                        roomSlug,
                        current,
                        previousElements
                    )) {
                        queueOrSendOp(op);
                    }
                    setFuture((f) => [current, ...f]);
                    return previousElements;
                });
            }
            return newPast;
        });
    }, [roomSlug, queueOrSendOp]);

    const redo = useCallback(() => {
        setFuture((history) => {
            if (history.length === 0) return history;
            const newFuture = [...history];
            const nextElements = newFuture.shift();
            if (nextElements) {
                setElements((current) => {
                    for (const op of diffElements(
                        roomSlug,
                        current,
                        nextElements
                    )) {
                        queueOrSendOp(op);
                    }
                    setPast((p) => [...p, current]);
                    return nextElements;
                });
            }
            return newFuture;
        });
    }, [roomSlug, queueOrSendOp]);

    // Ephemeral presence senders — throttled, never queued offline.
    const sendCursor = useCallback(
        (x: number, y: number) => {
            pendingCursorRef.current = { x, y };
            if (cursorTimerRef.current) return;
            cursorTimerRef.current = setTimeout(() => {
                cursorTimerRef.current = null;
                const point = pendingCursorRef.current;
                if (point) {
                    safeSend(socketRef.current, {
                        type: "cursor",
                        slug: roomSlug,
                        x: point.x,
                        y: point.y,
                    });
                }
            }, CURSOR_THROTTLE_MS);
        },
        [roomSlug]
    );

    const sendSelection = useCallback(
        (elementIds: string[]) => {
            pendingSelectionRef.current = elementIds;
            if (selectionTimerRef.current) return;
            selectionTimerRef.current = setTimeout(() => {
                selectionTimerRef.current = null;
                const ids = pendingSelectionRef.current;
                if (ids) {
                    safeSend(socketRef.current, {
                        type: "selection",
                        slug: roomSlug,
                        elementIds: ids,
                    });
                }
            }, SELECTION_THROTTLE_MS);
        },
        [roomSlug]
    );

    const reconnect = useCallback(() => {
        reconnectRef.current?.();
    }, []);

    return {
        elements,
        loaded,
        synced,
        addElement,
        updateElement,
        deleteElement,
        undo,
        redo,
        canUndo: past.length > 0,
        canRedo: future.length > 0,
        connected,
        reconnecting,
        wsError,
        remoteUserIds,
        remoteUsers,
        remoteCursors,
        remoteSelections,
        sendCursor,
        sendSelection,
        reconnect,
    };
};

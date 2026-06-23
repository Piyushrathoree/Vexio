"use client";

import { useCallback, useEffect, useState } from "react";
import type { DrawingElement } from "./types";

const storageKey = (slug: string) => `whiteboard:${slug}`;

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

export const useWhiteboardStore = (slug: string) => {
    const [elements, setElements] = useState<DrawingElement[]>([]);
    const [past, setPast] = useState<DrawingElement[][]>([]);
    const [future, setFuture] = useState<DrawingElement[][]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setLoaded(false);
        setPast([]);
        setFuture([]);
        setElements(loadStoredElements(slug));
        setLoaded(true);
    }, [slug]);

    useEffect(() => {
        if (!loaded || !slug) return;

        localStorage.setItem(storageKey(slug), JSON.stringify(elements));

        const onStorage = (event: StorageEvent) => {
            if (event.key !== storageKey(slug) || !event.newValue) return;
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
    }, [elements, loaded, slug]);

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
        },
        [applyHistory]
    );

    const updateElement = useCallback(
        (el: DrawingElement) => {
            applyHistory((prev) =>
                prev.map((item) => (item.id === el.id ? el : item))
            );
        },
        [applyHistory]
    );

    const deleteElement = useCallback(
        (id: string) => {
            applyHistory((prev) => prev.filter((item) => item.id !== id));
        },
        [applyHistory]
    );

    const undo = useCallback(() => {
        setPast((history) => {
            if (history.length === 0) return history;
            const newPast = [...history];
            const previousElements = newPast.pop();
            if (previousElements) {
                setElements((current) => {
                    setFuture((f) => [current, ...f]);
                    return previousElements;
                });
            }
            return newPast;
        });
    }, []);

    const redo = useCallback(() => {
        setFuture((history) => {
            if (history.length === 0) return history;
            const newFuture = [...history];
            const nextElements = newFuture.shift();
            if (nextElements) {
                setElements((current) => {
                    setPast((p) => [...p, current]);
                    return nextElements;
                });
            }
            return newFuture;
        });
    }, []);

    return {
        elements,
        loaded,
        addElement,
        updateElement,
        deleteElement,
        undo,
        redo,
        canUndo: past.length > 0,
        canRedo: future.length > 0,
    };
};

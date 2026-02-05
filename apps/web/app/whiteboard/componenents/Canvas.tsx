"use client";

import {
    useRef,
    useEffect,
    useState,
    useLayoutEffect,
    useCallback,
} from "react";
import rough from "roughjs";
import {
    createElement,
    drawElementSimple,
    clearElementCache,
} from "../utils/element";
import { Shape, ShapeType } from "../types";
import Toolbar from "./Toolbar";

type ToolType = ShapeType | "selection" | "pan" | "eraser";
type Action =
    | "none"
    | "drawing"
    | "moving"
    | "resizing"
    | "panning"
    | "draftTextResizing";
type ResizeHandle = "tl" | "tr" | "bl" | "br" | "t" | "b" | "l" | "r" | null;

interface SelectedElement {
    element: Shape;
    offsetX: number;
    offsetY: number;
}

const HANDLE_SIZE = 8;
const DRAFT_HANDLE_SIZE = 6;

export default function Canvas({ roomId }: { roomId: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const textInputRef = useRef<HTMLTextAreaElement>(null);
    const [elements, setElements] = useState<Shape[]>([]);
    const [history, setHistory] = useState<Shape[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [tool, setTool] = useState<ToolType>("rectangle");
    const [action, setAction] = useState<Action>("none");
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [startPanPosition, setStartPanPosition] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);
    const [selectedElement, setSelectedElement] =
        useState<SelectedElement | null>(null);
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [strokeColor, setStrokeColor] = useState("#1e1e1e");
    const [colorIntensity, setColorIntensity] = useState(100); // 0–100, mix with white
    const [textEditor, setTextEditor] = useState<{
        visible: boolean;
        x: number;
        y: number;
        width: number;
        height: number;
        text: string;
        editingId: string | null; // null for new text, id for editing existing
    }>({
        visible: false,
        x: 0,
        y: 0,
        width: 200,
        height: 50,
        text: "",
        editingId: null,
    });
    const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
    const [resizeStart, setResizeStart] = useState<{
        x: number;
        y: number;
        element: Shape;
    } | null>(null);
    const [draftResizeStart, setDraftResizeStart] = useState<{
        handle: ResizeHandle;
        startX: number;
        startY: number;
        boxX: number;
        boxY: number;
        boxW: number;
        boxH: number;
    } | null>(null);
    const rafRef = useRef<number>(0);

    // Resolved stroke color: base color mixed with white by intensity (0–100)
    const resolvedStrokeColor = useCallback(() => {
        const t = colorIntensity / 100;
        const hex = strokeColor.replace(/^#/, "");
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        const R = Math.round((1 - t) * 255 + t * r);
        const G = Math.round((1 - t) * 255 + t * g);
        const B = Math.round((1 - t) * 255 + t * b);
        return `#${R.toString(16).padStart(2, "0")}${G.toString(16).padStart(2, "0")}${B.toString(16).padStart(2, "0")}`;
    }, [strokeColor, colorIntensity]);

    // Convert client coords to canvas world coords (for draft box resize)
    const getWorldFromClient = useCallback(
        (clientX: number, clientY: number) => {
            const canvas = canvasRef.current;
            if (!canvas) return { x: 0, y: 0 };
            const rect = canvas.getBoundingClientRect();
            return {
                x: (clientX - rect.left - panOffset.x) / scale,
                y: (clientY - rect.top - panOffset.y) / scale,
            };
        },
        [panOffset, scale]
    );

    // Save to history
    const saveToHistory = useCallback(
        (newElements: Shape[]) => {
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push([...newElements]);
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        },
        [history, historyIndex]
    );

    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setElements([...history[historyIndex - 1]!]);
        }
    }, [history, historyIndex]);

    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setElements([...history[historyIndex + 1]!]);
        }
    }, [history, historyIndex]);

    const handleClear = useCallback(() => {
        setElements([]);
        saveToHistory([]);
        setSelectedElement(null);
    }, [saveToHistory]);

    // Get element bounds helper
    const getElementBounds = useCallback((el: Shape) => {
        if (el.type === "pencil" && el.points && el.points.length > 0) {
            const xs = el.points.map((p) => p.x);
            const ys = el.points.map((p) => p.y);
            return {
                x: Math.min(...xs),
                y: Math.min(...ys),
                width: Math.max(...xs) - Math.min(...xs),
                height: Math.max(...ys) - Math.min(...ys),
            };
        }
        if (el.type === "text") {
            const w = Math.max(el.width ?? 200, 40);
            const h = Math.max(el.height ?? 50, 20);
            return { x: el.x, y: el.y, width: w, height: h };
        }
        return {
            x: Math.min(el.x, el.endX || el.x),
            y: Math.min(el.y, el.endY || el.y),
            width: Math.abs(el.width || 0),
            height: Math.abs(el.height || 0),
        };
    }, []);

    // Draw grid
    const drawGrid = useCallback(
        (ctx: CanvasRenderingContext2D, width: number, height: number) => {
            const GRID_SIZE = 20;
            ctx.strokeStyle = "#ddd";
            ctx.lineWidth = 1;
            const startX =
                Math.floor(-panOffset.x / scale / GRID_SIZE) * GRID_SIZE;
            const startY =
                Math.floor(-panOffset.y / scale / GRID_SIZE) * GRID_SIZE;
            const endX =
                startX +
                Math.ceil(width / scale / GRID_SIZE) * GRID_SIZE +
                GRID_SIZE;
            const endY =
                startY +
                Math.ceil(height / scale / GRID_SIZE) * GRID_SIZE +
                GRID_SIZE;
            ctx.beginPath();
            for (let x = startX; x <= endX; x += GRID_SIZE) {
                ctx.moveTo(x, startY);
                ctx.lineTo(x, endY);
            }
            for (let y = startY; y <= endY; y += GRID_SIZE) {
                ctx.moveTo(startX, y);
                ctx.lineTo(endX, y);
            }
            ctx.stroke();
        },
        [panOffset, scale]
    );

    // Draw resize handles — light, subtle look
    const drawResizeHandles = useCallback(
        (
            ctx: CanvasRenderingContext2D,
            bounds: { x: number; y: number; width: number; height: number }
        ) => {
            const { x, y, width, height } = bounds;
            const hs = HANDLE_SIZE / scale;
            const halfHs = hs / 2;

            ctx.fillStyle = "#fff";
            ctx.strokeStyle = "#3b82f6"; // Blue like tldraw
            ctx.lineWidth = 1.5 / scale;
            ctx.setLineDash([]);

            // Corner handles
            const corners = [
                { cx: x, cy: y }, // tl
                { cx: x + width, cy: y }, // tr
                { cx: x, cy: y + height }, // bl
                { cx: x + width, cy: y + height }, // br
            ];

            // Mid handles
            const mids = [
                { cx: x + width / 2, cy: y }, // t
                { cx: x + width / 2, cy: y + height }, // b
                { cx: x, cy: y + height / 2 }, // l
                { cx: x + width, cy: y + height / 2 }, // r
            ];

            [...corners, ...mids].forEach(({ cx, cy }) => {
                ctx.beginPath();
                ctx.rect(cx - halfHs, cy - halfHs, hs, hs);
                ctx.fill();
                ctx.stroke();
            });
        },
        [scale]
    );

    // Render
    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        if (rafRef.current) cancelAnimationFrame(rafRef.current);

        rafRef.current = requestAnimationFrame(() => {
            ctx.imageSmoothingEnabled = true;
            (
                ctx as CanvasRenderingContext2D & {
                    imageSmoothingQuality?: string;
                }
            ).imageSmoothingQuality = "high";
            const rc = rough.canvas(canvas);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.save();
            ctx.translate(panOffset.x, panOffset.y);
            ctx.scale(scale, scale);

            // Grid removed for cleaner look
            // drawGrid(ctx, canvas.width, canvas.height);

            elements.forEach((element) => {
                drawElementSimple(rc, ctx, element);
            });

            // Draw selection with resize handles — professional styling
            if (selectedElement && tool === "selection") {
                const bounds = getElementBounds(selectedElement.element);
                const padding = 5;

                // Selection outline — blue like tldraw
                ctx.strokeStyle = "#3b82f6";
                ctx.lineWidth = 1.5 / scale;
                ctx.setLineDash([4 / scale, 4 / scale]);
                ctx.strokeRect(
                    bounds.x - padding,
                    bounds.y - padding,
                    bounds.width + padding * 2,
                    bounds.height + padding * 2
                );
                ctx.setLineDash([]);

                // Resize handles
                drawResizeHandles(ctx, {
                    x: bounds.x - padding,
                    y: bounds.y - padding,
                    width: bounds.width + padding * 2,
                    height: bounds.height + padding * 2,
                });
            }

            ctx.restore();
        });

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [
        elements,
        panOffset,
        scale,
        selectedElement,
        tool,
        drawGrid,
        getElementBounds,
        drawResizeHandles,
    ]);

    const getMouseCoordinates = useCallback(
        (e: React.PointerEvent) => {
            const canvas = canvasRef.current;
            if (!canvas) return { x: 0, y: 0 };
            const rect = canvas.getBoundingClientRect();
            return {
                x: (e.clientX - rect.left - panOffset.x) / scale,
                y: (e.clientY - rect.top - panOffset.y) / scale,
            };
        },
        [panOffset, scale]
    );

    // Check if point is on a resize handle (hit area in world coords, min ~12px on screen)
    const getResizeHandleAtPosition = useCallback(
        (x: number, y: number, el: Shape): ResizeHandle => {
            const bounds = getElementBounds(el);
            const padding = 5;
            const bx = bounds.x - padding;
            const by = bounds.y - padding;
            const bw = bounds.width + padding * 2;
            const bh = bounds.height + padding * 2;
            const hs = Math.max(HANDLE_SIZE / scale + 4, 14 / scale); // at least ~14px hit radius on screen

            const handles: { handle: ResizeHandle; cx: number; cy: number }[] =
                [
                    { handle: "tl", cx: bx, cy: by },
                    { handle: "tr", cx: bx + bw, cy: by },
                    { handle: "bl", cx: bx, cy: by + bh },
                    { handle: "br", cx: bx + bw, cy: by + bh },
                    { handle: "t", cx: bx + bw / 2, cy: by },
                    { handle: "b", cx: bx + bw / 2, cy: by + bh },
                    { handle: "l", cx: bx, cy: by + bh / 2 },
                    { handle: "r", cx: bx + bw, cy: by + bh / 2 },
                ];

            for (const { handle, cx, cy } of handles) {
                if (Math.abs(x - cx) <= hs / 2 && Math.abs(y - cy) <= hs / 2) {
                    return handle;
                }
            }
            return null;
        },
        [getElementBounds, scale]
    );

    // Hit detection
    const getElementAtPosition = useCallback(
        (x: number, y: number): Shape | undefined => {
            for (let i = elements.length - 1; i >= 0; i--) {
                const element = elements[i]!;
                if (isWithinElement(x, y, element)) return element;
            }
            return undefined;
        },
        [elements]
    );

    const isWithinElement = (x: number, y: number, element: Shape): boolean => {
        const { type } = element;

        if (type === "text") {
            const w = Math.max(element.width ?? 200, 40);
            const h = Math.max(element.height ?? 50, 20);
            return (
                x >= element.x &&
                x <= element.x + w &&
                y >= element.y &&
                y <= element.y + h
            );
        }

        if (type === "pencil" && element.points) {
            const xs = element.points.map((p) => p.x);
            const ys = element.points.map((p) => p.y);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);
            return (
                x >= minX - 10 &&
                x <= maxX + 10 &&
                y >= minY - 10 &&
                y <= maxY + 10
            );
        }

        if (type === "line" || type === "arrow") {
            const distance = distanceToLine(
                x,
                y,
                element.x,
                element.y,
                element.endX || 0,
                element.endY || 0
            );
            return distance < 10;
        }

        const minX = Math.min(element.x, element.endX || element.x);
        const maxX = Math.max(element.x, element.endX || element.x);
        const minY = Math.min(element.y, element.endY || element.y);
        const maxY = Math.max(element.y, element.endY || element.y);
        return x >= minX && x <= maxX && y >= minY && y <= maxY;
    };

    const distanceToLine = (
        px: number,
        py: number,
        x1: number,
        y1: number,
        x2: number,
        y2: number
    ): number => {
        const A = px - x1,
            B = py - y1,
            C = x2 - x1,
            D = y2 - y1;
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = lenSq !== 0 ? dot / lenSq : -1;
        let xx = param < 0 ? x1 : param > 1 ? x2 : x1 + param * C;
        let yy = param < 0 ? y1 : param > 1 ? y2 : y1 + param * D;
        return Math.sqrt((px - xx) ** 2 + (py - yy) ** 2);
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        const { x, y } = getMouseCoordinates(e);

        if (tool === "pan") {
            setAction("panning");
            setStartPanPosition({
                x: e.clientX - panOffset.x,
                y: e.clientY - panOffset.y,
            });
            return;
        }

        if (tool === "selection") {
            // Check if clicking on resize handle of selected element
            if (selectedElement) {
                const handle = getResizeHandleAtPosition(
                    x,
                    y,
                    selectedElement.element
                );
                if (handle) {
                    setResizeHandle(handle);
                    setResizeStart({
                        x,
                        y,
                        element: { ...selectedElement.element },
                    });
                    setAction("resizing");
                    return;
                }
            }

            // Check if clicking on an element
            const element = getElementAtPosition(x, y);
            if (element) {
                setSelectedElement({
                    element,
                    offsetX: x - element.x,
                    offsetY: y - element.y,
                });
                setAction("moving");
            } else {
                setSelectedElement(null);
            }
            return;
        }

        if (tool === "eraser") {
            const element = getElementAtPosition(x, y);
            if (element) {
                const newElements = elements.filter(
                    (el) => el.id !== element.id
                );
                clearElementCache(element.id);
                setElements(newElements);
                saveToHistory(newElements);
            }
            return;
        }

        if (tool === "text") {
            // If draft is already open (new text) and user clicked elsewhere, close it without creating
            if (textEditor.visible && textEditor.editingId === null) {
                closeDraftWithoutSubmit();
                return;
            }
            setTextEditor({
                visible: true,
                x,
                y,
                width: 200,
                height: 50,
                text: "",
                editingId: null,
            });
            setTimeout(() => textInputRef.current?.focus(), 50);
            return;
        }

        // Drawing new shape
        const id = crypto.randomUUID();
        const newElement = createElement(id, x, y, x, y, tool as ShapeType, {
            stroke: resolvedStrokeColor(),
            strokeWidth,
            roughness: 1,
        });
        setElements((prev) => [...prev, newElement]);
        setAction("drawing");
        setSelectedElement(null);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        const { x, y } = getMouseCoordinates(e);

        // Update cursor
        if (tool === "selection" && action === "none") {
            const canvas = canvasRef.current;
            if (canvas) {
                if (selectedElement) {
                    const handle = getResizeHandleAtPosition(
                        x,
                        y,
                        selectedElement.element
                    );
                    if (handle) {
                        const cursors: Record<string, string> = {
                            tl: "nwse-resize",
                            tr: "nesw-resize",
                            bl: "nesw-resize",
                            br: "nwse-resize",
                            t: "ns-resize",
                            b: "ns-resize",
                            l: "ew-resize",
                            r: "ew-resize",
                        };
                        canvas.style.cursor = cursors[handle] || "default";
                        return;
                    }
                }
                const element = getElementAtPosition(x, y);
                canvas.style.cursor = element ? "move" : "default";
            }
        }

        if (action === "panning") {
            setPanOffset({
                x: e.clientX - startPanPosition.x,
                y: e.clientY - startPanPosition.y,
            });
            return;
        }

        if (
            action === "resizing" &&
            resizeHandle &&
            resizeStart &&
            selectedElement
        ) {
            const { element: origEl } = resizeStart;
            const index = elements.findIndex((el) => el.id === origEl.id);
            if (index === -1) return;

            const bounds = getElementBounds(origEl);
            let newX = bounds.x,
                newY = bounds.y,
                newW = bounds.width,
                newH = bounds.height;

            // Calculate new bounds based on handle
            if (resizeHandle.includes("l")) {
                newW = bounds.x + bounds.width - x;
                newX = x;
            }
            if (resizeHandle.includes("r")) {
                newW = x - bounds.x;
            }
            if (resizeHandle.includes("t")) {
                newH = bounds.y + bounds.height - y;
                newY = y;
            }
            if (resizeHandle.includes("b")) {
                newH = y - bounds.y;
            }

            // Minimum size (text needs slightly larger min so it stays usable)
            const minW = origEl.type === "text" ? 40 : 10;
            const minH = origEl.type === "text" ? 20 : 10;
            newW = Math.max(newW, minW);
            newH = Math.max(newH, minH);

            let updatedElement: Shape;

            if (origEl.type === "pencil" && origEl.points) {
                // Scale pencil points
                const scaleX = newW / bounds.width;
                const scaleY = newH / bounds.height;
                updatedElement = {
                    ...origEl,
                    points: origEl.points.map((p) => ({
                        x: newX + (p.x - bounds.x) * scaleX,
                        y: newY + (p.y - bounds.y) * scaleY,
                    })),
                };
            } else if (origEl.type === "text") {
                updatedElement = {
                    ...origEl,
                    x: newX,
                    y: newY,
                    width: newW,
                    height: newH,
                };
            } else {
                updatedElement = {
                    ...origEl,
                    x: newX,
                    y: newY,
                    width: newW,
                    height: newH,
                    endX: newX + newW,
                    endY: newY + newH,
                };
            }

            clearElementCache(origEl.id);
            const newElements = [...elements];
            newElements[index] = updatedElement;
            setElements(newElements);
            setSelectedElement({
                element: updatedElement,
                offsetX: 0,
                offsetY: 0,
            });
            return;
        }

        if (action === "moving" && selectedElement) {
            const { element, offsetX, offsetY } = selectedElement;
            const newX = x - offsetX;
            const newY = y - offsetY;
            const index = elements.findIndex((el) => el.id === element.id);
            if (index === -1) return;

            const deltaX = newX - element.x;
            const deltaY = newY - element.y;

            let updatedElement: Shape;
            if (element.type === "pencil" && element.points) {
                updatedElement = {
                    ...element,
                    points: element.points.map((p) => ({
                        x: p.x + deltaX,
                        y: p.y + deltaY,
                    })),
                };
            } else if (element.type === "text") {
                updatedElement = { ...element, x: newX, y: newY };
            } else {
                updatedElement = {
                    ...element,
                    x: newX,
                    y: newY,
                    endX: (element.endX || 0) + deltaX,
                    endY: (element.endY || 0) + deltaY,
                };
            }

            clearElementCache(element.id);
            const newElements = [...elements];
            newElements[index] = updatedElement;
            setElements(newElements);
            setSelectedElement({ element: updatedElement, offsetX, offsetY });
            return;
        }

        if (action !== "drawing") return;

        const index = elements.length - 1;
        if (index < 0) return;
        const element = elements[index];
        if (!element) return;

        if (element.type === "pencil") {
            const newPoints = [...(element.points || []), { x, y }];
            updateElement(index, { ...element, points: newPoints });
        } else {
            const updatedElement = createElement(
                element.id,
                element.x,
                element.y,
                x,
                y,
                element.type,
                element.options
            );
            updateElement(index, updatedElement);
        }
    };

    const handlePointerUp = () => {
        if (action === "resizing" || action === "moving") {
            saveToHistory(elements);
        }
        if (action === "drawing") {
            saveToHistory(elements);
        }
        if (action === "draftTextResizing") {
            setDraftResizeStart(null);
        }
        setAction("none");
        setResizeHandle(null);
        setResizeStart(null);
    };

    // Draft text box resize (when creating new text, user can resize the box)
    const handleDraftResizeStart = useCallback(
        (handle: ResizeHandle, e: React.PointerEvent) => {
            if (!handle) return;
            const { x, y } = getWorldFromClient(e.clientX, e.clientY);
            setDraftResizeStart({
                handle,
                startX: x,
                startY: y,
                boxX: textEditor.x,
                boxY: textEditor.y,
                boxW: textEditor.width,
                boxH: textEditor.height,
            });
            setAction("draftTextResizing");
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
        },
        [getWorldFromClient, textEditor]
    );

    const handleDraftResizeMove = useCallback(
        (clientX: number, clientY: number) => {
            if (!draftResizeStart) return;
            const { x, y } = getWorldFromClient(clientX, clientY);
            const { handle, startX, startY, boxX, boxY, boxW, boxH } =
                draftResizeStart;
            let newX = boxX,
                newY = boxY,
                newW = boxW,
                newH = boxH;
            if (handle!.includes("l")) {
                newW = boxX + boxW - x;
                newX = x;
            }
            if (handle!.includes("r")) newW = x - boxX;
            if (handle!.includes("t")) {
                newH = boxY + boxH - y;
                newY = y;
            }
            if (handle!.includes("b")) newH = y - boxY;
            newW = Math.max(newW, 60);
            newH = Math.max(newH, 24);
            setTextEditor((prev) => ({
                ...prev,
                x: newX,
                y: newY,
                width: newW,
                height: newH,
            }));
        },
        [draftResizeStart, getWorldFromClient]
    );

    const handleDraftResizeEnd = useCallback(() => {
        setDraftResizeStart(null);
        setAction("none");
    }, []);

    // Double-click on text with selection tool → edit text
    const handleDoubleClick = useCallback(
        (e: React.MouseEvent) => {
            if (tool !== "selection") return;
            const { x, y } = getMouseCoordinates(
                e as unknown as React.PointerEvent
            );
            const element = getElementAtPosition(x, y);
            if (element?.type === "text") {
                const w = element.width ?? 200;
                const h = element.height ?? 50;
                setTextEditor({
                    visible: true,
                    x: element.x,
                    y: element.y,
                    width: w,
                    height: h,
                    text: element.text ?? "",
                    editingId: element.id,
                });
                setSelectedElement(null);
                setTimeout(() => {
                    textInputRef.current?.focus();
                    textInputRef.current?.select();
                }, 50);
            }
        },
        [tool, getMouseCoordinates, getElementAtPosition]
    );

    const updateElement = (index: number, newElement: Shape) => {
        const elementsCopy = [...elements];
        elementsCopy[index] = newElement;
        setElements(elementsCopy);
    };

    // Text submit handler — commit text (Enter) or cancel (Escape)
    const handleTextSubmit = useCallback(
        (text: string) => {
            if (text.trim()) {
                if (textEditor.editingId) {
                    const index = elements.findIndex(
                        (el) => el.id === textEditor.editingId
                    );
                    if (index !== -1) {
                        const updatedElement = {
                            ...elements[index]!,
                            text: text.trim(),
                        };
                        clearElementCache(textEditor.editingId);
                        const newElements = [...elements];
                        newElements[index] = updatedElement;
                        setElements(newElements);
                        saveToHistory(newElements);
                    }
                } else {
                    const id = crypto.randomUUID();
                    const newElement: Shape = {
                        id,
                        type: "text",
                        x: textEditor.x,
                        y: textEditor.y,
                        width: Math.max(textEditor.width, 40),
                        height: Math.max(textEditor.height, 20),
                        text: text.trim(),
                        options: {
                            stroke: resolvedStrokeColor(),
                            strokeWidth,
                            fontSize: 24,
                            fontFamily: "Virgil, Segoe UI Emoji, sans-serif",
                        },
                    };
                    const newElements = [...elements, newElement];
                    setElements(newElements);
                    saveToHistory(newElements);
                    setTool("selection");
                }
            }
            setTextEditor({
                visible: false,
                x: 0,
                y: 0,
                width: 200,
                height: 50,
                text: "",
                editingId: null,
            });
        },
        [
            textEditor,
            strokeWidth,
            elements,
            saveToHistory,
            setTool,
            resolvedStrokeColor,
        ]
    );

    const closeDraftWithoutSubmit = useCallback(() => {
        setTextEditor({
            visible: false,
            x: 0,
            y: 0,
            width: 200,
            height: 50,
            text: "",
            editingId: null,
        });
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Early return - don't process shortcuts when typing in inputs
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            if (
                (e.key === "Delete" || e.key === "Backspace") &&
                selectedElement
            ) {
                const newElements = elements.filter(
                    (el) => el.id !== selectedElement.element.id
                );
                clearElementCache(selectedElement.element.id);
                setElements(newElements);
                setSelectedElement(null);
                saveToHistory(newElements);
                return;
            }

            if ((e.metaKey || e.ctrlKey) && e.key === "z") {
                e.preventDefault();
                e.shiftKey ? handleRedo() : handleUndo();
            }

            switch (e.key.toLowerCase()) {
                case "v":
                    setTool("selection");
                    break;
                case "h":
                    setTool("pan");
                    break;
                case "r":
                    setTool("rectangle");
                    break;
                case "o":
                    setTool("circle");
                    break;
                case "l":
                    setTool("line");
                    break;
                case "p":
                    setTool("pencil");
                    break;
                case "d":
                    setTool("diamond");
                    break;
                case "a":
                    setTool("arrow");
                    break;
                case "t":
                    setTool("text");
                    break;
                case "e":
                    setTool("eraser");
                    break;
                case "escape":
                    if (textEditor.visible) closeDraftWithoutSubmit();
                    else setSelectedElement(null);
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
        handleUndo,
        handleRedo,
        selectedElement,
        elements,
        saveToHistory,
        textEditor.visible,
        closeDraftWithoutSubmit,
    ]);

    // Zoom
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                setScale((prev) => Math.min(Math.max(prev * delta, 0.1), 5));
            }
        };
        const canvas = canvasRef.current;
        canvas?.addEventListener("wheel", handleWheel, { passive: false });
        return () => canvas?.removeEventListener("wheel", handleWheel);
    }, []);

    // Resize canvas
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };
        window.addEventListener("resize", handleResize);
        handleResize();
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const getCursor = () => {
        if (tool === "pan") return action === "panning" ? "grabbing" : "grab";
        if (tool === "selection")
            return action === "moving"
                ? "move"
                : action === "resizing"
                  ? "grabbing"
                  : "default";
        if (tool === "text") return "text";
        return "crosshair";
    };

    return (
        <div className="relative w-full h-full overflow-hidden bg-white">
            <Toolbar
                selectedTool={tool}
                setTool={setTool}
                strokeWidth={strokeWidth}
                setStrokeWidth={setStrokeWidth}
                strokeColor={strokeColor}
                setStrokeColor={setStrokeColor}
                colorIntensity={colorIntensity}
                setColorIntensity={setColorIntensity}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onClear={handleClear}
                canUndo={historyIndex > 0}
                canRedo={historyIndex < history.length - 1}
            />

            {/* Minimal zoom indicator - tldraw style */}
            <div className="fixed bottom-4 right-4 bg-white border border-gray-200 shadow-sm rounded-lg px-3 py-1.5 z-50">
                <span className="text-xs font-medium text-gray-600 tabular-nums">
                    {Math.round(scale * 100)}%
                </span>
            </div>

            {textEditor.visible && textEditor.editingId === null && (
                <div
                    className="absolute inset-0 z-[99]"
                    aria-hidden
                    onClick={() => closeDraftWithoutSubmit()}
                />
            )}
            {textEditor.visible && (
                <div
                    className="absolute z-[100] border-2 border-blue-500 bg-white shadow-lg rounded-md overflow-hidden"
                    style={{
                        left: textEditor.x * scale + panOffset.x,
                        top: textEditor.y * scale + panOffset.y,
                        width: Math.max(textEditor.width * scale, 80),
                        height: Math.max(textEditor.height * scale, 32),
                        boxSizing: "border-box",
                    }}
                >
                    {/* Resize handles — inside the box so they aren’t clipped */}
                    {(
                        [
                            "tl",
                            "tr",
                            "bl",
                            "br",
                            "t",
                            "b",
                            "l",
                            "r",
                        ] as ResizeHandle[]
                    )
                        .filter(Boolean)
                        .map((handle) => {
                            const hs = DRAFT_HANDLE_SIZE;
                            const inset = 1;
                            const pos: React.CSSProperties = {
                                position: "absolute",
                                width: hs,
                                height: hs,
                                cursor:
                                    handle === "tl" || handle === "br"
                                        ? "nwse-resize"
                                        : handle === "tr" || handle === "bl"
                                          ? "nesw-resize"
                                          : handle === "t" || handle === "b"
                                            ? "ns-resize"
                                            : "ew-resize",
                                zIndex: 10,
                            };
                            if (handle === "tl")
                                Object.assign(pos, { left: inset, top: inset });
                            else if (handle === "tr")
                                Object.assign(pos, {
                                    right: inset,
                                    top: inset,
                                });
                            else if (handle === "bl")
                                Object.assign(pos, {
                                    left: inset,
                                    bottom: inset,
                                });
                            else if (handle === "br")
                                Object.assign(pos, {
                                    right: inset,
                                    bottom: inset,
                                });
                            else if (handle === "t")
                                Object.assign(pos, {
                                    left: "50%",
                                    top: inset,
                                    marginLeft: -hs / 2,
                                });
                            else if (handle === "b")
                                Object.assign(pos, {
                                    left: "50%",
                                    bottom: inset,
                                    marginLeft: -hs / 2,
                                });
                            else if (handle === "l")
                                Object.assign(pos, {
                                    left: inset,
                                    top: "50%",
                                    marginTop: -hs / 2,
                                });
                            else if (handle === "r")
                                Object.assign(pos, {
                                    right: inset,
                                    top: "50%",
                                    marginTop: -hs / 2,
                                });
                            return (
                                <div
                                    key={handle}
                                    className="absolute rounded-sm bg-blue-500 border border-blue-600"
                                    style={pos}
                                    onPointerDown={(e) => {
                                        e.stopPropagation();
                                        handleDraftResizeStart(handle, e);
                                    }}
                                    onPointerMove={(e) => {
                                        if (action === "draftTextResizing")
                                            handleDraftResizeMove(
                                                e.clientX,
                                                e.clientY
                                            );
                                    }}
                                    onPointerUp={handleDraftResizeEnd}
                                    onPointerLeave={() => {
                                        if (action === "draftTextResizing")
                                            handleDraftResizeEnd();
                                    }}
                                />
                            );
                        })}
                    {/* Textarea inside the box */}
                    <textarea
                        key={textEditor.editingId ?? "new"}
                        ref={textInputRef}
                        autoFocus
                        className="w-full h-full resize-none bg-transparent outline-none px-1.5 py-1 box-border"
                        style={{
                            fontSize: `${24 * scale}px`,
                            fontFamily: "Virgil, Segoe UI Emoji, sans-serif",
                            color: "#1e1e1e",
                            padding: 12,
                        }}
                        defaultValue={textEditor.text}
                        placeholder="Type here... (Enter to place)"
                        onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleTextSubmit(
                                    (e.target as HTMLTextAreaElement).value
                                );
                            }
                            if (e.key === "Escape") {
                                closeDraftWithoutSubmit();
                            }
                        }}
                        onBlur={(e) => {
                            if (textEditor.editingId != null)
                                handleTextSubmit(e.target.value);
                        }}
                    />
                </div>
            )}

            <canvas
                ref={canvasRef}
                className="w-full h-full touch-none"
                style={{ cursor: getCursor() }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onDoubleClick={handleDoubleClick}
            >
                Canvas not supported
            </canvas>
        </div>
    );
}

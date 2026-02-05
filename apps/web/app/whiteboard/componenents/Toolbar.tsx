"use client";

import {
    Pencil,
    Square,
    Circle,
    Minus,
    MousePointer2,
    Diamond,
    ArrowRight,
    Type,
    Eraser,
    Undo2,
    Redo2,
    Trash2,
    Hand,
    Pen,
    RectangleHorizontal,
    Hexagon,
    MoveRight,
} from "lucide-react";
import { ShapeType } from "../types";

type ToolType = ShapeType | "selection" | "pan" | "eraser";

interface ToolbarProps {
    selectedTool: ToolType;
    setTool: (tool: ToolType) => void;
    strokeWidth: number;
    setStrokeWidth: (width: number) => void;
    strokeColor: string;
    setStrokeColor: (color: string) => void;
    colorIntensity: number;
    setColorIntensity: (value: number) => void;
    onUndo?: () => void;
    onRedo?: () => void;
    onClear?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
}

// Extended color palette
const COLOR_SWATCHES = [
    "#1d1d1d", // Black
    "#374151", // Gray
    "#dc2626", // Red
    "#ea580c", // Orange
    "#d97706", // Amber
    "#16a34a", // Green
    "#0891b2", // Cyan
    "#2563eb", // Blue
    "#7c3aed", // Violet
    "#db2777", // Pink
    "#a855f7", // Purple
    "#ffffff", // White
];

const tools = [
    { id: "selection", icon: MousePointer2, label: "Select (V)" },
    { id: "pan", icon: Hand, label: "Pan (H)" },
    { id: "pencil", icon: Pen, label: "Pencil (P)" },
    { id: "rectangle", icon: RectangleHorizontal, label: "Rectangle (R)" },
    { id: "circle", icon: Circle, label: "Ellipse (O)" },
    { id: "diamond", icon: Hexagon, label: "Diamond (D)" },
    { id: "arrow", icon: MoveRight, label: "Arrow (A)" },
    { id: "line", icon: Minus, label: "Line (L)" },
    { id: "text", icon: Type, label: "Text (T)" },
    { id: "eraser", icon: Eraser, label: "Eraser (E)" },
] as const;

const strokeWidths = [
    { value: 1, label: "S" },
    { value: 2, label: "M" },
    { value: 4, label: "L" },
    { value: 6, label: "XL" },
];

export default function Toolbar({
    selectedTool,
    setTool,
    strokeWidth,
    setStrokeWidth,
    strokeColor,
    setStrokeColor,
    colorIntensity,
    setColorIntensity,
    onUndo,
    onRedo,
    onClear,
    canUndo = false,
    canRedo = false,
}: ToolbarProps) {
    return (
        <>
            {/* Bottom-center toolbar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3">
                {/* Main Tools */}
                <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-2 flex items-center">
                    {tools.map(({ id, icon: Icon, label }) => (
                        <button
                            key={id}
                            title={label}
                            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-150 ${
                                selectedTool === id
                                    ? "bg-blue-500 text-white shadow-md"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }`}
                            onClick={() => setTool(id as ToolType)}
                        >
                            <Icon size={20} strokeWidth={1.75} />
                        </button>
                    ))}

                    {/* Divider */}
                    <div className="w-px h-8 bg-gray-200 mx-2" />

                    {/* Undo/Redo */}
                    <button
                        title="Undo (Ctrl+Z)"
                        className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-150 ${
                            canUndo
                                ? "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                : "text-gray-300 cursor-not-allowed"
                        }`}
                        onClick={onUndo}
                        disabled={!canUndo}
                    >
                        <Undo2 size={20} strokeWidth={1.75} />
                    </button>
                    <button
                        title="Redo (Ctrl+Shift+Z)"
                        className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-150 ${
                            canRedo
                                ? "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                : "text-gray-300 cursor-not-allowed"
                        }`}
                        onClick={onRedo}
                        disabled={!canRedo}
                    >
                        <Redo2 size={20} strokeWidth={1.75} />
                    </button>

                    {/* Divider */}
                    <div className="w-px h-8 bg-gray-200 mx-2" />

                    {/* Clear */}
                    <button
                        title="Clear Canvas"
                        className="w-11 h-11 flex items-center justify-center rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-500 transition-all duration-150"
                        onClick={onClear}
                    >
                        <Trash2 size={20} strokeWidth={1.75} />
                    </button>
                </div>
            </div>

            {/* Left side style panel */}
            <div className="fixed left-5 top-1/2 -translate-y-1/2 z-50">
                <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-4 flex flex-col gap-5 w-[160px]">
                    {/* Colors */}
                    <div className="flex flex-col gap-3">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Color
                        </span>
                        <div className="grid grid-cols-4 gap-2">
                            {COLOR_SWATCHES.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`w-8 h-8 rounded-lg transition-all duration-150 ${
                                        strokeColor.toLowerCase() ===
                                        color.toLowerCase()
                                            ? "ring-2 ring-blue-500 ring-offset-2 scale-110"
                                            : "hover:scale-110"
                                    }`}
                                    style={{
                                        backgroundColor: color,
                                        border:
                                            color === "#ffffff"
                                                ? "1px solid #e5e7eb"
                                                : "none",
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                    }}
                                    onClick={() => setStrokeColor(color)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Stroke Width */}
                    <div className="flex flex-col gap-3">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Size
                        </span>
                        <div className="flex gap-1.5">
                            {strokeWidths.map(({ value, label }) => (
                                <button
                                    key={value}
                                    title={label}
                                    className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-all duration-150 ${
                                        strokeWidth === value
                                            ? "bg-blue-500 text-white shadow-md"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                    onClick={() => setStrokeWidth(value)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Opacity */}
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Opacity
                            </span>
                            <span className="text-xs font-medium text-gray-400">
                                {colorIntensity}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={colorIntensity}
                            onChange={(e) =>
                                setColorIntensity(Number(e.target.value))
                            }
                            className="w-full h-2 rounded-full appearance-none bg-gray-200 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

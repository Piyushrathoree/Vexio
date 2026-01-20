"use client";
import { useRef, useEffect, useCallback } from "react";

const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    gridSize: number = 20
) => {
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;

    // Draw vertical lines
    for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    } 
};

const Canvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const animationFrameRef = useRef<number>(0);

    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        ctx.fillStyle = "#fafafa";
        ctx.fillRect(0, 0, width, height);

        drawGrid(ctx, width, height);

        animationFrameRef.current = requestAnimationFrame(render);
    }, []);
    return <></>;
};  

export default Canvas;

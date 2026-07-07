import type { Request, Response } from "express";
import { createRoom, getRoomBySlug, getRoomsByAdminId } from "@repo/db";
import { ApiError, ApiResponse } from "@repo/common";

const CreateRoom = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new ApiError(401, "unauthorized");
    }

    const { slug } = req.body ?? {};
    if (!slug || typeof slug !== "string") {
        throw new ApiError(400, "you must have a Slug");
    }

    const normalizedSlug = slug.trim().toLowerCase();
    if (normalizedSlug.length < 3 || normalizedSlug.length > 64) {
        throw new ApiError(400, "slug must be between 3 and 64 characters");
    }
    if (!/^[a-z0-9-]+$/.test(normalizedSlug)) {
        throw new ApiError(
            400,
            "slug must use lowercase letters, numbers, and hyphens only"
        );
    }

    try {
        const room = await createRoom(normalizedSlug, userId);
        res.status(201).json(
            new ApiResponse(201, { room }, "new room created successfully")
        );
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Room not created";
        if (message.includes("Unique constraint")) {
            throw new ApiError(409, "room slug already exists");
        }
        throw new ApiError(400, message);
    }
};

const getMyRooms = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new ApiError(401, "unauthorized");
    }

    const rooms = await getRoomsByAdminId(userId);
    res.status(200).json(
        new ApiResponse(200, { rooms }, "rooms fetched successfully")
    );
};

const getRoom = async (req: Request, res: Response) => {
    const rawSlug = req.params.slug;
    if (!rawSlug || typeof rawSlug !== "string") {
        throw new ApiError(400, "slug is required");
    }

    const slug = rawSlug.trim().toLowerCase();
    if (!slug) {
        throw new ApiError(400, "slug is required");
    }

    const room = await getRoomBySlug(slug);
    if (!room) {
        throw new ApiError(404, "room not found");
    }

    res.status(200).json(
        new ApiResponse(200, { room }, "room fetched successfully")
    );
};

export { CreateRoom, getMyRooms, getRoom };

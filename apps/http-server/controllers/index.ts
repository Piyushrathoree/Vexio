import type { Request, Response } from "express";
import { ExistingUser, NewUser } from "../schema/user.schema.ts";
import { createRoom, createUser, getUserByEmail, getUserById, getAllRooms } from "@repo/db";
import { ApiError, ApiResponse } from "@repo/common";
import { comparePassword, hashPassword } from "../utils/hash.ts";
import { generateToken } from "../utils/jwt.ts";

const Register = async (req: Request, res: Response) => {
    const result = NewUser.safeParse(req.body);
    if (!result.success) {
        throw new ApiError(400, `${result.error.message}`);
    }
    const { name, email, password } = result.data;
    try {
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            throw new ApiError(400, "User already exists please log in");
        }

        let hashedPass = await hashPassword(password);

        const user = await createUser(name, email, hashedPass.toString());
        if (!user) {
            throw new ApiError(400, "user not created ");
        }
        const token = generateToken({ userId: user.id, email });
        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    { user, token },
                    "user created successfully"
                )
            );
    } catch (error) {
        throw new ApiError(500, `${error}`);
    }
};

const signIn = async (req: Request, res: Response) => {
    const result = ExistingUser.safeParse(req.body);
    if (!result.success) {
        throw new ApiError(404, "please recheck your credentials");
    }
    const { email, password } = result.data;
    try {
        const user = await getUserByEmail(email);
        if (!user) {
            throw new ApiError(400, "user not found ! please sign up");
        }

        const decodePass = comparePassword(password, user.password);
        if (!decodePass) {
            throw new ApiError(401, "your credentials are incorrect");
        }
        const token = generateToken({ userId: user.id, email });
        console.log(token);

        res.status(200).json(
            new ApiResponse(
                200,
                { user, token },
                "user logged in successfully "
            )
        );
    } catch (error) {
        throw new ApiError(500, `${error}`);
    }
};

const CreateRoom = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId || typeof userId !== "string") {
        throw new ApiError(401, "unauthorized");
    }
    const { slug } = req.body;
    if (!slug || typeof slug !== "string") {
        throw new ApiError(400, "you must have a Slug");
    }
    try {
        const room = await createRoom(slug, userId);
        if (!room) {
            throw new ApiError(400, "Room not created ");
        }
        res.status(201).json(
            new ApiResponse(200, { room }, "new room created successfully ")
        );
    } catch (error) {
        throw new ApiError(500, `${error}`);
    }
};

const getAllRoom = async (req: Request, res: Response) => {
    try {
        const rooms = await getAllRooms();
        res.status(200).json(
            new ApiResponse(200, { rooms }, "rooms fetched successfully ")
        );
    } catch (error) {
        throw new ApiError(500, `${error}`);
    }
}

export { signIn, Register, CreateRoom, getAllRoom };

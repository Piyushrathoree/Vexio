import type { Request, Response } from "express";
import { ExistingUser, NewUser } from "../schema/user.schema.ts";
import { createUser, getUserByEmail, getUserById } from "@repo/db";
import { ApiError } from "../utils/ApiError.ts";
import { comparePassword, hashPassword } from "../utils/hash.ts";
import { ApiResponse } from "../utils/ApiResponse.ts";
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
        const token = generateToken(email);
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
        const token = generateToken(email);

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

export { signIn, Register };

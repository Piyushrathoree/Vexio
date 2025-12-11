import type { Request, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { verifyToken } from "../utils/jwt";
import { getUserById } from "@repo/db";
import type { JwtPayload } from "jsonwebtoken";
import type { User } from "@repo/db/src/generated/prisma/client";

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}
const isAuthenticated = async (req: Request, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            throw new ApiError(401, "unauthorized");
        }
        let decoded: string | JwtPayload = verifyToken(token);
        if (!decoded) {
            throw new ApiError(401, "unauthorized");
        }
        if (typeof decoded === "object" && decoded !== null) {
            req.user = decoded as User;
        } else {
            throw new Error("Invalid token payload");
        }
        console.log(req.user);
        next();
    } catch (error) {
        console.error(error);
        throw new ApiError(401, "Unauthorized!!");
    }
};

export default isAuthenticated;

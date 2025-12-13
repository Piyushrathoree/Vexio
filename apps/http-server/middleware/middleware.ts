import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../../../packages/common/utils/ApiError.ts";
import { verifyToken } from "../utils/jwt.ts";
import type { JwtPayload } from "jsonwebtoken";

type User = Record<string, unknown>;

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}
const isAuthenticated = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        console.log(token);
        if (!token) {
            throw new ApiError(401, "unauthorized");
        }
        let decoded: string | JwtPayload = verifyToken(token);
        if (!decoded) {
            throw new ApiError(401, "unauthorized");
        }
        console.log("---------------------------------------");
        console.log(decoded);
        console.log("---------------------------------------");
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

import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "@repo/auth";
import { ApiError } from "@repo/common";

type AuthUser = {
    userId: string;
    email: string;
};

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

const isAuthenticated = async (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session?.user) {
            throw new ApiError(401, "unauthorized");
        }

        req.user = {
            userId: session.user.id,
            email: session.user.email,
        };

        next();
    } catch (error) {
        next(error);
    }
};

export default isAuthenticated;

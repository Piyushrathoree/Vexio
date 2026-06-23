import express from "express";
import cors from "cors";
import morgan from "morgan";
import { toNodeHandler } from "better-auth/node";
import { auth } from "@repo/auth";
import { ApiError } from "@repo/common";
import { router } from "./routes/route";
import type {Request , Response } from 'express'

const app = express();
const port = process.env.PORT ?? "8000";
const webUrl = process.env.WEB_URL ?? "http://localhost:3001";

app.use(
    cors({
        origin: webUrl,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
        exposedHeaders: ["set-auth-token"],
    })
);

app.use(morgan("dev"));

// Better Auth must be mounted before express.json()
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req : Request, res :Response) => {
    res.status(200).json({ msg: "working fine" });
});

app.get("/api/me", async (req :Request, res:Response) => {
    const session = await auth.api.getSession({
        headers: req.headers,
    });

    if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    return res.json(session);
});

app.use("/api/v1/", router);

app.use(
    (
        err: unknown,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction
    ) => {
        if (err instanceof ApiError) {
            return res.status(err.statusCode).json({
                success: false,
                message: err.message,
            });
        }

        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
);

app.listen(port, () => {
    console.log(`http-server is running at port ${port}`);
});

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
        // PATCH is required by the room-rename and member-role routes; without
        // it the browser's preflight fails and both silently break.
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        credentials: true,
        exposedHeaders: ["set-auth-token"],
    })
);

app.use(morgan("dev"));

// When a browser sends both its session cookie and a bearer token, the cookie
// wins. better-auth's bearer plugin otherwise *replaces* the cookie with the
// bearer token before looking the session up — and the web client keeps its
// token in localStorage, which goes stale whenever the cookie is set by a
// top-level redirect the client-side JS never sees (Google OAuth callback,
// the verify-email link). A stale-but-validly-signed bearer then makes
// `get-session` return null AND clear the perfectly good cookie, bouncing a
// freshly signed-in user straight back to /login. Non-browser callers with no
// cookie keep working off the bearer token exactly as before.
const SESSION_COOKIE_NAMES = [
    "__Secure-better-auth.session_token",
    "better-auth.session_token",
];

app.use((req: Request, _res: Response, next) => {
    const hasSessionCookie = (req.headers.cookie ?? "")
        .split(";")
        .some((pair) => {
            const [name, value] = pair.trim().split("=");
            return SESSION_COOKIE_NAMES.includes(name ?? "") && Boolean(value);
        });
    if (hasSessionCookie && req.headers.authorization) {
        delete req.headers.authorization;
    }
    next();
});

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

app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, message: "not found" });
});

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

process.on("unhandledRejection", (reason) => {
    console.error("[Vexio:HTTP] unhandled rejection", reason);
});
process.on("uncaughtException", (err) => {
    console.error("[Vexio:HTTP] uncaught exception", err);
});

app.listen(port, () => {
    console.log(`http-server is running at port ${port}`);
});

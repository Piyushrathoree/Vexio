import { Router } from "express";
import {
    CreateRoom,
    getAllRoom,
    Register,
    signIn,
} from "../controllers/index.ts";
import isAuthenticated from "../middleware/middleware.ts";

const router: Router = Router();

router.post("/register", Register);
router.post("/signin", signIn);
router.post("/room", isAuthenticated, CreateRoom);
router.get("/rooms", isAuthenticated, getAllRoom);

router.get("/hi", isAuthenticated, (_req, res) => {
    res.json({ message: "Hello, authenticated user!" });
});
export { router };

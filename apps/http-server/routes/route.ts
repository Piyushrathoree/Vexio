import { Router } from "express";
import { Register, signIn } from "../controllers/user.controller.ts";
import isAuthenticated from "../middleware/middleware.ts";

const router: Router = Router();

router.post("/register", Register);
router.post("/signin", signIn);

router.get("/hi", isAuthenticated, (_req, res) => {
    res.json({ message: "Hello, authenticated user!" });
});
export { router };

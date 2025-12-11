import { Router } from "express";
import { Register, signIn } from "../controllers/user.controller.ts";

const router: Router = Router();

router.post("/register", Register);
router.post("/signin", signIn);

export { router };

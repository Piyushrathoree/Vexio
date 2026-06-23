import { Router } from "express";
import { CreateRoom, getMyRooms, getRoom } from "../controllers/index";
import isAuthenticated from "../middleware/middleware";

const router: Router = Router();

router.post("/room", isAuthenticated, CreateRoom);
router.get("/rooms", isAuthenticated, getMyRooms);
router.get("/room/:slug", isAuthenticated, getRoom);

export { router };

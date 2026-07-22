import { Router } from "express";
import {
    CreateRoom,
    getMyRooms,
    getRoom,
    getWsToken,
    joinRoom,
    updateRoom,
    deleteRoom,
    leaveRoom,
    listRoomMembers,
    createRoomInvite,
    acceptRoomInvite,
    updateRoomMemberRole,
    removeRoomMember,
} from "../controllers/index";
import isAuthenticated from "../middleware/middleware";

const router: Router = Router();

router.get("/ws-token", isAuthenticated, getWsToken);

router.post("/room", isAuthenticated, CreateRoom);
router.get("/rooms", isAuthenticated, getMyRooms);
router.get("/room/:slug", isAuthenticated, getRoom);
router.post("/room/:slug/join", isAuthenticated, joinRoom);
router.patch("/room/:slug", isAuthenticated, updateRoom);
router.delete("/room/:slug", isAuthenticated, deleteRoom);
router.post("/room/:slug/leave", isAuthenticated, leaveRoom);

router.get("/room/:slug/members", isAuthenticated, listRoomMembers);
router.patch("/room/:slug/members/:userId", isAuthenticated, updateRoomMemberRole);
router.delete("/room/:slug/members/:userId", isAuthenticated, removeRoomMember);

router.post("/room/:slug/invite", isAuthenticated, createRoomInvite);
router.post("/invite/:token/accept", isAuthenticated, acceptRoomInvite);

export { router };

import { Router } from "express";
import GameController from "../controllers/game";
// import { isLoggedIn } from '../middlewares/authMiddleware.js';

const router = Router();
const controller = new GameController();

/* GET */
router.get("/rooms/:roomId", controller.getRoomInfo);

/* POST */
router.post("/rooms/add", controller.createRoom);
router.post("/rooms/start", controller.startGame); // 게임 시작
router.post("/rooms/kick", controller.kickUser); // 게임 시작

/* PATCH */
router.patch("/rooms/update", controller.updateRoomSettings);
router.patch("/rooms/delete", controller.markRoomAsDeleted);

/* DELETE */
router.delete("/rooms/leave", controller.leaveRoom);

export default router;

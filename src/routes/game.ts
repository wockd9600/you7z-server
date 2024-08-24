import { Router } from "express";

import GameService from "../services/game";
import GameRepository from "../repositories/implementations/game";
import GameController from "../controllers/game";

import { isLoggedIn } from "../middlewares/auth";
import { validateBody } from "../middlewares/validator";

import { RoomInfoRequestDto } from "../dto/game";

const router = Router();
const repository = new GameRepository();
const service = new GameService(repository);
const controller = new GameController(service);

/* GET */
router.get("/room/:roomCode", isLoggedIn, controller.getRoomInfo);

/* POST */
router.post("/room/enter", isLoggedIn, validateBody(RoomInfoRequestDto), controller.enterRoom);
router.post("/room/add", isLoggedIn, controller.createRoom);
// router.post("/room/start", controller.startGame); // 게임 시작
// router.post("/room/kick", controller.kickUser); // 게임 시작

// /* PATCH */
// router.patch("/room/update", controller.updateRoomSettings);

// /* DELETE */
// router.delete("/room/leave", controller.leaveRoom);

export default router;

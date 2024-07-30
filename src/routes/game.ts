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
router.get("/rooms/:roomId", isLoggedIn, validateBody(RoomInfoRequestDto), controller.getRoomInfo);

/* POST */
router.post("/rooms/add", isLoggedIn, controller.createRoom);
// router.post("/rooms/start", controller.startGame); // 게임 시작
// router.post("/rooms/kick", controller.kickUser); // 게임 시작

// /* PATCH */
// router.patch("/rooms/update", controller.updateRoomSettings);

// /* DELETE */
// router.delete("/rooms/leave", controller.leaveRoom);

export default router;

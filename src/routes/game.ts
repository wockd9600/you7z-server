import { Router } from "express";
import { Request, Response } from "express";

import GameService from "../services/game";
import GameRepository from "../repositories/implementations/game";
import AnswerRepository from "../repositories/implementations/answer";
import GameController from "../controllers/game";

import { isLoggedIn } from "../middlewares/auth";
import { validateBody } from "../middlewares/validator";

import { RoomInfoRequestDto } from "../dto/game";

const router = Router();
const repository = new GameRepository();
const answerRepository = new AnswerRepository();
const service = new GameService(repository, answerRepository);
const controller = new GameController(service);

/* GET */
router.get("/room/:roomCode", isLoggedIn, controller.getRoomInfo);

/* POST */
router.post("/room/enter", isLoggedIn, validateBody(RoomInfoRequestDto), controller.enterRoom);
router.post("/room/add", isLoggedIn, controller.createRoom);

// *수정 테스트
// router.post("/room/test", async (req: Request, res: Response) => {
//     const { userId, roomCode } = req.body;
//     try {
//         const response = await getGameSessionFromRoomCode(repository, roomCode);
//         if (response.status !== 200) return response;

//         const { gameSession } = response;

//         const gameRedis = await createRedisUtil(gameSession.session_id);
//         const song_id = await gameRedis.getCurrentSongId();

//         // song_id로 url, 등등 가져옴
//         const songData = new Song({ song_id });
//         const current_song = await repository.findOneSong(songData);
//         if (current_song === null) throw new Error("don't exist song");

//         const answers = current_song.answer.split(",");
//         const answer = answers[0];

//         res.status(200).json({ answer });
//     } catch (error) {
//         console.log("room test error");
//     }
// });
// router.post("/room/start", controller.startGame); // 게임 시작
// router.post("/room/kick", controller.kickUser); // 게임 시작

// /* PATCH */
// router.patch("/room/update", controller.updateRoomSettings);

// /* DELETE */
// router.delete("/room/leave", controller.leaveRoom);

export default router;

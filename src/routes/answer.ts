import { Router } from "express";

import AnswerService from "../services/answer";
import AnswerRepository from "../repositories/implementations/answer";
import AnswerController from "../controllers/answer";

import GameRepository from "../repositories/implementations/game";

import { isLoggedIn } from "../middlewares/auth";
import { validateBody } from "../middlewares/validator";

import { AnswerRequestDto } from "../dto/answer";

const router = Router();

const gameRepository = new GameRepository();
const answerRepository = new AnswerRepository();
const service = new AnswerService(answerRepository, gameRepository);
const controller = new AnswerController(service);

/* GET */
router.get("/rooms/:roomId/answers", isLoggedIn, validateBody(AnswerRequestDto), controller.getAnswers);

/* POST */
// router.post("/rooms/:roomId/answer", controller.submitAnswer);

export default router;

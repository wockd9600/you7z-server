import { Router } from "express";
import AnswerController from "../controllers/answer";
// import { isLoggedIn } from '../middlewares/authMiddleware.js';

const router = Router();
const controller = new AnswerController();

/* GET */
router.get("/rooms/:roomId/answers", controller.getAnswers);

router.post("/rooms/:roomId/answer", controller.submitAnswer);

export default router;

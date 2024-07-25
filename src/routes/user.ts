import { Router } from "express";

import UserService from "../services/user";
import UserRepository from "../repositories/implementations/user";
import UserController from "../controllers/user";

// import { isLoggedIn } from '../middlewares/authMiddleware.js';

const router = Router();
const userRepository = new UserRepository(); // 리포지토리 인스턴스 생성
const service = new UserService(userRepository);
const controller = new UserController(service);

/* GET */

/* POST */
router.post("/login", controller.login);
router.post("/logout", controller.logout);
router.post("/refresh", controller.refresh);

/* PATCH */
router.patch("/name", controller.patchUserName);

export default router;

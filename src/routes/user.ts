import { Router } from "express";

import UserService from "../services/user";
import UserRepository from "../repositories/implementations/user";
import UserController from "../controllers/user";

import { isLoggedIn } from '../middlewares/auth';
import { validateBody } from "../middlewares/validator";

import { LoginRequestDto, RefreshRequestDto, UpdateNameDto } from "../dto/user";


const router = Router();
const repository = new UserRepository(); // 리포지토리 인스턴스 생성
const service = new UserService(repository);
const controller = new UserController(service);

/* GET */

/* POST */
router.post("/login", validateBody(LoginRequestDto), controller.login);
router.post("/logout", isLoggedIn, controller.logout);
router.post("/refresh", validateBody(RefreshRequestDto), controller.refresh);

/* PATCH */
router.patch("/name", isLoggedIn, validateBody(UpdateNameDto), controller.patchUserName);

export default router;

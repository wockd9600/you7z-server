import { Router } from "express";
import UserController from "../controllers/user";
// import { isLoggedIn } from '../middlewares/authMiddleware.js';

const router = Router();
const controller = new UserController();

/* GET */

/* PATCH */
router.patch("/name", controller.patchName);

export default router;

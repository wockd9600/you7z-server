import { Router } from "express";
import ServiceController from "../controllers/service";

const router = Router();
const controller = new ServiceController();

/* GET */

/* POST */
router.post("/login", controller.login);
router.post("/logout", controller.logout);
router.post("/refresh", controller.refresh);

export default router;

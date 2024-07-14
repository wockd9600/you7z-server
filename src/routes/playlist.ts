import { Router } from "express";
import PlayListController from "../controllers/playlist";

const router = Router();
const controller = new PlayListController();

/* GET */
router.get("/popular", controller.getPopularPlayList);
router.get("/search", controller.getSearchPlayList);

/* POST */
router.post("/store", controller.postStorePlayList);
router.post("/create", controller.postCreatePlayList);
// router.post("/song/add", controller.postAddSong);

/* PATCH */
// router.patch("/song/delete", controller.patchDeleteSong);
router.patch("/delete", controller.patchDeletePlayList);

/* DELETE */
router.delete("/store", controller.deleteStorePlayList);

export default router;

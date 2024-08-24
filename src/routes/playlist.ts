import { Router } from "express";

import PlaylistService from "../services/playlist";
import PlaylistRepository from "../repositories/implementations/playlist";
import PlaylistController from "../controllers/playlist";

import { isLoggedIn } from "../middlewares/auth";
import { validateBody } from "../middlewares/validator";

import { StoreRequestDto, CreateRequestDto, CheckYoutubeLinkRequestDto, DeleteRequestDto } from "../dto/playlist";

const router = Router();
const repository = new PlaylistRepository();
const service = new PlaylistService(repository);
const controller = new PlaylistController(service);

/* GET */
router.get("/", isLoggedIn, controller.getPopularPlaylist);
// router.get("/search", isLoggedIn, validateBody(SearchRequestDto), controller.getSearchPlaylist);

/* POST */
router.post("/store", isLoggedIn, validateBody(StoreRequestDto), controller.postStorePlaylist);
router.post("/create", isLoggedIn, validateBody(CreateRequestDto), controller.postCreatePlaylist);
router.post("/checkYoutubeLink", isLoggedIn, validateBody(CheckYoutubeLinkRequestDto), controller.postCheckYoutubeLink);
// router.post("/song/add", controller.postAddSong);

/* PATCH */
// router.patch("/song/delete", controller.patchDeleteSong);
router.patch("/delete", isLoggedIn, validateBody(DeleteRequestDto), controller.patchDeletePlaylist);

/* DELETE */
router.delete("/store", isLoggedIn, controller.deleteStorePlaylist);

export default router;

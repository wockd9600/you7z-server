import { Router } from "express";

import PlayListService from "../services/playlist";
import PlayListRepository from "../repositories/implementations/playlist";
import PlayListController from "../controllers/playlist";

import { isLoggedIn } from "../middlewares/auth";
import { validateBody } from "../middlewares/validator";

import { PopularRequestDto, SearchRequestDto, StoreRequestDto, CreateRequestDto, DeleteRequestDto, DeleteStoreRequestDto } from "../dto/playlist"

const router = Router();
const repository = new PlayListRepository();
const service = new PlayListService(repository);
const controller = new PlayListController(service);

/* GET */
router.get("/popular", isLoggedIn, validateBody(PopularRequestDto), controller.getPopularPlayList);
router.get("/search", isLoggedIn, validateBody(SearchRequestDto), controller.getSearchPlayList);

/* POST */
router.post("/store", isLoggedIn, validateBody(StoreRequestDto), controller.postStorePlayList);
router.post("/create", isLoggedIn, validateBody(CreateRequestDto), controller.postCreatePlayList);
// router.post("/song/add", controller.postAddSong);

/* PATCH */
// router.patch("/song/delete", controller.patchDeleteSong);
router.patch("/delete", isLoggedIn, validateBody(DeleteRequestDto), controller.patchDeletePlayList);

/* DELETE */
router.delete("/store", isLoggedIn, validateBody(DeleteStoreRequestDto), controller.deleteStorePlayList);

export default router;

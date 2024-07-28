import { Request, Response } from "express";
import autobind from "autobind-decorator";

import playlistService from "../services/playlist";

import logError from "../utils/error";

import * as dto from "../dto/playlist";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";

export default class PlaylistController {
    constructor(private playlistService: playlistService) {}

    @autobind
    async getPopularPlayList(req: Request, res: Response) {
        // page를 전달 받음.
        // page에 해당하는 인기 노래모음을 가져옴 (db에서 is_delete = 0은 가져오지 않음.)
        // 전달

        const { page } = req.body;

        try {
            const popularRequestDto = new dto.PopularRequestDto(page);
            const popularResponseDto = await this.playlistService.getPopularPlaylists(popularRequestDto);

            res.status(200).json(popularResponseDto);
        } catch (error) {
            if (error instanceof Error) logError(error, req);
            return res.status(500).json({ message: "플레이 리스트를 가져올 수 없습니다." });
        }
    }

    @autobind
    async getSearchPlayList(req: Request, res: Response) {
        // 검색어를 전달 받아서
        // 노래모음에서 검색 (db에서 is_delete = 0은 가져오지 않음.)
        // 해당하는 노래가 있으면 전달

        try {
            const { page, search_term } = req.body;

            const searchRequestDto = new dto.SearchRequestDto(page, search_term);
            const searchResponseDto = await this.playlistService.searchPlaylists(searchRequestDto);

            res.status(200).json(searchResponseDto);
        } catch (error) {
            if (error instanceof Error) logError(error, req);
            return res.status(500).json({ message: "검색할 수 없습니다." });
        }
    }

    @autobind
    async postStorePlayList(req: Request, res: Response) {
        // 저장한 playlist 인지 확인
        // user id와 playlist id로 저장

        try {
            const user_id = req.user!.user_id;
            const { id } = req.body;

            const storeRequestDto = new dto.StoreRequestDto(id);
            const storeResponseDto = await this.playlistService.storePlaylist(storeRequestDto, user_id);

            res.status(201).json(storeResponseDto);
        } catch (error) {
            if (error instanceof Error) logError(error, req);
            return res.status(500).json({ message: "저장할 수 없는 플레이 리스트입니다." });
        }
    }

    @autobind
    async postCreatePlayList(req: Request, res: Response) {
        // user id, playlist와 song list를 전달 받음.
        // playlist 생성
        // songlist 생성
        // 완성 전달

        try {
            const user_id = req.user!.user_id;
            const { playlist, songs } = req.body;

            const createRequestDto = plainToClass(dto.CreateRequestDto, { playlist, songs });
            const errors = await validate(createRequestDto);
            if (errors.length > 0) throw errors

            const createResponseDto = await this.playlistService.createPlaylist(createRequestDto, user_id);

            res.status(201).json(createResponseDto);
        } catch (error) {
            if (error instanceof Error) logError(error, req);
            return res.status(500).json({ message: "플레이 리스트를 생성 오류입니다." });
        }
    }

    // @autobind
    // postAddSong(req: Request, res: Response) {}

    // @autobind
    // patchDeleteSong(req: Request, res: Response) {}

    @autobind
    async patchDeletePlayList(req: Request, res: Response) {
        // user id, playlist id를 전달 받음.
        // playlist가 user가 만든건지 확인함.
        // playlist의 is_delete = 1로 변경

        try {
            const user_id = req.user!.user_id;
            const { id } = req.body;

            const deleteRequestDto = new dto.DeleteRequestDto(id);
            const deleteResponseDto = await this.playlistService.deletePlaylist(deleteRequestDto, user_id);

            res.status(200).json(deleteResponseDto);
        } catch (error) {
            if (error instanceof Error) logError(error, req);
            return res.status(500).json({ message: "플레이 리스트를 삭제할 수 없습니다" });
        }
    }

    @autobind
    async deleteStorePlayList(req: Request, res: Response) {
        // 저장한 playlist 인지 확인
        // user id와 playlist id로 삭제

        try {
            const user_id = req.user!.user_id;
            const { id } = req.body;

            const deleteStoreRequestDto = new dto.DeleteStoreRequestDto(id);
            const deleteStoreResponseDto = await this.playlistService.removeStoredPlaylist(deleteStoreRequestDto, user_id);

            res.status(200).json(deleteStoreResponseDto);
        } catch (error) {
            if (error instanceof Error) logError(error, req);
            return res.status(500).json({ message: "플레이 리스트를 삭제할 수 없습니다." });
        }
    }

    // 다른 메서드들...
}

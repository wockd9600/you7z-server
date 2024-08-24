import { Request, Response } from "express";
import autobind from "autobind-decorator";

import PlaylistService from "../services/playlist";

import logError from "../utils/error";

export default class PlaylistController {
    constructor(private playlistService: PlaylistService) {}

    @autobind
    async getPopularPlaylist(req: Request, res: Response) {
        // page를 전달 받음.
        // page에 해당하는 인기 노래모음을 가져옴 (db에서 is_delete = 1은 가져오지 않음.)
        // 전달

        try {
            const user_id = req.user!.user_id;

            const page: number = parseInt(req.query.page as string, 10);
            const type: number = parseInt(req.query.type as string, 10);
            const search_term: string = (req.query.search_term as string) || "";
            if (isNaN(page)) throw new Error("Page must be a number");
            if (isNaN(type)) throw new Error("Type must be a number");

            const popularResponseDto = await this.playlistService.getPlaylists(page, type, search_term, user_id);

            res.status(200).json(popularResponseDto);
        } catch (error) {
            if (error instanceof Error) logError(error, req);
            return res.status(500).json({ message: "플레이 리스트를 가져올 수 없습니다." });
        }
    }

    // @autobind
    // async getSearchPlaylist(req: Request, res: Response) {
    //     // 검색어를 전달 받아서
    //     // 노래모음에서 검색 (db에서 is_delete = 0은 가져오지 않음.)
    //     // 해당하는 노래가 있으면 전달

    //     try {
    //         const searchRequestDto = req.dto;
    //         const searchResponseDto = await this.playlistService.searchPlaylists(searchRequestDto);

    //         res.status(200).json(searchResponseDto);
    //     } catch (error) {
    //         if (error instanceof Error) logError(error, req);
    //         return res.status(500).json({ message: "검색할 수 없습니다." });
    //     }
    // }

    @autobind
    async postStorePlaylist(req: Request, res: Response) {
        // 저장한 playlist 인지 확인
        // user id와 playlist id로 저장

        try {
            const user_id = req.user!.user_id;

            const storeRequestDto = req.dto;
            const storeResponseDto = await this.playlistService.storePlaylist(storeRequestDto, user_id);

            res.status(201).json(storeResponseDto);
        } catch (error) {
            if (error instanceof Error) logError(error, req);
            return res.status(500).json({ message: "저장할 수 없는 플레이 리스트입니다." });
        }
    }

    @autobind
    async postCreatePlaylist(req: Request, res: Response) {
        // user id, playlist와 song list를 전달 받음.
        // playlist 생성
        // songlist 생성
        // 완성 전달

        try {
            const user_id = req.user!.user_id;

            const createRequestDto = req.dto;
            const createResponseDto = await this.playlistService.createPlaylist(createRequestDto, user_id);

            res.status(201).json(createResponseDto);
        } catch (error) {
            if (error instanceof Error) logError(error, req);
            return res.status(500).json({ message: "플레이 리스트를 생성 오류입니다." });
        }
    }

    @autobind
    async postCheckYoutubeLink(req: Request, res: Response) {
        // url 받아서 체크

        try {
            const checkYoutubeLinkRequestDto = req.dto;
            const checkYoutubeLinkResponseDto = await this.playlistService.checkYoutubeLink(checkYoutubeLinkRequestDto);

            res.status(201).json(checkYoutubeLinkResponseDto);
        } catch (error) {
            if (error instanceof Error) logError(error, req);
            return res.status(500).json({ message: "유튜브 링크를 확인할 수 없습니다." });
        }
    }

    // @autobind
    // postAddSong(req: Request, res: Response) {}

    // @autobind
    // patchDeleteSong(req: Request, res: Response) {}

    @autobind
    async patchDeletePlaylist(req: Request, res: Response) {
        // user id, playlist id를 전달 받음.

        try {
            const user_id = req.user!.user_id;

            const deleteRequestDto = req.dto;
            const deleteResponseDto = await this.playlistService.deletePlaylist(deleteRequestDto, user_id);

            res.status(200).json(deleteResponseDto);
        } catch (error) {
            if (error instanceof Error) logError(error, req);
            return res.status(500).json({ message: "플레이 리스트를 삭제할 수 없습니다" });
        }
    }

    @autobind
    async deleteStorePlaylist(req: Request, res: Response) {
        // 저장한 playlist 인지 확인
        // user id와 playlist id로 삭제

        try {
            const user_id = req.user!.user_id;

            const id: number = parseInt(req.query.id as string, 10);
            if (isNaN(id)) throw new Error("ID must be a number");

            const deleteStoreResponseDto = await this.playlistService.removeStoredPlaylist(id, user_id);

            res.status(200).json(deleteStoreResponseDto);
        } catch (error) {
            if (error instanceof Error) logError(error, req);
            return res.status(500).json({ message: "플레이 리스트를 삭제할 수 없습니다." });
        }
    }

    // 다른 메서드들...
}

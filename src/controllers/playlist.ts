import { Request, Response } from "express";
import autobind from "autobind-decorator";

import playlistService from "../services/playlist";

export default class PlaylistController {
    constructor(private playlistService: playlistService) {}

    @autobind
    async getPopularPlayList(req: Request, res: Response) {
        // page를 전달 받음.
        // page에 해당하는 인기 노래모음을 가져옴 (db에서 is_delete = 0은 가져오지 않음.)
        // 전달

        try {
            const page = req.body.page;
            const playlists = await this.playlistService.getPopularPlaylists(page);
            res.status(200).json(playlists);
        } catch (error) {
            if (error instanceof Error) {
                res.status(500).json({ error: error.message });
            } else {
                res.status(500).json({ message: "Unknown error" });
            }
        }
    }

    @autobind
    async getSearchPlayList(req: Request, res: Response) {
        // 검색어를 전달 받아서
        // 노래모음에서 검색 (db에서 is_delete = 0은 가져오지 않음.)
        // 해당하는 노래가 있으면 전달

        try {
            const search_term = req.body.search_term;

            const playlists = await this.playlistService.searchPlaylists(search_term);
            res.status(200).json(playlists);
        } catch (error) {
            if (error instanceof Error) {
                res.status(500).json({ error: error.message });
            } else {
                res.status(500).json({ message: "Unknown error" });
            }
        }
    }

    @autobind
    async postStorePlayList(req: Request, res: Response) {
        // 저장한 playlist 인지 확인
        // user id와 playlist id로 저장

        try {
            const user_id = req.user!.user_id;
            const playlist_id = req.body.playlist_id;
            const result = await this.playlistService.storePlaylist(user_id, playlist_id);
            res.status(201).json(result);
        } catch (error) {
            if (error instanceof Error) {
                res.status(500).json({ error: error.message });
            } else {
                res.status(500).json({ message: "Unknown error" });
            }
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
            const playlist = req.body.playlist;
            const songs = req.body.songs;
            const result = await this.playlistService.createPlaylist(user_id, playlist, songs);
            res.status(201).json(result);
        } catch (error) {
            if (error instanceof Error) {
                res.status(500).json({ error: error.message });
            } else {
                res.status(500).json({ message: "Unknown error" });
            }
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
            const playlist_id = req.body.playlist_id;
            const result = await this.playlistService.deletePlaylist(user_id, playlist_id);
            res.status(200).json({ message: "Playlist marked as deleted" });
        } catch (error) {
            if (error instanceof Error) {
                res.status(500).json({ error: error.message });
            } else {
                res.status(500).json({ message: "Unknown error" });
            }
        }
    }

    @autobind
    async deleteStorePlayList(req: Request, res: Response) {
        // 저장한 playlist 인지 확인
        // user id와 playlist id로 삭제

        try {
            const user_id = req.user!.user_id;
            const playlist_id = req.body.playlist_id;
            const result = await this.playlistService.removeStoredPlaylist(user_id, playlist_id);
            res.status(200).json({ message: "Stored playlist removed" });
        } catch (error) {
            if (error instanceof Error) {
                res.status(500).json({ error: error.message });
            } else {
                res.status(500).json({ message: "Unknown error" });
            }
        }
    }

    // 다른 메서드들...
}

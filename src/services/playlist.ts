import axios from "axios";
import autobind from "autobind-decorator";
import * as dotenv from "dotenv";
dotenv.config();

import { sequelize } from "../modules/sequelize";
import * as dto from "../dto/playlist";

// type
import IPlaylistRepository from "../repositories/interfaces/playlist";
import Playlist from "../models/Playlist";
import UserPlaylist from "../models/UserPlaylist";

import { StoreRequestDto, CreateRequestDto, CheckYoutubeLinkRequestDto, DeleteRequestDto } from "../dto/playlist";

export default class PlaylistController {
    constructor(private playlistRepository: IPlaylistRepository) {}

    getOffsetAndLimit(page: number) {
        const per = 8;

        const offset = (page - 1) * per;
        const limit = per;

        return { offset, limit };
    }

    @autobind
    async getPlaylists(page: number, type: number, search_term: string, user_id: number) {
        try {
            const { limit, offset } = this.getOffsetAndLimit(page);

            const playlists = await this.playlistRepository.getPlaylists(limit, offset, user_id, type, search_term);
            if (playlists.length === 0) return [];

            const playlistDtos = playlists.map((playlist: Playlist) => {
                let downloaded = 0;
                if ("UserPlaylists.downloaded" in playlist) {
                    downloaded = (playlist["UserPlaylists.downloaded"] as number) || 0;
                }
                return new dto.PlayListDto(playlist, downloaded);
            });

            const popularResponseDto = new dto.PopularResponseDto(playlistDtos);
            return popularResponseDto;
        } catch (error) {
            throw error;
        }
    }

    // @autobind
    // async searchPlaylists(searchRequestDto: SearchRequestDto) {
    //     const { page, search_term } = searchRequestDto;

    //     try {
    //         const { limit, offset } = this.getOffsetAndLimit(page);

    //         const playlists = await this.playlistRepository.getPlaylists(limit, offset, -1, 0, search_term || "");
    //         if (playlists.length === 0) return [];

    //         const searchResponseDto = new dto.SearchResponseDto(playlists);
    //         return searchResponseDto;
    //     } catch (error) {
    //         throw error;
    //     }
    // }

    @autobind
    async storePlaylist(storeRequestDto: StoreRequestDto, user_id: number) {
        const { id } = storeRequestDto;

        try {
            const userPlaylistData = new UserPlaylist({
                playlist_id: id,
                user_id,
            });

            const user_playlist = await this.playlistRepository.findOneUserPlaylist(userPlaylistData);
            if (user_playlist !== null) throw new Error("이미 저장한 플레이 리스트입니다.");

            await this.playlistRepository.createUserPlaylist(userPlaylistData);

            const playlistData = new Playlist({ playlist_id: id });
            await this.playlistRepository.increaseDownloadCountPlayllist(playlistData);

            const storeResponseDto = new dto.StoreResponseDto(true);
            return storeResponseDto;
        } catch (error) {
            throw error;
        }
    }

    @autobind
    async createPlaylist(createRequestDto: CreateRequestDto, user_id: number) {
        const { playlist, songs } = createRequestDto;

        const transaction = await sequelize.transaction();

        try {
            const length = songs.length;

            const playlistData = new Playlist({ ...playlist, user_id, length });
            const user_playlist = await this.playlistRepository.createPlaylist(playlistData, transaction);

            const songEntities = songs.map((song) => ({
                answer: song.answer,
                description: song.description,
                url: song.youtubeLink,
                start_time: song.startTime,
                playlist_id: user_playlist.playlist_id,
            }));

            await this.playlistRepository.bulkCreateSong(songEntities, transaction);

            const userPlaylistData = new UserPlaylist({
                playlist_id: user_playlist.playlist_id,
                user_id,
            });

            await this.playlistRepository.createUserPlaylist(userPlaylistData);

            const createResponseDto = new dto.CreateResponseDto(true);
            await transaction.commit();

            return createResponseDto;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    getYoutubeVideoId(url: string) {
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    @autobind
    async checkYoutubeLink(createRequestDto: CheckYoutubeLinkRequestDto) {
        const { url } = createRequestDto;

        try {
            const videoId = this.getYoutubeVideoId(url);
            if (!videoId) throw new Error("유효한 YouTube URL이 아닙니다.");

            const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
            const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${YOUTUBE_API_KEY}`;
            const config = {
                headers: {
                    "Content-Type": "application/json",
                },
            };
            const response = await axios.get(apiUrl, config);
            const item = response.data.items[0];
            const responseData = new dto.CheckYoutubeLinkResponseDto();
            responseData.title = item.snippet.title;
            responseData.thumbnails = item.snippet.thumbnails.standard;
            responseData.duration = item.contentDetails.duration;
            return responseData;
        } catch (error) {
            throw error;
        }
    }

    @autobind
    async deletePlaylist(deleteRequestDto: DeleteRequestDto, user_id: number) {
        const { id } = deleteRequestDto;

        try {
            const playlistData = new Playlist({ playlist_id: id, user_id, status: 0 });

            // playlist가 user가 만든건지 확인함.
            const playlist = await this.playlistRepository.findOnePlaylist(playlistData);
            if (playlist === null) throw new Error("not my playlist");

            // playlist의 status = 0로 변경
            await this.playlistRepository.updateDeletePlaylist(playlistData);

            const deleteResponseDto = new dto.DeleteResponseDto(true);
            return deleteResponseDto;
        } catch (error) {
            throw error;
        }
    }

    @autobind
    async removeStoredPlaylist(id: number, user_id: number) {
        try {
            const userPlaylistData = new UserPlaylist({ playlist_id: id, user_id });

            const user_playlist = await this.playlistRepository.findOneUserPlaylist(userPlaylistData);
            if (user_playlist === null) throw new Error("저장한F 플레이리스트가 없습니다.");

            await this.playlistRepository.deleteUserPlaylist(userPlaylistData);

            const playlistData = new Playlist({ playlist_id: id });
            await this.playlistRepository.decreaseDownloadCountPlayllist(playlistData);

            const deleteStoreResponseDto = new dto.DeleteStoreResponseDto(true);
            return deleteStoreResponseDto;
        } catch (error) {
            throw error;
        }
    }
}

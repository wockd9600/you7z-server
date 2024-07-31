import autobind from "autobind-decorator";

import { sequelize } from "../modules/sequelize";
import * as dto from "../dto/playlist";

// type
import IPlaylistRepository from "../repositories/interfaces/playlist";
import Playlist from "../models/Playlist";
import UserPlaylist from "../models/UserPlaylist";

import { PopularRequestDto, SearchRequestDto, StoreRequestDto, CreateRequestDto, DeleteRequestDto, DeleteStoreRequestDto } from "../dto/playlist";

export default class PlaylistController {
    constructor(private playlistRepository: IPlaylistRepository) {}

    getOffsetAndLimit(page: number) {
        const per = 8;

        const offset = (page - 1) * per;
        const limit = per;

        return { offset, limit };
    }

    @autobind
    async getPopularPlaylists(popularRequestDto: PopularRequestDto) {
        const { page } = popularRequestDto;

        try {
            const { limit, offset } = this.getOffsetAndLimit(page);

            const playlists = await this.playlistRepository.getPopularPlaylists(limit, offset);
            if (playlists.length === 0) return [];

            const playlistDtos = playlists.map((playlist: Playlist) => {
                return new dto.PlayListDto(playlist.playlist_id, playlist.title, playlist.description, playlist.length, playlist.download_count);
            });

            const popularResponseDto = new dto.PopularResponseDto(playlistDtos);
            return popularResponseDto;
        } catch (error) {
            throw error;
        }
    }

    @autobind
    async searchPlaylists(searchRequestDto: SearchRequestDto) {
        const { page, search_term } = searchRequestDto;

        try {
            const { limit, offset } = this.getOffsetAndLimit(page);

            const playlists = await this.playlistRepository.getSearchPlaylists(limit, offset, search_term);
            if (playlists.length === 0) return [];

            const searchResponseDto = new dto.SearchResponseDto(playlists);
            return searchResponseDto;
        } catch (error) {
            throw error;
        }
    }

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
            await this.playlistRepository.updateAddDownloadCountPlayllist(playlistData);

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

            const userPlaylistData = new Playlist({ ...playlist, user_id, length });
            const user_playlist = await this.playlistRepository.createPlaylist(userPlaylistData, transaction);

            const songEntities = songs.map((song) => ({
                ...song,
                playlist_id: user_playlist.playlist_id,
            }));

            await this.playlistRepository.bulkCreateSong(songEntities, transaction);

            const createResponseDto = new dto.CreateResponseDto(true);
            await transaction.commit();

            return createResponseDto;
        } catch (error) {
            await transaction.rollback();
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
    async removeStoredPlaylist(deleteStoreRequestDto: DeleteStoreRequestDto, user_id: number) {
        const { id } = deleteStoreRequestDto;

        try {
            const userPlaylistData = new UserPlaylist({ playlist_id: id, user_id });
            await this.playlistRepository.deleteUserPlaylist(userPlaylistData);

            const deleteStoreResponseDto = new dto.DeleteStoreResponseDto(true);
            return deleteStoreResponseDto;
        } catch (error) {
            throw error;
        }
    }
}

import autobind from "autobind-decorator";

import { sequelize } from "../modules/sequelize";
import * as dto from "../dto/playlist";

// type
import IPlayListRepository from "../repositories/interfaces/playlist";
import PlayList from "../models/PlayList";
import UserPlayList from "../models/UserPlayList";
import Song from "../models/Song";
import { PopularRequestDto, SearchRequestDto, StoreRequestDto, CreateRequestDto, DeleteRequestDto, DeleteStoreRequestDto } from "../dto/playlist";

export default class PlayListController {
    constructor(private playlistRepository: IPlayListRepository) {}

    @autobind
    async getPopularPlaylists(popularRequestDto: PopularRequestDto) {
        const { page } = popularRequestDto;
        const per = 8;

        try {
            const playlists = await this.playlistRepository.getPopularPlaylists(page, per);
            if (playlists.length === 0) return [];

            const popularResponseDto = new dto.PopularResponseDto(playlists);
            return popularResponseDto;
        } catch (error) {
            throw error;
        }
    }

    async searchPlaylists(searchRequestDto: SearchRequestDto) {
        const { page, search_term } = searchRequestDto;

        try {
            const playlists = await this.playlistRepository.getSearchPlaylists(page, search_term);
            if (playlists.length === 0) return [];

            const searchResponseDto = new dto.SearchResponseDto(playlists);
            return searchResponseDto;
        } catch (error) {
            throw error;
        }
    }

    async storePlaylist(storeRequestDto: StoreRequestDto, user_id: number) {
        const { id } = storeRequestDto;

        try {
            const userPlayListData = new UserPlayList({
                playlist_id: id,
                user_id,
            });
            const user_playlist = await this.playlistRepository.findOneUserPlayList(userPlayListData);
            if (user_playlist !== null) throw new Error("이미 저장한 플레이 리스트입니다.");

            await this.playlistRepository.createUserPlayList(userPlayListData);

            const storeResponseDto = new dto.StoreResponseDto(true);
            return storeResponseDto;
        } catch (error) {
            throw error;
        }
    }

    async createPlaylist(createRequestDto: CreateRequestDto, user_id: number) {
        const { playlist, songs } = createRequestDto;

        const transaction = await sequelize.transaction();

        try {
            const userPlayListData = new PlayList({ ...playlist, user_id });
            const user_playlist = await this.playlistRepository.createPlayList(userPlayListData, transaction);

            const songEntities = songs.map((song) => new Song({ ...song, playlist_id: user_playlist.isSoftDeleted }));
            await this.playlistRepository.bulkCreateSong(songEntities, transaction);

            const createResponseDto = new dto.CreateResponseDto(true);
            await transaction.commit();

            return createResponseDto;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async deletePlaylist(deleteRequestDto: DeleteRequestDto, user_id: number) {
        const { id } = deleteRequestDto;

        try {
            const playListData = new PlayList({ playlist_id: id, user_id });
            await this.playlistRepository.updatePlayList(playListData);

            const deleteResponseDto = new dto.DeleteResponseDto(true);
            return deleteResponseDto;
        } catch (error) {
            throw error;
        }
    }

    async removeStoredPlaylist(deleteStoreRequestDto: DeleteStoreRequestDto, user_id: number) {
        const { id } = deleteStoreRequestDto;

        try {
            const userPlayListData = new UserPlayList({ playlist_id: id, user_id });
            await this.playlistRepository.deleteUserPlayList(userPlayListData);

            const deleteStoreResponseDto = new dto.DeleteStoreResponseDto(true);
            return deleteStoreResponseDto;
        } catch (error) {
            throw error;
        }
    }
}

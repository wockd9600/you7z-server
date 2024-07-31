import { Transaction } from "sequelize";
import { Op } from "sequelize";

import IPlaylistRepository from "../interfaces/playlist";

import Playlist from "../../models/Playlist";
import UserPlaylist from "../../models/UserPlaylist";
import Song from "../../models/Song";

export default class PlaylistRepository implements IPlaylistRepository {
    async getPopularPlaylists(limit: number, offset: number) {
        try {
            return await Playlist.findAll({
                where: { status: 0 },
                order: [["download_cnt", "DESC"]],
                limit,
                offset,
            });
        } catch (error) {
            throw error;
        }
    }

    async getSearchPlaylists(limit: number, offset: number, search_term: string) {
        try {
            return await Playlist.findAll({
                where: {
                    [Op.or]: [{ title: { [Op.like]: `%${search_term}%` } }, { description: { [Op.like]: `%${search_term}%` } }, { status: 0 }],
                },
                order: [["download_cnt", "DESC"]],
                limit,
                offset,
            });
        } catch (error) {
            throw error;
        }
    }

    async findOneUserPlaylist(user_playlist: UserPlaylist) {
        const { playlist_id, user_id } = user_playlist;

        try {
            return await UserPlaylist.findOne({
                where: {
                    playlist_id,
                    user_id,
                },
            });
        } catch (error) {
            throw error;
        }
    }

    async createPlaylist(playlist: Playlist, transaction: Transaction) {
        try {
            return await Playlist.create({ ...playlist }, { transaction });
        } catch (error) {
            throw error;
        }
    }

    async createUserPlaylist(user_playlist: UserPlaylist) {
        const { playlist_id, user_id } = user_playlist;

        try {
            return await UserPlaylist.create({
                playlist_id,
                user_id,
            });
        } catch (error) {
            throw error;
        }
    }

    async bulkCreateSong(songs: Partial<Song>[], transaction: Transaction) {
        try {
            await Song.bulkCreate(songs, {
                validate: true,
                individualHooks: true,
                transaction,
            });
        } catch (error) {
            throw error;
        }
    }

    async updatePlaylist(playlist: Playlist) {
        const { playlist_id, user_id } = playlist;

        try {
            await Playlist.update(
                { is_delete: 1 },
                {
                    where: { playlist_id, user_id },
                }
            );
        } catch (error) {
            throw error;
        }
    }

    async deleteUserPlaylist(user_playlist: UserPlaylist) {
        const { playlist_id, user_id } = user_playlist;

        try {
            await UserPlaylist.destroy({ where: { playlist_id, user_id } });
        } catch (error) {
            throw error;
        }
    }
}

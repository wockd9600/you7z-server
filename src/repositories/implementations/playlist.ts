import { Transaction } from "sequelize";
import { Op, Sequelize } from "sequelize";

import IPlaylistRepository from "../interfaces/playlist";

import Playlist from "../../models/Playlist";
import Song from "../../models/Song";

enum PlaylistType {
    POPULAR,
    // MY,
    CREATED,
    // MY_WITH_CREATED,
}

export default class PlaylistRepository implements IPlaylistRepository {
    async getPlaylists(limit: number, offset: number, user_id: number, type: number, search_term?: string | undefined) {
        const whereCondition: any = { status: 1 };
        if (search_term) {
            whereCondition[Op.or] = [
                { title: { [Op.like]: `%${search_term}%` } },
                // { description: { [Op.like]: `%${search_term}%` } }
            ];
        }

        if (type === PlaylistType.CREATED) {
            delete whereCondition.status;
            whereCondition.user_id = user_id;
        }

        // const includeCondition: any = [];
        // const joinUserPlaylist = {
        //     model: UserPlaylist,
        //     attributes: [[Sequelize.literal(`CASE WHEN UserPlaylists.playlist_id IS NOT NULL THEN 1 ELSE 0 END `), "downloaded"]],
        //     where: { user_id },
        //     required: false, // LEFT JOIN
        // };

        // if (type === PlaylistType.MY) {
        // joinUserPlaylist.required = true;
        // whereCondition.user_id = { [Op.ne]: user_id };

        // includeCondition.push(joinUserPlaylist);
        // } else if (type === PlaylistType.MY_WITH_CREATED) {
        // delete whereCondition.status;
        // joinUserPlaylist.required = true;
        // includeCondition.push(joinUserPlaylist);
        // } else if (type === PlaylistType.CREATED) {
        //     delete whereCondition.status;
        //     whereCondition.user_id = user_id;
        // } else {
        // if (search_term) {
        //     whereCondition[Op.or] = [
        //         { title: { [Op.like]: `%${search_term}%` } },
        //         // { description: { [Op.like]: `%${search_term}%` } }
        //     ];
        // }
        // includeCondition.push(joinUserPlaylist);
        // }
        // if (created_user_id !== null) {
        //     whereCondition.user_id = created_user_id;
        // }
        // const includeCondition: any = { status: 1 };
        // if (created_user_id !== null) {
        //     whereCondition.user_id = created_user_id;
        // }

        try {
            return await Playlist.findAll({
                where: whereCondition,
                order: [["download_count", "DESC"]],
                limit,
                offset,
                // include: includeCondition,
                // attributes: ["playlist_id", "title", "description", "length", "download_count", [Sequelize.col("user_playlist.user_id"), "user_id"]],
                // raw: true,
            });
        } catch (error) {
            throw error;
        }
    }

    async getSearchPlaylists(limit: number, offset: number, search_term: string) {
        try {
            return await Playlist.findAll({
                where: {
                    [Op.or]: [{ title: { [Op.like]: `%${search_term}%` } }, { description: { [Op.like]: `%${search_term}%` } }, { status: 1 }],
                },
                order: [["download_count", "DESC"]],
                limit,
                offset,
            });
        } catch (error) {
            throw error;
        }
    }

    async findOnePlaylist(playlist: Playlist) {
        try {
            const { playlist_id, user_id } = playlist;
            const whereCondition: any = {};

            if (playlist_id !== undefined) whereCondition.playlist_id = playlist_id;
            if (user_id !== undefined) whereCondition.user_id = user_id;

            return await Playlist.findOne({
                where: whereCondition,
            });
        } catch (error) {
            throw error;
        }
    }

    // async findOneUserPlaylist(user_playlist: UserPlaylist) {
    //     try {
    //         const { playlist_id, user_id } = user_playlist;
    //         const whereCondition: any = {};

    //         if (playlist_id !== undefined) whereCondition.playlist_id = playlist_id;
    //         if (user_id !== undefined) whereCondition.user_id = user_id;

    //         return await UserPlaylist.findOne({
    //             where: whereCondition,
    //         });
    //     } catch (error) {
    //         throw error;
    //     }
    // }

    async createPlaylist(playlist: Playlist, transaction: Transaction) {
        const { title, description, length, user_id } = playlist;
        try {
            return await Playlist.create({ title, description, length, user_id }, { transaction });
        } catch (error) {
            throw error;
        }
    }

    // async createUserPlaylist(user_playlist: UserPlaylist, transaction?: Transaction) {
    //     const { playlist_id, user_id } = user_playlist;

    //     try {
    //         return await UserPlaylist.create(
    //             {
    //                 playlist_id,
    //                 user_id,
    //             },
    //             { transaction }
    //         );
    //     } catch (error) {
    //         throw error;
    //     }
    // }

    async bulkCreateSong(songs: Partial<Song>[], transaction: Transaction) {
        try {
            const songDataValues = songs.map((song) => song.dataValues); // dataValues만 추출
            await Song.bulkCreate(songDataValues, {
                validate: true,
                individualHooks: true,
                transaction,
            });
        } catch (error) {
            throw error;
        }
    }

    async updateDeletePlaylist(playlist: Playlist) {
        const { playlist_id, user_id } = playlist;

        try {
            await Playlist.update(
                { status: 0 },
                {
                    where: { playlist_id, user_id },
                }
            );
        } catch (error) {
            throw error;
        }
    }

    async increaseDownloadCountPlayllist(playlist: Playlist) {
        const { playlist_id } = playlist;

        try {
            await Playlist.increment({ download_count: 1 }, { where: { playlist_id } });
        } catch (error) {
            throw error;
        }
    }

    async decreaseDownloadCountPlayllist(playlist: Playlist) {
        const { playlist_id } = playlist;

        try {
            await Playlist.decrement({ download_count: 1 }, { where: { playlist_id } });
        } catch (error) {
            throw error;
        }
    }

    // async deleteUserPlaylist(user_playlist: UserPlaylist) {
    //     const { playlist_id, user_id } = user_playlist;

    //     try {
    //         await UserPlaylist.destroy({ where: { playlist_id, user_id } });
    //     } catch (error) {
    //         throw error;
    //     }
    // }
}

import { Transaction } from "sequelize";
import { Op } from "sequelize";

import IGameRepository from "../interfaces/game";

import GameRoom from "../../models/GameRoom";
import GameSession from "../../models/GameSession";
import Song from "../../models/Song";
import UserProfile from "../../models/UserProfile";
import Playlist from "../../models/Playlist";
import UserPlaylist from "../../models/UserPlaylist";

export default class GameRepository implements IGameRepository {
    async findOneGameRoom(gameRoomData: GameRoom) {
        const { room_id, room_code } = gameRoomData;

        try {
            return await GameRoom.findOne({
                where: { [Op.or]: [{ room_id }, { room_code }], status: 0 },
                order: [["created_at", "DESC"]],
            });
        } catch (error) {
            throw error;
        }
    }

    async findOneGameSession(gameRoomData: GameSession) {
        const { room_id, session_id } = gameRoomData;

        try {
            return await GameSession.findOne({
                where: { [Op.or]: [{ room_id }, { session_id }] },
                order: [["created_at", "DESC"]],
            });
        } catch (error) {
            throw error;
        }
    }

    async findOnePlayList(playlistData: Playlist) {
        const { playlist_id } = playlistData;

        try {
            return await Playlist.findOne({
                where: { playlist_id },
            });
        } catch (error) {
            throw error;
        }
    }

    async findOneUserPlayList(userPlaylistData: UserPlaylist) {
        const { user_id } = userPlaylistData;

        try {
            return await UserPlaylist.findOne({
                where: { user_id },
            });
        } catch (error) {
            throw error;
        }
    }

    async findOneSong(songData: Partial<Song>) {
        const { song_id } = songData;

        try {
            return await Song.findOne({
                where: { song_id },
            });
        } catch (error) {
            throw error;
        }
    }

    async findAllSong(gameRoomData: Partial<GameSession>) {
        const { playlist_id } = gameRoomData;

        try {
            return await Song.findAll({
                attributes: ["song_id"],
                where: { playlist_id },
            });
        } catch (error) {
            throw error;
        }
    }

    async findAllUserName(user_ids: number[]) {
        try {
            return await UserProfile.findAll({
                where: {
                    user_id: {
                        [Op.in]: user_ids,
                    },
                },
            });
        } catch (error) {
            throw error;
        }
    }

    async createGameRoom(gameRoomData: GameRoom, transaction: Transaction) {
        const { room_code } = gameRoomData;

        try {
            return await GameRoom.create({ room_code }, { transaction });
        } catch (error) {
            throw error;
        }
    }

    async createGameSession(gameRoomData: GameSession, transaction: Transaction) {
        // const { room_id, playlist_id, user_id } = gameRoomData;

        try {
            return await GameSession.create({ ...gameRoomData.dataValues }, { transaction });
        } catch (error) {
            throw error;
        }
    }

    async updateGameRoom(gameRoomData: GameRoom) {
        const { room_id, status } = gameRoomData;

        const updateData: any = {};
        if (status !== undefined) updateData.status = status;

        try {
            await GameSession.update(updateData, {
                where: { room_id },
            });
        } catch (error) {
            throw error;
        }
    }

    async updateGameSession(gameRoomData: GameSession, transaction: Transaction) {
        try {
            const { status, session_id, user_id, game_type, goal_score, playlist_id, question_order } = gameRoomData;
            const updateData: any = {};

            if (status !== undefined) updateData.status = status;
            if (user_id !== undefined) updateData.user_id = user_id;
            if (game_type !== undefined) updateData.game_type = game_type;
            if (goal_score !== undefined) updateData.goal_score = goal_score;
            if (playlist_id !== undefined) updateData.playlist_id = playlist_id;
            if (question_order !== undefined) updateData.question_order = question_order;

            await GameSession.update(updateData, {
                where: { session_id },
                transaction,
            });
        } catch (error) {
            throw error;
        }
    }
}

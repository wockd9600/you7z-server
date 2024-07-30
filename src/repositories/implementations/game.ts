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
        const { room_code } = gameRoomData;

        try {
            return await GameRoom.findOne({
                where: { room_code },
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

    async findOneSong(songData: Song) {
        const { song_id } = songData;

        try {
            return await Song.findOne({
                where: { song_id },
            });
        } catch (error) {
            throw error;
        }
    }

    async findAllUserName(user_ids: number[]) {
        try {
            return await UserProfile.findAll({
                where: { user_ids },
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
        const { room_id, playlist_id } = gameRoomData;

        try {
            return await GameSession.create({ room_id, playlist_id }, { transaction });
        } catch (error) {
            throw error;
        }
    }
}

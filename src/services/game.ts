import autobind from "autobind-decorator";

import { sequelize } from "../modules/sequelize";
import * as dto from "../dto/game";

import createRedisUtil, { RedisUtil } from "../utils/redis";
import { fetchGameRoomUsersData, createUniqueRoomCode, getGameSessionFromRoomCode } from "../helper/game";

import IGameRepository from "../repositories/interfaces/game";

import GameRoom from "../models/GameRoom";
import Song from "../models/Song";
import GameSession from "../models/GameSession";
import Playlist from "../models/Playlist";
import UserPlaylist from "../models/UserPlaylist";

import { RoomInfoRequestDto } from "../dto/game";

enum GAME_STATUS {
    NOT_STARTED = 0,
    STARTED = 1,
    NOT_DELETED = 0,
    DELETED = 1,
}

export default class GameService {
    constructor(private gameRepository: IGameRepository) {}

    // @autobind
    // async verifyUserInOtherRoom(user_id: number, session_id: number) {
    //     await RedisUtil.deleteUserInOtherRoom(session_id, user_id);
    //     const previousGameSession = await this.gameRepository.findOneGameSession(new GameSession({ session_id }));
    //     if (previousGameSession === null) throw new Error("방 정보를 찾을 수 없습니다. (previous GameSession 조회 실패)");

    //     const previousGameRoom = await this.gameRepository.findOneGameRoom(new GameRoom({ room_id: previousGameSession.room_id }));
    //     if (previousGameRoom === null) throw new Error("방 정보를 찾을 수 없습니다. (previous GameRoom 조회 실패)");

    //     if (previousGameRoom.status === GAME_STATUS.NOT_DELETED) return { success: false, room_code: previousGameRoom.room_code };

    //     return { success: true };
    // }

    @autobind
    async getRoomInfo(room_code: string, user_id: number) {
        // 코드를 전달 받음.

        try {
            // room_code로 game table, session table row 가져옴
            const { gameSession } = await getGameSessionFromRoomCode(this.gameRepository, room_code);

            // 방에 입장 되어 있는지 확인함
            const gameRedis = await createRedisUtil(gameSession.session_id);
            if (!gameRedis.isUserInRoom(user_id)) return { success: false, message: "입장할 수 없는 방입니다." };

            // 정보 전달
            const playlistData = new Playlist({ playlist_id: gameSession.playlist_id });
            const gamePlaylist = await this.gameRepository.findOnePlayList(playlistData);
            if (gamePlaylist === null) throw new Error("방 정보를 찾을 수 없습니다. (Playlist 조회 실패)");

            // --- 시작한 방일 때 ---
            // (redis) 현재 노래 song_id 가져옴
            // song_id로 url, 등등 가져옴
            const currentSongId = await gameRedis.getCurrentSongId();
            const songData = new Song({ song_id: currentSongId, playlist_id: gamePlaylist.playlist_id });
            const song = currentSongId ? await this.gameRepository.findOneSong(songData) : null;

            // 게임방에 입장한 유저들 데이터 가져옴.
            const gameRoomUsersData = await fetchGameRoomUsersData(this.gameRepository, gameRedis);

            // 게임 설정, 입장한 유저들 정보를 클라이언트에 전달
            const gameSettingDto = new dto.GameSettingDto(gameSession, gamePlaylist);
            const roomInfoResponseDto = new dto.RoomInfoResponseDto(gameSession.status, room_code, gameSettingDto, gameRoomUsersData, song);
            return { success: true, roomData: roomInfoResponseDto };
        } catch (error) {
            throw error;
        }
    }

    @autobind
    async enterRoom(roomInfoRequestDto: RoomInfoRequestDto, user_id: number) {
        // 코드를 전달 받음.
        const { roomCode } = roomInfoRequestDto;

        try {
            // room_code로 game table, session table row 가져옴
            const { gameSession } = await getGameSessionFromRoomCode(this.gameRepository, roomCode);

            const previous_session_id = await RedisUtil.getUserOtherSessionId(user_id);

            // 접속 중인 방이 있으면
            if (previous_session_id !== -1) {
                // 접속 중인 방이 입장하려는 방이면 입장
                if (gameSession.session_id === previous_session_id) {
                    return { success: true };
                } else {
                    // 접속 중인 방이 다른 방이면 나감
                    const previousGameRedis = await createRedisUtil(previous_session_id);
                    await previousGameRedis.deleteUser(user_id);
                }
            }

            const gameRedis = await createRedisUtil(gameSession.session_id);

            // (redis) 인원수 문제 없는지 확인
            if (!gameRedis.checkUserCount()) return { success: false, message: "인원이 가득찬 방입니다." };

            // 시작한 방인지 확인함.
            if (gameSession.status === GAME_STATUS.DELETED) return { success: false, message: "존재하지 않는 방입니다." };
            if (gameSession.status === GAME_STATUS.STARTED) return { success: false, message: "이미 시작한F 방입니다." };

            // (redis) 인원수 한 명 추가
            gameRedis.addUser(user_id);

            return { success: true };
        } catch (error) {
            throw error;
        }
    }

    @autobind
    async createRoom(user_id: number) {
        const transaction = await sequelize.transaction();

        try {
            // user id를 전달 받고
            // 입장 중인 방 없는지 확인
            const session_id = await RedisUtil.getUserOtherSessionId(user_id);
            if (session_id) {
                //     const isEnter = await this.verifyUserInOtherRoom(user_id, session_id);
                //     if (isEnter.success === false) {
                //         return {
                //             success: false,
                //             message: "사용자가 이미 다른 방에 있습니다.",
                //             room_code: isEnter.room_code,
                //         };
                //     }
                // 입장 중이던 방에서 나감.
                const gameRedis = await createRedisUtil(session_id);
                gameRedis.deleteUser(user_id);
            }

            // create room, gamesession 생성
            const room_code = await createUniqueRoomCode(this.gameRepository);

            const gameRoomData = new GameRoom({ room_code });
            const gameRoom = await this.gameRepository.createGameRoom(gameRoomData, transaction);
            if (gameRoom === null) throw new Error("방 정보를 찾을 수 없습니다. (GameRoom 생성 실패)");

            const userPlaylistData = new UserPlaylist({ user_id });
            const userPlaylist = await this.gameRepository.findOneUserPlayList(userPlaylistData);
            if (userPlaylist === null) {
                return {
                    success: false,
                    message: "저장한 노래모음이 없습니다.",
                };
            }

            const gameSessionData = new GameSession({ room_id: gameRoom.room_id, user_id, playlist_id: userPlaylist.playlist_id });
            const gameSession = await this.gameRepository.createGameSession(gameSessionData, transaction);
            if (gameSession === null) throw new Error("방 정보를 찾을 수 없습니다. (GameSession 생성 실패)");

            // 인원수 추가
            const gameRedis = await createRedisUtil(gameSession.session_id);

            gameRedis.addUser(user_id);
            gameRedis.setRoomManager(user_id);

            // const playlistData = new Playlist({ playlist_id: gameSession.playlist_id });
            // const gamePlaylist = await this.gameRepository.findOnePlayList(playlistData);
            // if (gamePlaylist === null) throw new Error("방 정보를 찾을 수 없습니다. (Playlist 생성 실패)");

            // // 게임방에 입장한 유저들 데이터 가져옴.
            // const gameRoomUsersData = await fetchGameRoomUsersData(this.gameRepository, gameRedis);

            // 게임 설정, 입장한 유저들 정보를 클라이언트에 전달
            // const gameSettingDto = new dto.GameSettingDto(gameSession, gamePlaylist);
            // const createRoomResponseDto = new dto.CreateRoomResponseDto(gameSettingDto, gameRoomUsersData, null);

            await transaction.commit();
            return { success: true, roomCode: room_code };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

import { Socket, Namespace } from "socket.io";
import autobind from "autobind-decorator";

import { sequelize } from "../../modules/sequelize";

import createRedisUtil from "../../utils/redis";
import { generateRandomOrder, getGameSessionFromRoomCode } from "../../helper/game";

import GameRepository from "../../repositories/interfaces/game";
import GameSession from "../../models/GameSession";
import Song from "../../models/Song";
import GameRoom from "../../models/GameRoom";

// jwt 확인

export default class GameController {
    constructor(private gameRepository: GameRepository) {}

    @autobind
    async startGame(io: Namespace, socket: Socket, params: any) {
        const transaction = await sequelize.transaction();

        // room_code로 session_table row 가져옴
        try {
            const { room_code } = params.data;
            const { user_id } = socket.data.user;

            const { gameSession } = await getGameSessionFromRoomCode(this.gameRepository, room_code);

            const gameRedis = await createRedisUtil(gameSession.session_id);

            // (redis) 방장인지 확인
            const manager_id = gameRedis.getRoomMangerId();
            if (manager_id !== user_id) throw new Error("can't start game because you are not manager");

            // (redis) 인원수 문제 없는지 확인
            if (!gameRedis.checkUserCount()) throw new Error("invalid user length");

            // session 테이블의 playlist id로 플레이리스트 가져옴.
            const sessionData = new GameSession({ playlist_id: gameSession.playlist_id });
            const songs = await this.gameRepository.findAllSong(sessionData);
            if (songs.length === 0) throw new Error("song length is 0");
            if (songs.length > gameSession.goal_score) throw new Error("목표 점수가 너무 높습니다.");

            // 랜덤으로 순서를 전부 뽑는다.
            const question_order = generateRandomOrder(songs, gameSession.goal_score);

            // (redis) 현재 노래 설정
            const current_song_id = question_order[0].song_id;
            gameRedis.setCurrentSongId(current_song_id);

            // 게임 시작
            // session table status = 1, song_order = [order]
            const gameRoomData = new GameSession({ session_id: gameSession.session_id, status: 0, question_order: JSON.stringify(question_order) });
            await this.gameRepository.updateGameSession(gameRoomData, transaction);

            // 노래 url을 방에 있는 사람에게 전부 전달 emit
            const songData = new Song({ song_id: current_song_id });
            const song = await this.gameRepository.findOneSong(songData);
            if (song === null) throw new Error("not song");

            await transaction.commit();

            const responseData = { url: song?.url, startTime: song.start_time };
            io.to(room_code).emit("game start", responseData);
        } catch (error) {
            await transaction.rollback();
            socket.emit("error", { status: 401, message: "알 수 없는 이유로 게임을 시작할 수 없습니다." });
        }
    }

    @autobind
    async playSong(io: Namespace, socket: Socket, params: any) {
        // room_code로 session_table row 가져옴
        try {
            const { room_code } = params.data;
            const { user_id } = socket.data.user;

            // room_code로 session_table row 가져옴
            const { gameSession } = await getGameSessionFromRoomCode(this.gameRepository, room_code);
            if (gameSession.status === 0) throw new Error("not started yet ");

            const gameRedis = await createRedisUtil(gameSession.session_id);

            // (redis) 플레이 준비 완료
            await gameRedis.agreeNextAction(user_id);

            const isAllAgree = await gameRedis.isALLAgreeNextAction();
            // --- (redis) 유저들의 동영상 로딩이 전부 준비 되면 ---
            if (isAllAgree) {
                // (redis) 준비 완료 초기화
                gameRedis.resetAgreeNextAction();
                // 노래 재생! emit
                // ready all로 바꾸고 *수정
                // play song은 노래가 끝나고 에밋하는 걸로 바꿀까 흠
                return io.to(room_code).emit("play song");
            } else {
                // --- (redis) 유저들의 동영상 로딩이 전부 준비 되지 않으면 ---
                // 노래 재생 준비 완료
                // 재생 준비는 ok 안보여줘도 됨. 안될 때 delay 표시 하자
                return socket.emit("ready song");

                // client는 노래가 끝나면 바로 처음으로 돌림.
                // full 버전은 최대 1분
                // 1s 버전은 (1s, 1s, 1s, 2초 3초 5초)

                // 클라이언트에서 재생 준비 다시 할 수 있게 함.
                // 노래를 다시 보냄.
            }
        } catch (error) {
            socket.emit("error", { status: 401, message: "노래를 재생할 수 없습니다." });
        }
    }

    @autobind
    async passSong(io: Namespace, socket: Socket, params: any) {
        try {
            const { room_code } = params.data;
            const { user_id } = socket.data.user;

            // room_code로 session_table row 가져옴
            const { gameSession } = await getGameSessionFromRoomCode(this.gameRepository, room_code);

            const gameRedis = await createRedisUtil(gameSession.session_id);

            // (redis) 패스 신청
            await gameRedis.agreeNextAction(user_id);

            const isAllAgree = await gameRedis.isALLAgreeNextAction();
            // --- (redis) 유저들이 모두 패스 신청하면 ---
            if (isAllAgree) {
                // (redis) 패스 신청 초기화
                gameRedis.resetAgreeNextAction();
                // pass_count
                // 노래 패스 *수정
                // 다음 곡
                // 정답 나와도 resetAgreeNextAction해야함.
            }
        } catch (error) {
            socket.emit("error", { status: 401, message: "노래를 패스할 수 없습니다." });
        }
    }

    @autobind
    async kickUser(io: Namespace, socket: Socket, params: any) {
        try {
            // user id와 kick할 user id를 가져와서
            const { room_code, kicked_user_id } = params.data;
            const { user_id } = socket.data.user;

            // room_code로 session_table row 가져옴
            const { gameSession } = await getGameSessionFromRoomCode(this.gameRepository, room_code);

            // 게임 중이면 강퇴x
            if (gameSession.status === 1) throw new Error("already started game");

            const gameRedis = await createRedisUtil(gameSession.session_id);

            // (redis) 유저가 방장인지 확인
            if (gameRedis.getRoomMangerId() !== user_id) throw new Error("can't kick user because you are not manager");
            if (user_id !== kicked_user_id) throw new Error("can't kick myself");

            // (redis) 유저가 있는지 확인확인
            const users = gameRedis.getUsers();
            const userExists = users.some((user) => user.user_id === kicked_user_id);

            if (!userExists) throw new Error("don't exist user");

            // (redis) 유저 삭제
            gameRedis.deleteUser(kicked_user_id);

            // 방의 유저들에게 알려줌. 해당 유저는 방에서 강퇴 emit
            const responseData = { user_id: kicked_user_id };
            io.to(room_code).emit("user kick", responseData);
        } catch (error) {
            socket.emit("error", { status: 401, message: "강퇴할 수 없다." });
        }
    }

    @autobind
    async updateRoomSettings(io: Namespace, socket: Socket, params: any) {
        // user id와 game code, 변경할 key, value를 받는다.
        const { room_code, key, value } = params.data;
        const { user_id } = socket.data.user;

        try {
            const { gameSession } = await getGameSessionFromRoomCode(this.gameRepository, room_code);

            // 시작한 방인지 확인함.
            if (gameSession.status === 1) throw new Error("already started game");

            const gameRedis = await createRedisUtil(gameSession.session_id);

            // (redis) 유저가 방장인지 확인
            if (gameRedis.getRoomMangerId() !== user_id) throw new Error("can't kick user because you are not manager");

            // 게임방 설정 변경
            const gameRoomData = new GameSession({ session_id: gameSession.session_id, [key]: value });
            await this.gameRepository.updateGameSession(gameRoomData);

            // 변경할 설정을 적용한다.
            // 방에 있는 사람들에게 전달 emit
            const responseData = { [key]: value };
            io.to(room_code).emit("change game setting", responseData);
        } catch (error) {
            socket.emit("error", { status: 401, message: "설정을 변경할 수 없습니다." });
        }
    }

    @autobind
    async changeUserName(io: Namespace, socket: Socket, params: any) {
        const { room_code, id, nickname } = params.data;

        try {
            const { gameSession } = await getGameSessionFromRoomCode(this.gameRepository, room_code);
            if (gameSession.status === 1) throw new Error("already started game");

            // 방에 있는 사람들에게 user name을 보낸다.
            const responseData = { id, nickname };
            io.to(room_code).emit("change user name", responseData);
        } catch (error) {
            socket.emit("error", { status: 401, message: "이름을F 변경할 수 없습니다." });
        }
    }

    @autobind
    async leaveRoom(io: Namespace, socket: Socket, params: any) {
        try {
            // user id와 code를 받는다.
            const { room_code } = params.data;
            const { user_id } = socket.data.user;

            // room_code로 session_table row 가져옴
            const { gameRoom, gameSession } = await getGameSessionFromRoomCode(this.gameRepository, room_code);

            // 시작했으면 나갈 수 없음.
            if (gameSession.status === 1) throw new Error("already started game");

            const gameRedis = await createRedisUtil(gameSession.session_id);

            // (redis) 현재 유저들 가져옴
            const users = gameRedis.getUsers();
            // 1명이면 방을 삭제함
            if (users.length === 1) {
                gameRedis.deleteRoom(user_id);
                const gameRoomData = new GameRoom({ room_id: gameRoom.room_id, status: 1 });
                const sessionData = new GameSession({ session_id: gameSession.session_id, status: 1 });

                await Promise.all([this.gameRepository.updateGameRoom(gameRoomData), this.gameRepository.updateGameSession(sessionData)]);
            } else {
                await gameRedis.deleteUser(user_id);

                // 방장이면 다음 순서를 방장으로 바꿈
                if (gameRedis.getRoomMangerId() === user_id) {
                    const users = gameRedis.getUsers();
                    gameRedis.setRoomManager(users[0].user_id);
                }
            }

            const responseData = { id: user_id };
            io.to(room_code).emit("leave game", responseData);
        } catch (error) {
            socket.emit("error", { status: 401, message: "이름을F 변경할 수 없습니다." });
        }
    }

    // 다른 메서드들...
}

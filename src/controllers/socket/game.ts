import { Socket, Namespace } from "socket.io";
import autobind from "autobind-decorator";

import { sequelize } from "../../modules/sequelize";

import createRedisUtil from "../../utils/redis";
import { generateRandomOrder, getGameSessionFromRoomCode, showAnswerAndNextSong } from "../../helper/game";
import { RoomTimer, UserTimer } from "../../utils/timer";

import GameRepository from "../../repositories/interfaces/game";
import PlaylistRepository from "../../repositories/implementations/playlist";
import AnswerRepository from "../../repositories/implementations/answer";
import UserRepository from "../../repositories/implementations/user";

import GameSession from "../../models/GameSession";
import Song from "../../models/Song";
import GameRoom from "../../models/GameRoom";
import Playlist from "../../models/Playlist";
import Answer from "../../models/Answer";
import User from "../../models/User";

import { logErrorSocket } from "../../utils/error";
import { GameAnswerDto, GameSongDto, GamePlaylistDto } from "../../dto/game";

// jwt 확인

export default class GameController {
    constructor(private gameRepository: GameRepository, private playlistRepository: PlaylistRepository, private userRepository: UserRepository, private answerRepository: AnswerRepository) {}

    async alertAnswer(data: { session_id: number; user_id?: number; answer_user_id: number; message: string }) {
        const { session_id, user_id, answer_user_id, message } = data;

        let name = "";
        if (user_id) {
            const userProfileData = new User({ user_id });
            const userProfile = await this.userRepository.findOneUserProfile(userProfileData);
            if (userProfile === null) throw new Error("don't exist user id");
            name = userProfile.nickname;
        }

        const answerData = new Answer({ session_id, user_id: answer_user_id, content: `${name}${message}`, is_alert: 1 });
        const answer = await this.answerRepository.createAnswer(answerData);
        const answerDto = new GameAnswerDto({ ...answer.dataValues });

        return answerDto;
    }

    @autobind
    async disconnect(io: Namespace, socket: Socket) {
        const { userId, roomCode } = socket.data;

        if (roomCode === undefined || userId === undefined) return;

        try {
            const { gameRoom, gameSession } = await getGameSessionFromRoomCode(this.gameRepository, roomCode);
            const gameRedis = await createRedisUtil(gameSession.session_id);

            // 게임 불가능한 유저일 경우 연결 끊김으로 처리하지 않음.
            if (!gameRedis.isUserInRoom(userId)) return;

            // 게임이 끝났으면 처리x
            // 게임 끝났을 때 코드가 없네?
            // if (gameSession.status === 1)

            const leaveGameTimeout = async () => {
                // 게임이 시작되었을 때
                if (gameSession.status === 1) {
                    // 연결 끊김 처리
                    // status 변경
                    await gameRedis.setUserStatus(userId, -1);
                    io.to(roomCode).emit("change user status", { userId, status: -1 });

                    // 유저의 상태가 모두 0이하일 경우 방 폭파
                    // 관전자는 카운트에서 제외함.
                    // 방 나갈 때 게임 세션 말고 게임 테이블도 없애줘야해
                    const isAllDisconnect = await gameRedis.isALLUserStatus();
                    if (isAllDisconnect) {
                        gameRedis.deleteRoom();
                        const gameRoomData = new GameRoom({ room_id: gameRoom.room_id, status: 1 });
                        const sessionData = new GameSession({ session_id: gameSession.session_id, status: 1 });

                        await Promise.all([this.gameRepository.updateGameRoom(gameRoomData), this.gameRepository.updateGameSession(sessionData)]);

                        RoomTimer.clearTimer(roomCode);
                        // 관전자에게 플레이 중인 유저가 모두 나갔다고 알림을 줌.
                        io.to(roomCode).emit("error", { status: 401, message: "존재하지 않는 방입니다." });
                        return;
                    }

                    UserTimer.clearTimer(userId);
                }
                // 게임이 시작되지 않았을 때
                else {
                    await this.leaveRoom(io, socket, {});
                    UserTimer.clearTimer(userId);
                }
            };

            // const delay = gameSession.status === 1 ? 3000 : 0;
            UserTimer.startTimer(userId, 3000, leaveGameTimeout);
        } catch (error) {
            let message = "연결 해제 오류";
            if (error instanceof Error) {
                logErrorSocket(error, socket, {});
                message = error.message;
            }
            io.to(roomCode).emit("error", { status: 401, message });
        }
    }

    @autobind
    async startGame(io: Namespace, socket: Socket, params: any) {
        const transaction = await sequelize.transaction();

        // room_code로 session_table row 가져옴
        try {
            const { userId, roomCode } = socket.data;

            const { gameSession } = await getGameSessionFromRoomCode(this.gameRepository, roomCode);

            // 방장인지 확인
            if (gameSession.user_id !== userId) throw new Error("you're not manager");

            const gameRedis = await createRedisUtil(gameSession.session_id);
            if (!gameRedis.isUserInRoom(userId)) throw new Error("don't exist user in room");

            // (redis) 인원수 문제 없는지 확인
            if (!(await gameRedis.isStart())) throw new Error("인원이 너무 적습니다.");

            // session 테이블의 playlist id로 플레이리스트 가져옴.
            const playlistData = new Playlist({ playlist_id: gameSession.playlist_id });
            const sessionData = new GameSession({ playlist_id: gameSession.playlist_id });

            const [playlist, songs] = await Promise.all([this.playlistRepository.findOnePlaylist(playlistData), this.gameRepository.findAllSong(sessionData)]);
            if (playlist === null) throw new Error("playlist is null");
            if (songs.length === 0) throw new Error("song length is 0");
            if (songs.length > gameSession.goal_score) throw new Error("목표 점수가 너무 높습니다.");

            // 랜덤으로 순서를 전부 뽑는다.
            const question_order = generateRandomOrder(songs);

            // (redis) 현재 노래 설정
            const current_song_id = question_order[0];
            gameRedis.setCurrentSongId(current_song_id);

            // 노래 정보 가져옴
            const songData = new Song({ song_id: current_song_id });
            const song = await this.gameRepository.findOneSong(songData);
            if (song === null) throw new Error("not song");

            // 게임 시작
            // session table status = 1, song_order = [order]
            const gameRoomData = new GameSession({ session_id: gameSession.session_id, status: 1, question_order: JSON.stringify(question_order) });
            await this.gameRepository.updateGameSession(gameRoomData, transaction);

            // 노래 시작 시간 치환
            const [hours, minutes, seconds] = song.start_time.split(":").map(Number);
            const start_time = hours * 3600 + minutes * 60 + seconds;

            // 클라이언트에 보낼 데이터로 변형
            const gmaePlaylistData = new GamePlaylistDto({ ...playlist.dataValues });
            const gmaeSongData = new GameSongDto({ ...song.dataValues, start_time });

            // emit
            io.to(roomCode).emit("game start", { gmaeSongData, gmaePlaylistData });

            const playSongTimer = async (retryCount = 0, maxRetries = 10) => {
                // io.to(roomCode).emit("play song");
                try {
                    const isAllAgree = await gameRedis.isALLAgreeNextAction();
                    if (isAllAgree) {
                        gameRedis.resetAgreeNextAction();
                        gameRedis.setPossibleAnswer(true);
                        // 노래 재생! emit
                        io.to(roomCode).emit("play song");

                        RoomTimer.startTimer(roomCode, 50000, () => showAnswerAndNextSong(this.gameRepository, io, roomCode));
                    } else {
                        if (retryCount < maxRetries) {
                            const notAgreeUsers = await gameRedis.getDisagreeUsersNextAction();
                            if (notAgreeUsers.length !== 0) {
                                io.to(roomCode).emit("next song", gmaeSongData, notAgreeUsers);
                            }
                            RoomTimer.startTimer(roomCode, 3000, () => playSongTimer(retryCount + 1, maxRetries));
                        } else {
                            // 30번이나 요청해도 안되면 그냥 시작
                            io.to(roomCode).emit("play song");
                            RoomTimer.startTimer(roomCode, 50000, () => showAnswerAndNextSong(this.gameRepository, io, roomCode));
                        }
                    }
                } catch (error) {
                    let message = "노래 재생 오류";
                    if (error instanceof Error) {
                        logErrorSocket(error, socket, params);
                        message = error.message;
                    }
                    io.to(roomCode).emit("error", { status: 401, message });
                }
            };

            RoomTimer.startTimer(roomCode, 6000, playSongTimer);

            await transaction.commit();
        } catch (error) {
            console.log(error);
            if (transaction) transaction.rollback();
            let message = "알 수 없는 이유로 게임을 시작할 수 없습니다.";
            if (error instanceof Error) {
                logErrorSocket(error, socket, params);
                message = error.message;
            }
            socket.emit("error", { status: 401, message });
        }
    }

    @autobind
    async getSong(io: Namespace, socket: Socket, params: any) {
        // room_code로 session_table row 가져옴
        try {
            const { userId, roomCode } = socket.data;

            // room_code로 session_table row 가져옴
            const { gameSession } = await getGameSessionFromRoomCode(this.gameRepository, roomCode);
            if (gameSession.status === 0) throw new Error("not started yet");

            const gameRedis = await createRedisUtil(gameSession.session_id);
            if (!gameRedis.isUserInRoom(userId)) throw new Error("don't exist user in room");

            const current_song_id = gameRedis.getCurrentSongId();

            // 노래 url을 방에 있는 사람에게 전부 전달 emit
            const songData = new Song({ song_id: current_song_id });
            const song = await this.gameRepository.findOneSong(songData);
            if (song === null) throw new Error("not song");

            const responseData = new GameSongDto({ ...song });
            socket.emit("get song", responseData);
        } catch (error) {
            let message = "노래를 재생할 수 없습니다.";
            if (error instanceof Error) {
                logErrorSocket(error, socket, params);
                message = error.message;
            }
            socket.emit("error", { status: 401, message });
        }
    }

    @autobind
    async readySong(io: Namespace, socket: Socket, params: any) {
        // room_code로 session_table row 가져옴
        try {
            const { userId, roomCode } = socket.data;

            // room_code로 session_table row 가져옴
            const { gameSession } = await getGameSessionFromRoomCode(this.gameRepository, roomCode);
            if (gameSession.status === 0) throw new Error("not started yet");

            const gameRedis = await createRedisUtil(gameSession.session_id);

            // (redis) 플레이 준비 완료
            await gameRedis.setAgreeNextAction(userId);

            const isAllAgree = await gameRedis.isALLAgreeNextAction();
            // --- (redis) 유저들의 동영상 로딩이 전부 준비 되면 ---
            if (isAllAgree) {
                // 준비 완료!
                // 가능한 유저 id
                // 여기서 시간 안에 재생 안 하면 자동으로 재생하게 해야해
                const answer_user_id = await gameRedis.getAnswerUserId();
                io.to(roomCode).emit("all ready song", answer_user_id);
            } else {
                // --- (redis) 유저들의 동영상 로딩이 전부 준비 되지 않으면 ---
                io.to(roomCode).emit("ready song", userId);
            }
        } catch (error) {
            let message = "노래를 재생할 수 없습니다.";
            if (error instanceof Error) {
                logErrorSocket(error, socket, params);
                message = error.message;
            }
            socket.emit("error", { status: 401, message });
        }
    }

    @autobind
    async playSong(io: Namespace, socket: Socket, params: any) {
        // room_code로 session_table row 가져옴
        try {
            const { userId, roomCode } = socket.data;

            // room_code로 session_table row 가져옴
            const { gameSession } = await getGameSessionFromRoomCode(this.gameRepository, roomCode);
            if (gameSession.status === 0) throw new Error("not started yet ");

            const gameRedis = await createRedisUtil(gameSession.session_id);

            // (redis) 플레이 준비 완료
            await gameRedis.setAgreeNextAction(userId);

            const isAllAgree = await gameRedis.isALLAgreeNextAction();
            // --- (redis) 유저들의 동영상 로딩이 전부 준비 되면 ---
            if (isAllAgree) {
                // (redis) 준비 완료 초기화
                gameRedis.resetAgreeNextAction();
                gameRedis.setPossibleAnswer(true);
                gameRedis.deleteAnswerUserId();

                // 노래 재생! emit
                RoomTimer.startTimer(roomCode, 50000, () => showAnswerAndNextSong(this.gameRepository, io, roomCode));
                return io.to(roomCode).emit("play song");
            }
        } catch (error) {
            let message = "노래를 재생할 수 없습니다.";
            if (error instanceof Error) {
                logErrorSocket(error, socket, params);
                message = error.message;
            }
            socket.emit("error", { status: 401, message });
        }
    }

    @autobind
    async passSong(io: Namespace, socket: Socket, params: any) {
        try {
            const { userId, roomCode } = socket.data;

            // room_code로 session_table row 가져옴
            const { gameSession } = await getGameSessionFromRoomCode(this.gameRepository, roomCode);
            const gameRedis = await createRedisUtil(gameSession.session_id);

            // (redis) 패스 신청
            await gameRedis.setAgreeNextAction(userId);

            const isAllAgree = await gameRedis.isALLAgreeNextAction();

            // --- (redis) 유저들이 모두 패스 신청하면 ---
            if (isAllAgree) {
                // (redis) 패스 신청 초기화
                gameRedis.resetAgreeNextAction();
                // pass_count
                // 노래 패스
                // 다음 곡
                // 정답 나와도 resetAgreeNextAction해야함.
                RoomTimer.clearTimer(roomCode);
                io.to(roomCode).emit("all pass song");
                showAnswerAndNextSong(this.gameRepository, io, roomCode);
            } else {
                io.to(roomCode).emit("pass song", userId);
            }
        } catch (error) {
            let message = "노래를 패스할 수 없습니다.";
            if (error instanceof Error) {
                logErrorSocket(error, socket, params);
                message = error.message;
            }
            socket.emit("error", { status: 401, message });
        }
    }

    @autobind
    async joinUser(io: Namespace, socket: Socket, params: any) {
        const { userId, roomCode } = socket.data;

        try {
            const { gameSession } = await getGameSessionFromRoomCode(this.gameRepository, roomCode);

            if (gameSession.status === 1) return;

            const gameRedis = await createRedisUtil(gameSession.session_id);
            if (!gameRedis.isUserInRoom(userId)) throw new Error("don't exist user in room");

            const users = gameRedis.getUsers();
            const index = users.findIndex((item) => item.user_id === userId);
            const user = users[index];

            const userProfileData = new User({ user_id: userId });
            const userProfile = await this.userRepository.findOneUserProfile(userProfileData);
            if (userProfile === null) throw new Error("don't exist user profile");

            const alertData = { session_id: gameSession.session_id, user_id: userId, answer_user_id: userId, message: "님이 입장했습니다." };
            const answer = await this.alertAnswer(alertData);

            // const responseData = { leaveUserId: userId, answer };
            // io.to(roomCode).emit("leave game", responseData);

            const responseData = { id: user.user_id, userId, nickname: userProfile.nickname, score: 0 };
            io.to(roomCode).emit("join user", responseData);
        } catch (error) {
            let message = "접속할 수 없습니다.";
            if (error instanceof Error) {
                logErrorSocket(error, socket, params);
                message = error.message;
            }
            socket.emit("error", { status: 401, message });
        }
    }

    @autobind
    async kickUser(io: Namespace, socket: Socket, params: any) {
        try {
            // user id와 kick할 user id를 가져와서
            const { userId, roomCode } = socket.data;
            const { kickedUserId } = params.data;

            // room_code로 session_table row 가져옴
            const { gameSession } = await getGameSessionFromRoomCode(this.gameRepository, roomCode);

            // 게임 중이면 강퇴x
            // 유저가 방장인지 확인
            // 자신은 강퇴할 수 없음.
            if (gameSession.status === 1) throw new Error("already started game");
            if (gameSession.user_id !== userId) throw new Error("you're not manager");
            if (userId === kickedUserId) throw new Error("can't kick myself");

            const gameRedis = await createRedisUtil(gameSession.session_id);

            // (redis) 유저가 있는지 확인
            if (!gameRedis.isUserInRoom(kickedUserId)) throw new Error("없는 유저입니다.");

            // (redis) 유저 삭제
            gameRedis.deleteUser(kickedUserId);

            const alertData = { session_id: gameSession.session_id, user_id: kickedUserId, answer_user_id: userId, message: "님이 강퇴당했습니다." };
            const answer = await this.alertAnswer(alertData);

            // 방의 유저들에게 알려줌. 해당 유저는 방에서 강퇴 emit
            const responseData = { kickedUserId, answer };
            io.to(roomCode).emit("user kick", responseData);
        } catch (error) {
            let message = "강퇴할 수 없습니다.";
            if (error instanceof Error) {
                logErrorSocket(error, socket, params);
                message = error.message;
            }
            socket.emit("error", { status: 401, message });
        }
    }

    @autobind
    async updateRoomSettings(io: Namespace, socket: Socket, params: any) {
        // user id와 game code, 변경할 key, value를 받는다.
        const { userId, roomCode } = socket.data;
        const { playlistId, gameType, targetScore } = params.data;

        try {
            const { gameSession } = await getGameSessionFromRoomCode(this.gameRepository, roomCode);

            // 시작한 방인지 확인함.
            // 유저가 방장인지 확인
            if (gameSession.status === 1) throw new Error("already started game");
            if (gameSession.user_id !== userId) throw new Error("you're not manager");

            const playlistData = new Playlist({ playlist_id: playlistId });
            const playlist = await this.playlistRepository.findOnePlaylist(playlistData);
            if (playlist === null) throw new Error("invalid playlist id");

            // 게임방 설정 변경
            const gameRoomData = new GameSession({ session_id: gameSession.session_id });
            if (playlistId) gameRoomData.playlist_id = playlistId;
            // if (gameType) gameRoomData.game_type = gameType;
            if (targetScore) gameRoomData.goal_score = targetScore;

            await this.gameRepository.updateGameSession(gameRoomData);

            const alertData = { session_id: gameSession.session_id, answer_user_id: userId, message: "방 정보가 변경되었습니다." };
            const answer = await this.alertAnswer(alertData);

            // 변경할 설정을 적용한다.
            // 방에 있는 사람들에게 전달 emit
            const responseData = { playlist: playlist.title, gameType, targetScore, answer };
            io.to(roomCode).emit("change game setting", responseData);
        } catch (error) {
            let message = "설정을 변경할 수 없습니다.";
            if (error instanceof Error) {
                logErrorSocket(error, socket, params);
                message = error.message;
            }
            socket.emit("error", { status: 401, message });
        }
    }

    @autobind
    async changeUserName(io: Namespace, socket: Socket, params: any) {
        const { userId, roomCode } = socket.data;
        const { name } = params.data;

        try {
            const { gameSession } = await getGameSessionFromRoomCode(this.gameRepository, roomCode);
            if (gameSession.status === 1) throw new Error("already started game");
            if (name.length > 10) throw new Error("user name is too long");

            // 방에 있는 사람들에게 user name을 보낸다.
            const responseData = { userId, name };
            io.to(roomCode).emit("change user name", responseData);
        } catch (error) {
            let message = "이름을 변경할 수 없습니다.";
            if (error instanceof Error) {
                logErrorSocket(error, socket, params);
                message = error.message;
            }
            socket.emit("error", { status: 401, message });
        }
    }

    @autobind
    async changeUserStatus(io: Namespace, socket: Socket, params: any) {
        const { userId, roomCode } = socket.data;

        try {
            const { gameSession } = await getGameSessionFromRoomCode(this.gameRepository, roomCode);
            const gameRedis = await createRedisUtil(gameSession.session_id);

            if (!gameRedis.isUserInRoom(userId)) throw new Error("입장하지 않은 방입니다.");

            UserTimer.clearTimer(userId);
            await gameRedis.setUserStatus(userId, 0);
            const isAgree = await gameRedis.getAgreeNextAction(userId);
            const status = isAgree === "true" ? 1 : 0;

            const responseData = { userId, status };
            io.to(roomCode).emit("change user status", responseData);
        } catch (error) {
            let message = "이름을 변경할 수 없습니다.";
            if (error instanceof Error) {
                logErrorSocket(error, socket, params);
                message = error.message;
            }
            socket.emit("error", { status: 401, message });
        }
    }

    @autobind
    async leaveRoom(io: Namespace, socket: Socket, params: any) {
        try {
            // user id와 code를 받는다.
            const { userId, roomCode } = socket.data;

            // room_code로 session_table row 가져옴
            const { gameRoom, gameSession } = await getGameSessionFromRoomCode(this.gameRepository, roomCode);

            // 시작했으면 나갈 수 없음.
            if (gameSession.status === 1) throw new Error("already started game");

            const gameRedis = await createRedisUtil(gameSession.session_id);
            if (!gameRedis.isUserInRoom(userId)) throw new Error("don't exist user in room");

            // (redis) 현재 유저들 가져옴
            const users = gameRedis.getUsers();

            // 1명이면 방을 삭제함
            if (users.length === 1) {
                gameRedis.deleteRoom();
                const gameRoomData = new GameRoom({ room_id: gameRoom.room_id, status: 1 });
                const sessionData = new GameSession({ session_id: gameSession.session_id, status: 1 });

                await Promise.all([this.gameRepository.updateGameRoom(gameRoomData), this.gameRepository.updateGameSession(sessionData)]);
                return;
            }

            await gameRedis.deleteUser(userId);

            // 방장이면 다음 순서를 방장으로 바꿈
            let nextManagerId;
            if (gameSession.user_id === userId) {
                const users = gameRedis.getUsers();
                nextManagerId = users[0].user_id;

                const sessionData = new GameSession({ session_id: gameSession.session_id, user_id: nextManagerId });
                await this.gameRepository.updateGameSession(sessionData);
            }

            const alertData = { session_id: gameSession.session_id, user_id: userId, answer_user_id: userId, message: "님이 나갔습니다." };
            const answer = await this.alertAnswer(alertData);

            const responseData = { leaveUserId: userId, answer, nextManagerId };
            io.to(roomCode).emit("leave game", responseData);
        } catch (error) {
            let message = "나가기 오류";
            if (error instanceof Error) {
                logErrorSocket(error, socket, params);
                message = error.message;
            }
            socket.emit("error", { status: 401, message });
        }
    }

    // 다른 메서드들...
}

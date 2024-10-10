import IGameRepository from "../repositories/interfaces/game";
import createRedisUtil, { RedisUtil } from "../utils/redis";

import GameRoom from "../models/GameRoom";
import GameSession from "../models/GameSession";
import Song from "../models/Song";
import { GameSongDto } from "../dto/game";
import { Namespace } from "socket.io";
import { RoomTimer } from "../utils/timer";

function generateRoomCode() {
    const length = 6;
    const characters = "0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }
    return result;
}

export function generateRandomOrder(songs: Song[]) {
    const shuffled = songs
        .map((song) => song.song_id)
        .slice()
        .sort(() => 0.5 - Math.random());
    return shuffled;
}

export function mergeUserDetails(names: { user_id: number; nickname: string }[], scores: { user_id: number; score: number }[], orders: { user_id: number; order: number }[]) {
    const nameDict: { [key: number]: string } = names.reduce((acc, item) => {
        acc[item.user_id] = item.nickname;
        return acc;
    }, {} as { [key: number]: string });

    const orderDict: { [key: number]: number } = orders.reduce((acc, item) => {
        acc[`${item.user_id}`] = item.order;
        return acc;
    }, {} as { [key: number]: number });

    return scores.map((scoreItem) => ({
        userId: scoreItem.user_id,
        nickname: nameDict[scoreItem.user_id],
        order: orderDict[scoreItem.user_id],
        score: scoreItem.score,
    }));
}

export async function finishGame(gameRepository: IGameRepository, io: Namespace, roomCode: string) {
    try {
        RoomTimer.clearTimer(roomCode);

        const { gameRoom, gameSession } = await getGameSessionFromRoomCode(gameRepository, roomCode);
        const gameRedis = await createRedisUtil(gameSession.session_id);

        // 다 초기화
        // 방장이 연결끊김 상태면 다른 사람을 방장으로
        const u = gameRedis.getUsers();
        const users = await Promise.all(
            u.map(async (user) => {
                try {
                    const status = await gameRedis.getUserStatus(user.user_id);
                    return {
                        ...user,
                        status,
                    };
                } catch (error) {
                    return {
                        ...user,
                        status: -1,
                    };
                }
            })
        );

        const newUsers = users.filter((user) => user.status !== -1).sort((a, b) => a.order - b.order);

        await gameRedis.deleteRoom();

        // wjqthrehls dbwjrk djqtdmaus qkdtkrwp
        if (newUsers.length === 0) {
            gameRedis.deleteRoom();
            RoomTimer.clearTimer(roomCode);

            const gameRoomData = new GameRoom({ room_id: gameRoom.room_id, status: 1 });
            const sessionData = new GameSession({ session_id: gameSession.session_id, status: 1 });

            await Promise.all([gameRepository.updateGameRoom(gameRoomData), gameRepository.updateGameSession(sessionData)]);

            return;
        }

        const managerId = newUsers[0].user_id;

        // 세션 변경
        const sesseionData = {
            room_id: gameSession.room_id,
            playlist_id: gameSession.playlist_id,
            user_id: managerId,
            question_order: null,
            game_type: gameSession.game_type,
            goal_score: gameSession.goal_score,
            status: 0,
        };
        const gameSessionData = new GameSession(sesseionData);
        const newGameSession = await gameRepository.createGameSession(gameSessionData);
        if (newGameSession === null) throw new Error("방 정보를 찾을 수 없습니다. (GameSession 생성 실패)");

        const newGameRedis = await createRedisUtil(newGameSession.session_id);
        newUsers.forEach(async (user) => {
            await newGameRedis.addUser(user.user_id);
        });

        const finishResponseData = { newUsers, managerId };
        return io.to(roomCode).emit("game finish", finishResponseData);
    } catch (error) {
        throw error;
    }
}

export async function showAnswerAndNextSong(gameRepository: IGameRepository, io: Namespace, roomCode: string) {
    try {
        const { gameRoom, gameSession } = await getGameSessionFromRoomCode(gameRepository, roomCode);
        const gameRedis = await createRedisUtil(gameSession.session_id);

        // 정답을 맞췄으면 다음 곡을 설정할 필요는 없음.
        const isAnswer = await gameRedis.getPossibleAnswer();

        let songResponseData: GameSongDto;
        if (isAnswer) {
            const song_id = await gameRedis.getCurrentSongId();
            const songData = new Song({ song_id });
            const current_song = await gameRepository.findOneSong(songData);
            if (current_song === null) throw new Error("don't exist song");

            const answers = current_song.answer.split(",");
            const answerSongResponseData = { answer: answers[0], description: current_song.description };
            const responseData = { answer: true, answerSongResponseData };
            io.to(roomCode).emit("submit answer", responseData);

            await gameRedis.setPossibleAnswer(false);

            const next_song = await setNextSong(gameRepository, gameSession, gameRedis);
            if (!next_song) {
                finishGame(gameRepository, io, roomCode);
                return;
            }
            songResponseData = new GameSongDto({ ...next_song.dataValues });

            io.to(roomCode).emit("next song", songResponseData);
        } else {
            // // 현재 곡 정답 알려주기
            // const song_id = await gameRedis.getCurrentSongId();
            // // song_id로 url, 등등 가져옴
            // const songData = new Song({ song_id });
            // const current_song = await gameRepository.findOneSong(songData);
            // if (current_song === null) throw new Error(`show answer and next song don't exist song, song id : ${song_id}`);
            // const answerSongResponseData = { answer: current_song.answer[0], description: current_song.description };
            // io.to(roomCode).emit("submit answer", { answerSongResponseData });
        }

        const playSongTimer = async (retryCount = 0, maxRetries = 10) => {
            const connectedUsers = await gameRedis.getConnectedUsers();

            if (connectedUsers.length === 0) {
                gameRedis.deleteRoom();
                RoomTimer.clearTimer(roomCode);

                const gameRoomData = new GameRoom({ room_id: gameRoom.room_id, status: 1 });
                const sessionData = new GameSession({ session_id: gameSession.session_id, status: 1 });

                await Promise.all([gameRepository.updateGameRoom(gameRoomData), gameRepository.updateGameSession(sessionData)]);
                return;
            }

            try {
                const isAllAgree = await gameRedis.isALLAgreeNextAction();
                if (isAllAgree) {
                    gameRedis.resetAgreeNextAction();
                    gameRedis.setPossibleAnswer(true);
                    gameRedis.deleteAnswerUserId();
                    // 노래 재생! emit
                    io.to(roomCode).emit("play song");

                    RoomTimer.startTimer(roomCode, 50000, () => showAnswerAndNextSong(gameRepository, io, roomCode));
                } else {
                    if (retryCount < maxRetries) {
                        const notAgreeUsers = await gameRedis.getDisagreeUsersNextAction();
                        if (notAgreeUsers.length !== 0) {
                            if (!songResponseData) {
                                const song_id = await gameRedis.getCurrentSongId();
                                const songData = new Song({ song_id });
                                const current_song = await gameRepository.findOneSong(songData);
                                if (current_song === null) throw new Error("don't exist song");

                                songResponseData = new GameSongDto({ ...current_song.dataValues });
                            }

                            io.to(roomCode).emit("next song", songResponseData, notAgreeUsers);
                        }
                        RoomTimer.startTimer(roomCode, 3000, () => playSongTimer(retryCount + 1, maxRetries));
                    } else {
                        //만약에 준비 0이면
                        // 30번이나 요청해도 안되면 그냥 시작
                        gameRedis.resetAgreeNextAction();
                        gameRedis.setPossibleAnswer(true);
                        gameRedis.deleteAnswerUserId();
                        io.to(roomCode).emit("play song");
                    }
                }
            } catch (error) {
                let message = "노래 재생 오류";
                if (error instanceof Error) {
                    message = error.message;
                }
                io.to(roomCode).emit("error", { status: 401, message });
            }
        };

        RoomTimer.startTimer(roomCode, 5000, playSongTimer);
    } catch (error) {
        throw error;
    }
}

async function getNextSong(gameRepository: IGameRepository, gameSession: GameSession, song_id: number) {
    try {
        // session 테이블의 question_order에서 현재 song_id의 index를 찾고 그 다음으로 넘김
        const orders = JSON.parse(gameSession.question_order);
        const findIndex = orders.indexOf(song_id);

        const index = findIndex === -1 ? 0 : findIndex;
        if (index + 1 == orders.length) return false;

        // (redis) 현재 노래 설정
        const next_song_id = orders[index + 1];

        // 노래를 가져옴.
        const nextSongData = new Song({ song_id: next_song_id });
        const next_song = await gameRepository.findOneSong(nextSongData);
        if (next_song === null) throw new Error("don't exist next song");

        return next_song;
    } catch (error) {
        throw error;
    }
}

export async function setNextSong(gameRepository: IGameRepository, gameSession: GameSession, gameRedis: RedisUtil) {
    try {
        const song_id = await gameRedis.getCurrentSongId();
        const next_song = await getNextSong(gameRepository, gameSession, song_id);
        if (!next_song) return false;

        gameRedis.setCurrentSongId(next_song.song_id);

        return next_song;
    } catch (error) {
        throw error;
    }
}

export async function fetchGameRoomUsersData(gameRepository: IGameRepository, redisUtil: RedisUtil) {
    try {
        // (redis) 현재 유저들 order 가져옴
        const redisUsers = redisUtil.getUsers();
        const user_ids = redisUsers.map((user) => user.user_id);

        // 현재 유저들 이름 가져옴
        // (redis) 현재 유저들 score 가져옴
        const [userProfiles, scores] = await Promise.all([gameRepository.findAllUserName(user_ids), redisUtil.getUsersScore()]);

        if (!userProfiles || userProfiles.length === 0) throw new Error("사용자 프로필을 찾을 수 없습니다.");
        if (!scores || scores.length === 0) throw new Error("사용자 점수를 찾을 수 없습니다.");

        const names = userProfiles.map((profile) => ({
            user_id: profile.user_id,
            nickname: profile.nickname,
        }));

        // user_id로 score, order, name 매치
        const gameRoomUsersData = mergeUserDetails(names, scores, redisUsers);
        return gameRoomUsersData;
    } catch (error) {
        throw error;
    }
}

export async function getGameSessionFromRoomCode(gameRepository: IGameRepository, room_code: string) {
    try {
        if (!room_code) throw new Error(`${getGameSessionFromRoomCode} room_code: ${room_code}`);

        const gameRoomData = new GameRoom({ room_code });
        const gameRoom = await gameRepository.findOneGameRoom(gameRoomData);
        if (gameRoom === null) throw new Error("방 정보를 찾을 수 없습니다. (room)");

        const gameSessionData = new GameSession({ room_id: gameRoom.room_id });
        const gameSession = await gameRepository.findOneGameSession(gameSessionData);

        if (gameSession === null) throw new Error("방 정보를 찾을 수 없습니다.");

        return { gameRoom, gameSession };
    } catch (error) {
        throw error;
    }
}

export async function createUniqueRoomCode(gameRepository: IGameRepository) {
    let isUnique = false;
    let room_code;

    while (!isUnique) {
        room_code = generateRoomCode();
        const gameRoomData = new GameRoom({ room_code });
        const existingRoom = await gameRepository.findOneGameRoom(gameRoomData);
        if (!existingRoom) {
            isUnique = true;
        }
    }

    return room_code;
}

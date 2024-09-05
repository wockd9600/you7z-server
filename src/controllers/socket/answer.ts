import { Socket, Namespace } from "socket.io";
import autobind from "autobind-decorator";

import { sequelize } from "../../modules/sequelize";

import createRedisUtil from "../../utils/redis";
import { getGameSessionFromRoomCode } from "../../helper/game";

import AnswerRepository from "../../repositories/interfaces/answer";
import GameRepository from "../../repositories/interfaces/game";
import Answer from "../../models/Answer";
import Song from "../../models/Song";

import { logErrorSocket } from "../../utils/error";
import { GameSongDto } from "../../dto/game";
import { RoomTimer } from "../../socket/ns";
import GameSession from "../../models/GameSession";

export default class AnswerController {
    constructor(private answerRepository: AnswerRepository, private gameRepository: GameRepository) {}

    @autobind
    async submitAnswer(io: Namespace, socket: Socket, params: any) {
        // room_code로 session_table row 가져옴
        const transaction = await sequelize.transaction();

        try {
            // user id, room_code, answer을 받음.
            const { userId, roomCode } = socket.data;
            const { message } = params.data;

            // room_code로 session_table row 가져옴
            const { gameSession } = await getGameSessionFromRoomCode(this.gameRepository, roomCode);

            const gameRedis = await createRedisUtil(gameSession.session_id);

            // (redis) 유저가 있는지 확인
            if (!gameRedis.isUserInRoom(userId)) throw new Error("don't exist user in game room");

            // answer 테이블에 작성
            const answerData = new Answer({ session_id: gameSession.session_id, user_id: userId, content: message });
            const newAnswer = await this.answerRepository.createAnswer(answerData, transaction);

            // ---------- 게임 시작 전이면 ""답 체크x"" ----------
            const answerResponseData = { id: newAnswer.answer_id, userId, message, correct: false };

            const isPossibleAnswer = await gameRedis.getPossibleAnswer();
            console.log(gameSession.status, isPossibleAnswer);
            const isAllAgree = await gameRedis.isALLAgreeNextAction();
            console.log(isAllAgree);

            console.log(await gameRedis.getCurrentSongId());
            if (gameSession.status === 0 || !isPossibleAnswer) {
                transaction.commit();
                return io.to(roomCode).emit("submit answer", { answerResponseData });
            }

            // **********************************************
            // *                                            *
            // *                                            *
            // *                                            *
            // **********************************************

            // (redis) 현재 노래 가져오기
            const song_id = await gameRedis.getCurrentSongId();
            console.log("current song", song_id);
            // song_id로 url, 등등 가져옴
            const songData = new Song({ song_id });
            const current_song = await this.gameRepository.findOneSong(songData);
            if (current_song === null) throw new Error("don't exist song");

            // ----- 정답이 아니면 ""계속 진행"" -----
            const answers = current_song.answer.split(",");
            console.log("is answer?! : ", !answers.includes(message));
            if (!answers.includes(message)) {
                transaction.commit();
                return io.to(roomCode).emit("submit answer", { answerResponseData });
            }

            // (redis) 유저 스코어 설정
            const user_score = (await gameRedis.getUserScore(userId)) + 1;
            await gameRedis.setUserScore(userId, user_score);

            // 목표 점수에 달성하면 게임 끝
            if (gameSession.goal_score <= user_score) {
                // 다 초기화
                // 세션 변경
                const finishResponseData = {};
                return io.to(roomCode).emit("game finish", { finishResponseData });
            }

            // session 테이블의 question_order에서 현재 song_id의 index를 찾고 그 다음으로 넘김
            const orders = JSON.parse(gameSession.question_order);
            const findIndex = orders.indexOf(song_id);

            const index = findIndex === -1 ? 0 : findIndex;
            if (index + 1 == orders.length) throw new Error("invalid index");

            // (redis) 현재 노래 설정
            const next_song_id = orders[index + 1];
            console.log("next song id", next_song_id);

            // 노래를 가져옴.
            const nextSongData = new Song({ song_id: next_song_id });
            const next_song = await this.gameRepository.findOneSong(nextSongData);
            if (next_song === null) throw new Error("don't exist next song");

            // settime 30초 설정
            const autoPlaySongTimer = async (retryCount = 0, maxRetries = 30) => {
                try {
                    const isAllAgree = await gameRedis.isALLAgreeNextAction();
                    if (isAllAgree) {
                        gameRedis.resetAgreeNextAction();
                        gameRedis.setPossibleAnswer(true);
                        // 노래 재생! emit
                        io.to(roomCode).emit("play song");

                        // this.startTimer(roomCode, 60000, () => {
                        // 노래 멈춤
                        // 다른 노래 설정
                        // 다른 노래 보냄
                        // });
                    } else {
                        io.to(roomCode).emit("get song");
                        if (retryCount < maxRetries) {
                            RoomTimer.startTimer(roomCode, 1000, () => autoPlaySongTimer(retryCount + 1, maxRetries));
                        } else {
                            const gameRoomData = new GameSession({ session_id: gameSession.session_id, status: 0, question_order: null });
                            await this.gameRepository.updateGameSession(gameRoomData);
                            throw new Error("노래 재생 요청 횟수 초과");
                        }
                    }
                } catch (error) {
                    let message = "노래 재생 오류";
                    if (error instanceof Error) {
                        logErrorSocket(error, socket, params);
                        message = error.message;
                    }
                    socket.emit("error", { status: 401, message });
                }
            };

            RoomTimer.startTimer(roomCode, 30000, autoPlaySongTimer);

            gameRedis.setCurrentSongId(next_song_id);
            gameRedis.setPossibleAnswer(false);
            gameRedis.setAnswerUserId(userId);

            // 방에 있는 사람들에게 url emit
            const answerSongResponseData = { answer: current_song.answer[0], description: current_song.description };
            const songResponseData = new GameSongDto({ ...next_song.dataValues });
            const scoreResponseData = { userId, score: user_score };
            const responseData = { answer: true, answerSongResponseData, songResponseData, scoreResponseData, answerResponseData };

            transaction.commit();

            // (redis) 답 제출 불가능

            io.to(roomCode).emit("submit answer", responseData);
            // answer emit
        } catch (error) {
            transaction.rollback();
            let message = "보내기 오류";
            if (error instanceof Error) {
                logErrorSocket(error, socket, params);
                message = error.message;
            }
            socket.emit("error", { status: 401, message });
        }
    }
    // 다른 메서드들...
}

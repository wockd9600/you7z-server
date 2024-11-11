import { Socket, Namespace } from "socket.io";
import autobind from "autobind-decorator";
import { sanitize } from "express-xss-sanitizer";

import { sequelize } from "../../modules/sequelize";

import createRedisUtil from "../../utils/redis";
import { finishGame, getGameSessionFromRoomCode, setNextSong } from "../../helper/game";

import AnswerRepository from "../../repositories/interfaces/answer";
import GameRepository from "../../repositories/interfaces/game";
import Answer from "../../models/Answer";
import Song from "../../models/Song";

import { logErrorSocket } from "../../utils/error";
import { GameSongDto } from "../../dto/game";

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
            
            const sanitizedMessage = sanitize(message);

            // room_code로 session_table row 가져옴
            const { gameSession } = await getGameSessionFromRoomCode(this.gameRepository, roomCode);

            const gameRedis = await createRedisUtil(gameSession.session_id);

            // (redis) 유저가 있는지 확인
            if (!gameRedis.isUserInRoom(userId)) throw new Error("don't exist user in game room");

            // answer 테이블에 작성
            const answerData = new Answer({ session_id: gameSession.session_id, user_id: userId, content: message });
            const newAnswer = await this.answerRepository.createAnswer(answerData, transaction);

            // ---------- 게임 시작 전이면 ""답 체크x"" ----------
            const answerResponseData = { id: newAnswer.answer_id, userId, message: sanitizedMessage, correct: false };

            const isPossibleAnswer = await gameRedis.getPossibleAnswer();

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
            // song_id로 url, 등등 가져옴
            const songData = new Song({ song_id });
            const current_song = await this.gameRepository.findOneSong(songData);
            if (current_song === null) throw new Error("don't exist song");

            // ----- 정답이 아니면 ""계속 진행"" -----
            const answers = current_song.answer.split(",");

            // console.log("current song", current_song.answer);
            // console.log(answers);
            // console.log("is answer?! : ", !answers.includes(message));

            const replacedAnswers = current_song.answer.replace(/\s+/g, "").toLowerCase().split(",");
            const replaceedMessage = sanitizedMessage.replace(/\s+/g, "");

            if (!replacedAnswers.includes(replaceedMessage)) {
                transaction.commit();
                return io.to(roomCode).emit("submit answer", { answerResponseData });
            }

            // (redis) 유저 스코어 설정
            const user_score = (await gameRedis.getUserScore(userId)) + 1;
            await gameRedis.setUserScore(userId, user_score);

            const orders = JSON.parse(gameSession.question_order);
            const findIndex = orders.indexOf(song_id);

            const answerSongResponseData = { answer: answers[0], description: current_song.description };
            const scoreResponseData = { userId, score: user_score };
            const responseData = { answer: true, answerSongResponseData, scoreResponseData, answerResponseData };

            // 목표 점수에 달성하면 게임 끝
            if (gameSession.goal_score <= user_score || findIndex === orders.length) {
                io.to(roomCode).emit("submit answer", responseData);
                finishGame(this.gameRepository, io, roomCode);
                transaction.commit();
                return;
            }

            const next_song = await setNextSong(this.gameRepository, gameSession, gameRedis);
            if (!next_song) {
                io.to(roomCode).emit("submit answer", responseData);
                finishGame(this.gameRepository, io, roomCode);
                transaction.commit();
                return;
            }

            gameRedis.setPossibleAnswer(false);
            gameRedis.setAnswerUserId(userId);

            const gmaeSongData = new GameSongDto({ ...next_song.dataValues });
            io.to(roomCode).emit("submit answer", responseData);

            io.to(roomCode).emit("next song", { gmaeSongData, resetTimer: false });

            transaction.commit();

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

import { Socket, Namespace } from "socket.io";
import autobind from "autobind-decorator";

import { sequelize } from "../../modules/sequelize";

import createRedisUtil from "../../utils/redis";
import { getGameSessionFromRoomCode } from "../../helper/game";

import AnswerRepository from "../../repositories/interfaces/answer";
import GameRepository from "../../repositories/interfaces/game";
import Answer from "../../models/Answer";
import Song from "../../models/Song";

export default class AnswerController {
    constructor(private answerRepository: AnswerRepository, private gameRepository: GameRepository) {}

    @autobind
    async submitAnswer(io: Namespace, socket: Socket, params: any) {
        // room_code로 session_table row 가져옴
        const transaction = await sequelize.transaction();

        try {
            // user id, room_code, answer을 받음.
            const { room_code, content } = params.data;
            const { user_id } = socket.data.user;

            if (!content) throw new Error("invalid content");

            // room_code로 session_table row 가져옴
            const { gameSession } = await getGameSessionFromRoomCode(this.gameRepository, room_code);

            const gameRedis = await createRedisUtil(gameSession.session_id);

            // (redis) 유저가 있는지 확인
            const users = gameRedis.getUsers();
            const isExistUser = users.filter((user) => user.user_id === user_id);
            if (isExistUser.length === 0) throw new Error("don't exist user in game room");

            // answer 테이블에 작성
            const answerData = new Answer({ session_id: gameSession.session_id, user_id, content });
            await this.answerRepository.createAnswer(answerData, transaction);

            // ----- 게임 시작 전이면 ""답 체크x"" -----
            const answerResponseData = { id: user_id, content };
            if (gameSession.status === 0) return io.to(room_code).emit("submit answer", answerResponseData);

            // (redis) 현재 노래 가져오기
            const song_id = await gameRedis.getCurrentSongId();

            // song_id로 url, 등등 가져옴
            const songData = new Song({ song_id });
            const current_song = await this.gameRepository.findOneSong(songData);
            if (current_song === null) throw new Error("don't exist song");

            // ----- 정답이 아니면 ""계속 진행"" -----
            const answers = current_song.answer.split(",");
            if (!(content in answers)) return io.to(room_code).emit("submit answer", answerResponseData);

            // (redis) 현재 노래 설정 (맞출 수 없는 답)
            // (redis) 유저 스코어 설정
            const user_score = (await gameRedis.getUserScore(user_id)) + 1;
            await gameRedis.setUserScore(user_id, user_score);

            // 목표 점수에 달성하면 게임 끝
            if (gameSession.goal_score <= user_score) {
                // 다 초기화
                // 세션 변경
                const finishResponseData = {};
                return io.to(room_code).emit("game finish", finishResponseData);
            }

            // session 테이블의 question_order에서 현재 song_id의 index를 찾고 그 다음으로 넘김
            const orders = JSON.parse(gameSession.question_order);
            const index = orders.indexOf(song_id);
            if (index === -1) throw new Error("invalid song id");
            if (index + 1 == orders.length) throw new Error("invalid index");

            // (redis) 현재 노래 설정
            // *수정 이거 노래 듣는 중에는 정답 못 맞추게 해야해F
            const next_song_id = orders[index + 1];
            gameRedis.setCurrentSongId(next_song_id);

            // 노래를 가져옴.
            const nextSongData = new Song({ song_id: next_song_id });
            const next_song = await this.gameRepository.findOneSong(nextSongData);
            if (next_song === null) throw new Error("don't exist next song");

            // 방에 있는 사람들에게 url emit
            const songResponseData = { song_id: next_song.url, start_time: next_song.start_time };
            const scoreResponseData = { user_id, score: user_score };
            const responseData = { answer: true, songResponseData, scoreResponseData, answerResponseData };

            io.to(room_code).emit("submit answer", responseData);
            // answer emit
        } catch (error) {
            await transaction.rollback();
            socket.emit("error", { status: 401, message: "알 수 없는 이유로 게임을 시작할 수 없습니다." });
        }
    }
    // 다른 메서드들...
}

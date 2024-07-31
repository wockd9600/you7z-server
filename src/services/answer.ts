import autobind from "autobind-decorator";

import createRedisUtil from "../utils/redis";

import IAnswerRepository from "../repositories/interfaces/answer";
import IGameRepository from "../repositories/interfaces/game";

import { AnswerRequestDto, AnswerResponseDto } from "../dto/answer";
import GameRoom from "../models/GameRoom";
import GameSession from "../models/GameSession";
import Answer from "../models/Answer";

export default class AnswerService {
    constructor(private answerRepository: IAnswerRepository, private gameRepository: IGameRepository) {}

    @autobind
    async getRoomAnswers(answerRequestDto: AnswerRequestDto, user_id: number) {
        const { room_code } = answerRequestDto;
        try {
            // room_code로 game table, session table row 가져옴
            const gameRoomData = new GameRoom({ room_code });
            const gameRoom = await this.gameRepository.findOneGameRoom(gameRoomData);
            if (gameRoom === null) throw new Error("방 정보를 찾을 수 없습니다. (GameRoom 조회 실패)");

            const gameSessionData = new GameSession({ room_id: gameRoom.room_id });
            const gameSession = await this.gameRepository.findOneGameSession(gameSessionData);
            if (gameSession === null) throw new Error("방 정보를 찾을 수 없습니다. (GameSession 조회 실패)");

            const gameRedis = await createRedisUtil(gameSession.session_id);
            if (!gameRedis.isUserInRoom(user_id)) throw new Error("입장할 수 없는 방입니다.");

            const answerData = new Answer({ session_id: gameSession.session_id });
            const answers = await this.answerRepository.getLatestAnswers(answerData);

            const answerResponseDto = new AnswerResponseDto(answers);
            return answerResponseDto;
        } catch (error) {
            throw error;
        }
    }
}

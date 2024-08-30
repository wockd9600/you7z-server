import { Request, Response } from "express";
import autobind from "autobind-decorator";

import AnswerService from "../services/answer";

import { logError } from "../utils/error";

export default class AnswerController {
    constructor(private answerService: AnswerService) {}

    @autobind
    async getAnswers(req: Request, res: Response) {
        // 코드를 전달 받음.
        // 코드를 토대로 seesion table을 가져오고
        // (redis) 유저가 게임방에 있는지 확인함
        // 최근 10개 전달

        try {
            const user_id = req.user!.user_id;

            const answerRequestDto = req.dto;
            const answerResponseDto = await this.answerService.getRoomAnswers(answerRequestDto, user_id);

            return res.status(200).json(answerResponseDto);
        } catch (error) {
            if (error instanceof Error) logError(error, req);
            return res.status(500).json({ message: "입장할 수 없는 방입니다." });
        }
    }

    // @autobind
    // submitAnswer(req: Request, res: Response) {
    //     // 로그인 로직
    // }

    // 다른 메서드들...
}

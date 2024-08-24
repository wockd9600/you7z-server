import { Request, Response } from "express";
import autobind from "autobind-decorator";

import GameService from "../services/game";

import logError from "../utils/error";

export default class GameController {
    constructor(private gameService: GameService) {}

    @autobind
    async getRoomInfo(req: Request, res: Response) {
        try {
            const user_id = req.user!.user_id;
            const roomCode = req.params.roomCode as string;

            const result = await this.gameService.getRoomInfo(roomCode, user_id);

            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(200).json(result);
            }
        } catch (error) {
            if (error instanceof Error) logError(error, req);
            return res.status(500).json({ message: "입장할 수 없는 방입니다." });
        }
    }

    @autobind
    async enterRoom(req: Request, res: Response) {
        try {
            const user_id = req.user!.user_id;

            const roomInfoRequestDto = req.dto;
            const result = await this.gameService.enterRoom(roomInfoRequestDto, user_id);

            res.status(200).json(result);
        } catch (error) {
            if (error instanceof Error) logError(error, req);
            return res.status(500).json({ message: "입장할 수 없는 방입니다." });
        }
    }

    @autobind
    async createRoom(req: Request, res: Response) {
        try {
            const user_id = req.user!.user_id;

            const result = await this.gameService.createRoom(user_id);

            // 룸코드 전달
            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(200).json(result);
            }
        } catch (error) {
            if (error instanceof Error) logError(error, req);
            return res.status(500).json({ message: "방을 만들 수 없습니다. 잠시 후 다시 시도해 주세요." });
        }
    }

    // @autobind
    // startGame(req: Request, res: Response) {
    //     // 로그인 로직
    // }

    // @autobind
    // kickUser(req: Request, res: Response) {
    //     // 로그인 로직
    // }

    // @autobind
    // updateRoomSettings(req: Request, res: Response) {
    //     // 로그인 로직
    // }

    // @autobind
    // leaveRoom(req: Request, res: Response) {
    //     // 로그인 로직
    // }

    // 다른 메서드들...
}

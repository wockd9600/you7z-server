import { Request, Response } from "express";
import autobind from "autobind-decorator";

import GameService from "../services/game";

import logError from "../utils/error";

export default class GameController {
    constructor(private gameService: GameService) {}

    @autobind
    async getRoomInfo(req: Request, res: Response) {
        // 코드를 전달 받음.
        // room_code로 session_table row 가져옴
        // 시작한 방인지 확인함.
        // --- 시작한 방이 아닐 때 ---
        // (redis) 인원수 문제 없는지 확인
        // (redis) 인원수 한 명 추가
        // --- 시작한 방일 때 --- (session table status)
        // ----- 게임에 참가 중인 인원이면 ---- (user score table에 있음. where session_id, user_id)
        // session table에 저장된 게임 설정 정보와
        // session_id로 score table에 저장된 유저들 가져오고
        // (redis) 현재 유저들 score 가져옴
        // user_id로 매치 시켜서 점수 맞춤
        // session_id로 redis에서 현재 song_id 가져옴.
        // f"session:{session_id}:song"
        // song_id로 url, 등등 가져옴
        // ----- 게임에 참가 중인 인원이 아니면 ---- 입장 불가
        // 정보 전달

        try {
            const user_id = req.user!.user_id;

            const roomInfoRequestDto = req.dto;
            const result = await this.gameService.getRoomInfo(roomInfoRequestDto, user_id);

            if (result.success) {
                res.status(200).json(result.roomInfoResponseDto);
            } else {
                res.status(409).json(result);
            }
            
        } catch (error) {
            if (error instanceof Error) logError(error, req);
            return res.status(500).json({ message: "입장할 수 없는 방입니다." });
        }
    }

    @autobind
    async createRoom(req: Request, res: Response) {
        // user id를 전달 받고
        // 입장 중인 방 없는지 확인
        // create room, gamesession 생성
        // 인원수 추가
        // 코드 전달

        try {
            const user_id = req.user!.user_id;

            const createRoomResponseDto = await this.gameService.createRoom(user_id);

            res.status(200).json(createRoomResponseDto);
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

import { Request, Response } from "express";
import autobind from "autobind-decorator";

export default class GameController {
    @autobind
    getRoomInfo(req: Request, res: Response) {
        // 로그인 로직
    }

    @autobind
    createRoom(req: Request, res: Response) {
        // 로그인 로직
    }

    @autobind
    startGame(req: Request, res: Response) {
        // 로그인 로직
    }

    @autobind
    kickUser(req: Request, res: Response) {
        // 로그인 로직
    }

    @autobind
    updateRoomSettings(req: Request, res: Response) {
        // 로그인 로직
    }

    @autobind
    markRoomAsDeleted(req: Request, res: Response) {
        // 로그인 로직
    }

    @autobind
    leaveRoom(req: Request, res: Response) {
        // 로그인 로직
    }

    // 다른 메서드들...
}

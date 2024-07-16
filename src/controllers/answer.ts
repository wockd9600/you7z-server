import { Request, Response } from "express";
import autobind from "autobind-decorator";

export default class UserController {
    @autobind
    getAnswers(req: Request, res: Response) {
        // 코드를 전달 받음.
        // 코드를 토대로 seesion table을 가져오고
        // (redis) 유저가 게임방에 있는지 확인함
        // 최근 10개 전달
    }
    // @autobind
    // submitAnswer(req: Request, res: Response) {
    //     // 로그인 로직
    // }

    // 다른 메서드들...
}

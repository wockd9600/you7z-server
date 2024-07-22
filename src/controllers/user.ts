import { Request, Response } from "express";

import autobind from "autobind-decorator";
import User from "../models/User";

export default class UserController {
    @autobind
    async patchName(req: Request, res: Response) {
        // 전달된 토큰에서 id를 추출
        // 전달된 텍스트 데이터로 이름 변경
        const user_id = req.user!.user_id;
        const nickname = req.body.nickname;

        try {
            await User.update({ nickname }, { where: { user_id } });
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error(`error patch user name: ${user_id}`, error);
            return res.status(500).json({ success: false, error: "Failed to update user name" });
        }
    }

    // 다른 메서드들...
}

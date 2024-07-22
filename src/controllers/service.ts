import { Request, Response } from "express";
import autobind from "autobind-decorator";

import { loginOrSignUp, logout, refreshToken } from "../services/service";

// db timestamp true, User status defalut 1
export default class ServiceController {
    @autobind
    async login(req: Request, res: Response) {
        // kakao 인증 code를 받음.
        // kakao api로 kakao id를 가져오고
        // kakao id로 가입된 아이디가 있는지 확인
        // 없으면 회원가입 (user, userPfoile table에 로우 생성, status = 1, nickname = random)
        // access token, refresh token 생성, 설정
        // 전달

        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: "Kakao 인증 코드가 필요합니다." });
        }

        try {
            const { access_token, refresh_token } = await loginOrSignUp(code);
            return res.status(200).json({ token: access_token, index: refresh_token });
        } catch (error) {
            // 롤백
            console.error(`error login: `, error);
            return res.status(500).json({ error: "로그인 중 오류가 발생했습니다." });
        }
    }

    @autobind
    async logout(req: Request, res: Response) {
        // 로그아웃 로직
        // 전달된 토큰에서 id를 추출
        // delete refresh token, 입장 중인 방 있으면 퇴장

        const user_id = req.user!.user_id;

        try {
            await logout(user_id);
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error(`error logout: `, error);
            return res.status(500).json({ error });
        }
    }

    @autobind
    async refresh(req: Request, res: Response) {
        // 전달된 토큰에서 id를 추출
        // 토큰 재발급 로직
        const access_token = (req.headers as { access_token: string }).access_token;
        const { refresh_token } = req.body;

        if (!access_token || !refresh_token) {
            return res.status(401).json();
        }

        try {
            const new_access_token = await refreshToken(access_token, refresh_token);
            return res.status(200).json({ token: new_access_token });
        } catch (error) {
            console.error(`error refresh toekn: `, error);
            return res.status(401).json();
        }
    }

    // 다른 메서드들...
}

import { Request, Response } from "express";
import autobind from "autobind-decorator";

import UserService from "../services/user";

import { logError } from "../utils/error";
import { LoginRequestDto } from "../dto/user";

export default class UserController {
    constructor(private userService: UserService) {}

    @autobind
    async login(req: Request, res: Response) {
        // kakao 인증 code를 받음.
        // kakao api로 kakao id를 가져오고
        // kakao id로 가입된 아이디가 있는지 확인
        // 없으면 회원가입 (user, userPfoile table에 로우 생성, status = 1, nickname = random)
        // access token, refresh token 생성, 설정
        // 전달

        // if (!code) return res.status(400).json({ error: "Kakao 인증 코드가 필요합니다." });

        try {
            const loginRequestDto = req.dto;
            const loginResponseDto = await this.userService.loginOrSignUp(loginRequestDto);

            return res.status(200).json(loginResponseDto);
        } catch (error) {
            if (error instanceof Error) logError(error, req);
            return res.status(500).json({ message: "로그인 중 오류가 발생했습니다." });
        }
    }

    @autobind
    async logout(req: Request, res: Response) {
        // 로그아웃 로직
        // 전달된 토큰에서 id를 추출
        // delete refresh token, 입장 중인 방 있으면 퇴장

        const user_id = req.user!.user_id;

        try {
            await this.userService.logout(user_id);
            return res.status(200).json({ success: true });
        } catch (error) {
            if (error instanceof Error) logError(error, req);
            return res.status(500).json({ message: "로그아웃 오류" });
        }
    }

    @autobind
    async refresh(req: Request, res: Response) {
        // 전달된 토큰에서 id를 추출
        // 토큰 재발급 로직
        let access_token;
        if (req.headers) {
            access_token = req.headers.authorization && req.headers.authorization.split(" ")[1];
        }

        // 토큰이 없는 경우
        if (!access_token) {
            return res.status(419).json({ message: "로그인 정보가 없습니다. 로그인 해주세요." });
        }

        try {
            const refreshRequestDto = req.dto;
            const refreshResponseDto = await this.userService.refreshToken(refreshRequestDto, access_token);

            return res.status(200).json(refreshResponseDto);
        } catch (error) {
            if (error instanceof Error) logError(error, req);
            return res.status(401).json({ message: "토큰 재발급 오류" });
        }
    }

    @autobind
    async patchUserName(req: Request, res: Response) {
        // 전달된 토큰에서 id를 추출
        // 전달된 텍스트 데이터로 이름 변경
        const user_id = req.user!.user_id;

        try {
            const userProfileDto = req.dto;
            await this.userService.setUserName(userProfileDto, user_id);

            return res.status(200).json({ success: true });
        } catch (error) {
            if (error instanceof Error) logError(error, req);
            return res.status(500).json({ message: "서버 오류입니다. 잠시 후 다시 시도해주세요." });
        }
    }

    // 다른 메서드들...
}

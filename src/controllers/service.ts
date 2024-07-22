import { Request, Response } from "express";
import autobind from "autobind-decorator";
import { JwtPayload } from "jsonwebtoken";

import { sequelize } from "../modules/sequelize";
import User from "../models/User";
import UserProfile from "../models/UserProfile";

import jwt from "../modules/jwt";

import { getKaKaoUserInfo } from "../services/service";
import { encrypt } from "../utils/security";

// 이런 로직은 controller에 넣으면 되는지 services에 넣으면 되는지
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

        const transaction = await sequelize.transaction();

        try {
            const kakao_user = await getKaKaoUserInfo(code);
            if (kakao_user.err) throw new Error(kakao_user.err);

            const kakao_id = kakao_user.id;
            const refresh_token = encrypt();

            const [user, created] = await User.findOrCreate({
                where: { kakao_id },
                defaults: {
                    kakao_id,
                    refresh_token,
                },
                transaction,
            });

            if (created) {
                // 랜덤 닉네임 생성
                const nickname = "asdf";
                UserProfile.create({ user_id: user.user_id, nickname }, { transaction });
            } else {
                User.update({ refresh_token }, { where: { refresh_token } });
            }

            const access_token = await jwt.sign({ user_id: user.user_id });

            await transaction.commit();

            return res.status(200).json({ token: access_token, index: refresh_token });
        } catch (error) {
            // 롤백
            await transaction.rollback();
            console.error(`error login: `, error);
            return res.status(500).json(error);
        }
    }

    @autobind
    async logout(req: Request, res: Response) {
        // 로그아웃 로직
        // 전달된 토큰에서 id를 추출
        // delete refresh token, 입장 중인 방 있으면 퇴장

        const user_id = req.user!.user_id;

        try {
            await User.update({ refresh_token: null }, { where: { user_id } });

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error(`error logout: `, error);
            return res.status(500).json(error);
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
            const tokenUser = (await jwt.decode(access_token)) as JwtPayload;
            if (!tokenUser || typeof tokenUser === "string") throw new Error("don't exist token user");

            const user = await User.findOne({ where: { user_id: tokenUser.user_id } });
            if (user === null) throw new Error("don't exist db user");

            const db_refresh_token = user.refresh_token;
            if (refresh_token !== db_refresh_token) throw new Error("don't match refresh token");

            const new_access_token = await jwt.sign(user);

            return res.status(200).json({ token: new_access_token });
        } catch (error) {
            console.error(`error refresh toekn: `, error);
            return res.status(401).json();
        }
    }

    // 다른 메서드들...
}

import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();

import { sequelize } from "../modules/sequelize";
import User from "../models/User";
import UserProfile from "../models/UserProfile";

import jwt from "../modules/jwt";
import { encrypt } from "../utils/security";

import { JwtPayload } from "jsonwebtoken";

const KAKAO_JS_APP_KEY = process.env.JKAKAO_JS_APP_KEY!;
const KAKAO_REDIRECT_URI = process.env.JWT_SECRET_KEY!;

export const getKaKaoUserInfo = async (code: string) => {
    interface DataType {
        [key: string]: string;
    }

    const data: DataType = {
        grant_type: "authorization_code",
        client_id: KAKAO_JS_APP_KEY,
        redirect_uri: KAKAO_REDIRECT_URI,
        code,
    };

    const options = {
        method: "post",
        url: "https://kauth.kakao.com/oauth/token",
        data: Object.keys(data)
            .map((k: string) => encodeURIComponent(k) + "=" + encodeURIComponent(data[k]))
            .join("&"),
    };

    try {
        // get kakao token
        const token = await axios(options);
        // console.log(token)

        // 받은 토큰으로 유저 정보 받기
        const user = await axios({
            method: "get",
            url: "https://kapi.kakao.com/v2/user/me",
            headers: {
                Authorization: `Bearer ${token.data.access_token}`,
            },
        });

        const result = user.data;
        // console.log(user);

        return result;
    } catch (error) {
        throw error;
    }
};

export const loginOrSignUp = async (code: string) => {
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
            await UserProfile.create({ user_id: user.user_id, nickname }, { transaction });
        } else {
            await User.update({ refresh_token }, { where: { kakao_id } });
        }

        const access_token = await jwt.sign({ user_id: user.user_id });

        await transaction.commit();

        return { access_token, refresh_token };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

export const logout = async (user_id: number) => {
    try {
        await User.update({ refresh_token: null }, { where: { user_id } });
    } catch (error) {
        throw error;
    }
};

export const refreshToken = async (access_token: string, refresh_token: string) => {
    try {
        const toekn_user = (await jwt.decode(access_token)) as JwtPayload;
        if (!toekn_user || typeof toekn_user === "string") throw new Error("토큰 사용자 없음");

        const user = await User.findOne({ where: { user_id: toekn_user.user_id } });
        if (user === null) throw new Error("DB 사용자 없음");

        const db_refresh_token = user.refresh_token;
        if (refresh_token !== db_refresh_token) throw new Error("리프레시 토큰 불일치");

        const newAccessToken = await jwt.sign(user);
        return newAccessToken;
    } catch (error) {
        throw error;
    }
};

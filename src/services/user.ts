import axios from "axios";
import autobind from "autobind-decorator";
import * as dotenv from "dotenv";
dotenv.config();

import { sequelize } from "../modules/sequelize";

import jwt from "../modules/jwt";
import { encrypt } from "../utils/security";

import { LoginRequestDto, LoginResponseDto, RefreshRequestDto, RefreshResponsetDto, UpdateNameDto } from "../dto/user";

// type
import { JwtPayload } from "jsonwebtoken";
import IUserRepository from "../repositories/interfaces/user";
import User from "../models/User";
import UserProfile from "../models/UserProfile";

export default class UserService {
    constructor(private userRepository: IUserRepository) {}

    @autobind
    async getKaKaoUserInfo(code: string) {
        interface DataType {
            [key: string]: string;
        }

        const data: DataType = {
            grant_type: "authorization_code",
            client_id: process.env.KAKAO_JS_APP_KEY!,
            redirect_uri: process.env.KAKAO_REDIRECT_URI!,
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

            // 받은 토큰으로 유저 정보 받기
            const user = await axios({
                method: "get",
                url: "https://kapi.kakao.com/v2/user/me",
                headers: {
                    Authorization: `Bearer ${token.data.access_token}`,
                },
            });

            const result = user.data;

            return result;
        } catch (error) {
            throw error;
        }
    }

    generateRandomNickname() {
        const adjectives = ["행복한", "슬기로운", "용감한", "빠른", "지혜로운", "사려깊은", "현명한", "차분한", "열정적인", "친절한"];
        const nouns = ["고양이", "사자", "호랑이", "늑대", "여우", "독수리", "부엉이", "거북이", "토끼", "곰"];

        const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
        return `${randomAdjective} ${randomNoun}`;
    }

    @autobind
    async loginOrSignUp(loginDto: LoginRequestDto) {
        const { code } = loginDto;
        let transaction = null;

        try {
            const kakao_user = await this.getKaKaoUserInfo(code);
            if (kakao_user.err) throw new Error(kakao_user.err);
            // const kakao_user = { id: code };

            const userData = new User({
                kakao_id: kakao_user.id,
                refresh_token: encrypt().toString(),
            });

            transaction = await sequelize.transaction();
            const [user, created] = await this.userRepository.findOrCreateUser(userData, transaction);
            userData.user_id = user.user_id;

            let nickname: string;
            if (created) {
                nickname = this.generateRandomNickname();
                const userProfileData = new UserProfile({ user_id: user.user_id, nickname });
                await this.userRepository.createUserProfile(userProfileData, transaction);
            } else {
                const [_, userProfile] = await Promise.all([
                    this.userRepository.updateUserRefreshToken(userData),
                    this.userRepository.findOneUserProfile(userData)
                ]);
                
                if (userProfile === null) throw new Error("don't exist user profile");

                nickname = userProfile?.nickname;
            }

            const access_token = await jwt.sign({ user_id: user.user_id });

            const loginResponseDto = new LoginResponseDto();
            loginResponseDto.access_token = access_token;
            loginResponseDto.refresh_token = userData.refresh_token;
            loginResponseDto.nickname = nickname;
            loginResponseDto.userId = user.user_id;

            await transaction.commit();

            return loginResponseDto;
        } catch (error) {
            if (transaction) transaction.rollback();
            throw error;
        }
    }

    @autobind
    async logout(user_id: number) {
        try {
            const userData = new User({ user_id });
            await this.userRepository.updateUserRefreshToken(userData);
        } catch (error) {
            throw error;
        }
    }

    @autobind
    async refreshToken(refreshDto: RefreshRequestDto, access_token: string) {
        const { refresh_token } = refreshDto;

        try {
            const decoded = jwt.decode(access_token) as JwtPayload;
            if (typeof decoded !== "object" || decoded === null || !("id" in decoded)) throw new Error("토큰 사용자 없음");

            const userData = new User({ user_id: decoded.id });
            const user = await this.userRepository.findOneUser(userData);
            if (user === null) throw new Error("DB 사용자 없음");

            const db_refresh_token = user.refresh_token;
            if (refresh_token !== db_refresh_token) throw new Error("리프레시 토큰 불일치");

            const newAccessToken = await jwt.sign(user);

            const refreshResponseDto = new RefreshResponsetDto();
            refreshResponseDto.access_token = newAccessToken;

            return refreshResponseDto;
        } catch (error) {
            throw error;
        }
    }

    @autobind
    async setUserName(userProfileDto: UpdateNameDto, user_id: number) {
        const { nickname } = userProfileDto;

        try {
            const userProfileData = new UserProfile({ user_id, nickname });
            this.userRepository.updateUserProfile(userProfileData);
        } catch (error) {
            throw error;
        }
    }
}

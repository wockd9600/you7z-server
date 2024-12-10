import { HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';

import { PrismaService } from '../core/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

import { v4 as uuidv4 } from 'uuid';

import { User } from '@prisma/client';
import { LoginDto, AuthTokenDto } from './auth.dto';
import { ErrorResponse } from 'src/common/constants/error';
import { UserService } from '../user/user.service';

import { KakaoUser } from './auth.interface';
import {
  InvalidTokenException,
  MismatchRefreshTokenException,
} from 'src/common/exception/auth.exception';

interface KakaoOAuthRequestData {
  [key: string]: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async getKaKaoUserInfo(code: string): Promise<KakaoUser> {
    try {
      const data: KakaoOAuthRequestData = {
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_JS_APP_KEY!,
        redirect_uri: process.env.KAKAO_REDIRECT_URI!,
        code,
      };

      const options = {
        method: 'post',
        url: 'https://kauth.kakao.com/oauth/token',
        data: Object.keys(data)
          .map(
            (k: string) =>
              encodeURIComponent(k) + '=' + encodeURIComponent(data[k]),
          )
          .join('&'),
      };

      // get kakao token
      const token = await axios(options);

      // 받은 토큰으로 유저 정보 받기
      const user = await axios({
        method: 'get',
        url: 'https://kapi.kakao.com/v2/user/me',
        headers: {
          Authorization: `Bearer ${token.data.access_token}`,
        },
      });

      const result: KakaoUser = user.data;

      return result;
    } catch (error) {
      throw error;
    }
  }

  async login(user: User): Promise<AuthTokenDto> {
    try {
      const userId = user.userId;
      const refresh_token = uuidv4().toString();
      await Promise.all([
        this.prisma.user.update({
          where: { userId },
          data: { refresh_token },
        }),
        this.prisma.user.findUnique({ where: { userId } }),
      ]);

      const payload = { id: userId };
      const access_token = await this.jwtService.signAsync(payload);

      const loginResponseDto = new AuthTokenDto({
        access_token,
        refresh_token,
      });
      // loginResponseDto.nickname = userProfile.nickname;
      // loginResponseDto.userId = user.user_id;

      return loginResponseDto;
    } catch (error) {
      throw error;
    }
  }

  async loginOrSignUp(loginDto: LoginDto): Promise<AuthTokenDto> {
    const { code } = loginDto;
    console.log(code);

    try {
      // const kakaoUser = await this.loginService.getKaKaoUserInfo(code);
      const kakaoUser = { id: '2505005686' };
      const user = await this.userService.findOrCreateUser(kakaoUser.id);
      return this.login(user);
    } catch (error) {
      throw error;
    }
  }

  async refreshToken(
    refreshTokenDto: AuthTokenDto,
    authorization: string,
  ): Promise<AuthTokenDto | ErrorResponse> {
    if (!authorization) {
      throw new InvalidTokenException('access token not found');
    }

    const access_token = authorization.split(' ')[1];
    const { refresh_token } = refreshTokenDto;

    const decoded = await this.jwtService.decode(access_token);
    if (typeof decoded !== 'object' || decoded === null || !('id' in decoded))
      throw new InvalidTokenException(
        `invalid access token ${JSON.stringify(decoded)}`,
      );

    const user = await this.userService.findUserById(decoded.id);

    const db_refresh_token = user.refresh_token;
    if (refresh_token !== db_refresh_token)
      throw new MismatchRefreshTokenException('refresh token mismatch');

    const loginResponseDto = new AuthTokenDto({
      access_token: await this.jwtService.signAsync(user),
      refresh_token,
    });

    return loginResponseDto;
  }
}

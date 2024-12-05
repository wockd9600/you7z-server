import { HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';

import { PrismaService } from '../core/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

import { v4 as uuidv4 } from 'uuid';

import { User } from '@prisma/client';
import { LoginDto, AuthTokenDto, RefreshTokenDto } from './dto';
import { ErrorResponse } from 'src/common/constants/error';
import { UserService } from '../user/user.service';

import { KakaoUser } from './auth.interface';

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
      const refresh_token = uuidv4().toString();
      await Promise.all([
        this.prisma.user.update({
          where: { user_id: user.user_id },
          data: { refresh_token },
        }),
        this.prisma.user.findUnique({ where: { user_id: user.user_id } }),
      ]);

      const payload = { id: user.user_id };
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

  async loginOrSignUp(
    loginDto: LoginDto,
  ): Promise<AuthTokenDto | ErrorResponse> {
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
    refreshTokenDto: RefreshTokenDto,
    authorization: string,
  ): Promise<AuthTokenDto | ErrorResponse> {
    if (!authorization) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: '토큰 재발급 실패',
        data: 'Authorization 헤더가 없습니다.',
      };
    }

    try {
      const access_token = authorization.split(' ')[1];
      const { refresh_token } = refreshTokenDto;

      const decoded = await this.jwtService.decode(access_token);
      if (typeof decoded !== 'object' || decoded === null || !('id' in decoded))
        throw new Error('유효하지 않은 액세스 토큰입니다.');

      const user = await this.prisma.user.findUnique({
        where: { user_id: decoded.id },
      });
      if (user === null) throw new Error('존재하지 않는 유저입니다.');

      const db_refresh_token = user.refresh_token;
      if (refresh_token !== db_refresh_token)
        throw new Error('리프레시 토큰 불일치');

      const loginResponseDto = new AuthTokenDto({
        access_token: await this.jwtService.signAsync(user),
        refresh_token,
      });

      return loginResponseDto;
    } catch (error) {
      let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      let errorMessage = '토큰 재발급 실패';

      if (error.message === '유효하지 않은 액세스 토큰입니다.') {
        statusCode = HttpStatus.UNAUTHORIZED;
        errorMessage = error.message;
      } else if (error.message === '존재하지 않는 유저입니다.') {
        statusCode = HttpStatus.NOT_FOUND;
        errorMessage = error.message;
      } else if (error.message === '리프레시 토큰 불일치') {
        statusCode = HttpStatus.FORBIDDEN;
        errorMessage = error.message;
      }
      return {
        status: statusCode,
        message: errorMessage,
        data: error.message,
      };
    }
  }
}

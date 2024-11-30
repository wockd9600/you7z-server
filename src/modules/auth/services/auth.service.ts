import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { LoginService } from './login.service';
import { JwtService } from '@nestjs/jwt';

import { v4 as uuidv4 } from 'uuid';

import { User } from '@prisma/client';
import { LoginDto, AuthTokenDto, RefreshTokenDto } from '../dto';
import { KakaoUser } from '../auth.interface';
import { ErrorResponse } from 'src/common/constants/error';

@Injectable()
export class AuthService {
  constructor(
    private readonly loginService: LoginService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  generateRandomNickname() {
    const adjectives = [
      '행복한',
      '슬기로운',
      '용감한',
      '빠른',
      '지혜로운',
      '사려깊은',
      '현명한',
      '차분한',
      '열정적인',
      '친절한',
    ];
    const nouns = [
      '고양이',
      '사자',
      '호랑이',
      '늑대',
      '여우',
      '독수리',
      '부엉이',
      '거북이',
      '토끼',
      '곰',
    ];

    const randomAdjective =
      adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${randomAdjective} ${randomNoun}`;
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

  async signUp(kakaoUser: KakaoUser): Promise<void> {
    try {
      const user = await this.prisma.user.create({
        data: {
          kakao_id: kakaoUser.id,
        },
      });

      await this.prisma.userProfile.create({
        data: {
          user_id: user.user_id,
          nickname: this.generateRandomNickname(),
        },
      });
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
      const user = await this.prisma.user.findFirst({
        where: { kakao_id: kakaoUser.id },
      });

      if (!user) {
        await this.signUp(kakaoUser);
      }
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

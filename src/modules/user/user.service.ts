import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { UpdateUserNameDto } from './dto';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async updateUserName(user_id: number, updateUserNameDto: UpdateUserNameDto) {
    return this._updateNickname(user_id, updateUserNameDto.nickname);
  }

  async findOrCreateUser(kakaoId: string): Promise<User> {
    let user = await this.prisma.user.findFirst({
      where: { kakao_id: kakaoId },
    });

    if (!user) {
      user = await this.signUp({ id: kakaoId });
    }
    return user;
  }

  async signUp(kakaoUser: { id: string }): Promise<User> {
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

    return user;
  }

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

  private async _updateNickname(user_id: number, nickname: string) {
    // 닉네임 중복 체크
    // const existingUser = await this.prisma.userProfile.findFirst({
    //   where: { nickname },
    // });
    // if (existingUser) {
    //   throw new Error('이미 존재하는 닉네임입니다.');
    // }

    try {
      await this.prisma.userProfile.update({
        where: { user_id },
        data: { nickname },
      });
      return { status: HttpStatus.OK, message: '이름 변경 완료' };
    } catch (error) {
      throw error;
    }
  }
}

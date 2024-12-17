import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { UpdateUserNameDto } from './dto';
import { User, UserProfile } from '@prisma/client';
import { generateRandomNickname } from './user.util';
import {
  NotFoundUserException,
  NotFoundUserProfileException,
} from 'src/common/exception/user.exception';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async updateUserName(userId: number, updateUserNameDto: UpdateUserNameDto) {
    // 닉네임 중복 체크
    // const existingUser = await this.prisma.userProfile.findFirst({
    //   where: { nickname },
    // });
    // if (existingUser) {
    //   throw new Error('이미 존재하는 닉네임입니다.');
    // }

    // 어디서할지도 controller? service?
    const { nickname } = updateUserNameDto;
    const sanitizedNickName = sanitize(nickname);

    await this.prisma.userProfile.update({
      where: { userId },
      data: { nickname: sanitizedNickName },
    });
    return { status: HttpStatus.OK, message: '이름 변경 완료' };
  }

  async findOrCreateUser(kakaoId: string): Promise<User> {
    let user = await this.prisma.user.findFirst({
      where: { kakaoId },
    });

    if (!user) {
      user = await this.createUserAndUserProfile({ id: kakaoId });
    }
    return user;
  }

  async findUserById(userId: number): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { userId } });
    if (!user) throw new NotFoundUserException(`user id ${userId} not found`);
    return user;
  }

  async findUserProfileByUserId(userId: number): Promise<UserProfile> {
    const userProfile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });
    if (!userProfile)
      throw new NotFoundUserProfileException(
        `user profile id ${userId} not found`,
      );
    return userProfile;
  }

  private async createUserAndUserProfile(kakaoUser: {
    id: string;
  }): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        kakaoId: kakaoUser.id,
      },
    });

    await this.prisma.userProfile.create({
      data: {
        userId: user.userId,
        nickname: generateRandomNickname(),
      },
    });

    return user;
  }
}

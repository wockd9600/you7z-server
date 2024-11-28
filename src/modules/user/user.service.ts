import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { UpdateUserNameDto } from './dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async updateUserName(user_id: number, updateUserNameDto: UpdateUserNameDto) {
    try {
      const { nickname } = updateUserNameDto;

      await this.prisma.userProfile.update({
        where: { user_id },
        data: { nickname },
      });
      return { status: HttpStatus.OK, message: '이름 변경 완료' };
    } catch (error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: '이름 변경 실패',
        data: error.message,
      };
    }
  }
}

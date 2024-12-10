import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';

import { User } from 'src/common/decorators/user.decorator';
import { UpdateUserNameDto } from './dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch('name')
  updateUserName(
    @Body() updateUserNameDto: UpdateUserNameDto,
    @User('userId') userId: number,
  ) {
    return this.userService.updateUserName(userId, updateUserNameDto);
  }
}

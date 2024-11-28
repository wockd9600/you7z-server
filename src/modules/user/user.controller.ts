import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';

import { User } from 'src/common/decorators/user.decorator';
import { UpdateUserNameDto } from './dto';

@Controller('user')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch('name')
  updateUserName(
    @Body() updateUserNameDto: UpdateUserNameDto,
    @User('user_id') user_id: number,
  ) {
    return this.userService.updateUserName(user_id, updateUserNameDto);
  }
}

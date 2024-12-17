import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { GameRoomService } from './room.service';
import { UserInRoomGuard } from '../common/userInRoom.guard';
import { AuthGuard } from 'src/modules/auth/auth.guard';
import { GameContext } from '../common/gameContext.decorator';
import { GameContextDto } from '../dto';
import { User } from 'src/common/decorators/user.decorator';

@Controller('game')
@UseGuards(AuthGuard)
export class GameRoomtController {
  constructor(private readonly gameRoomService: GameRoomService) {}

  @UseGuards(UserInRoomGuard)
  @Get('/room/:roomCode')
  getRoomInfo(@GameContext() context: GameContextDto) {
    return this.gameRoomService.getRoomInfo(context);
  }

  @Post('/room/join/:roomCode')
  joinRoom(
    @User('userId') userId: number,
    @Param('roomCode') roomCode: string,
  ) {
    return this.gameRoomService.joinRoom(userId, roomCode);
  }

  @Post('/room')
  createRoom(@User('userId') userId: number) {
    return this.gameRoomService.createRoom(userId);
  }
}

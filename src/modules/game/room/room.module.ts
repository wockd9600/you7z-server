import { Module } from '@nestjs/common';
import { GameRoomtController } from './room.controller';
import { GameRoomService } from './room.service';
import { GameRoomGateway } from './room.gateway';

@Module({
  controllers: [GameRoomtController],
  providers: [GameRoomService, GameRoomGateway],
  exports: [GameRoomService],
})
export class GameRoomModule {}

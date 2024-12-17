import { Module } from '@nestjs/common';
import { GameRoomtController } from './room.controller';
import { GameRoomService } from './room.service';
import { GameRoomGateway } from './room.gateway';
import { GameRoomRuleService } from './room-rule.service';

@Module({
  controllers: [GameRoomtController],
  providers: [GameRoomService, GameRoomGateway, GameRoomRuleService],
  exports: [GameRoomService],
})
export class GameRoomModule {}

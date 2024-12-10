import { Module } from '@nestjs/common';
import { GameSessionModule } from './session/session.module';
import { GameRoomModule } from './room/room.module';
import { GameService } from './game.service';

@Module({
  imports: [GameRoomModule, GameSessionModule],
  providers: [GameService],
})
export class GameModule {}

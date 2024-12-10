import { Module } from '@nestjs/common';
import { GameSessionGateway } from './session.gateway';
import { GameSessionService } from './session.service';

@Module({
  providers: [GameSessionGateway, GameSessionService],
})
export class GameSessionModule {}

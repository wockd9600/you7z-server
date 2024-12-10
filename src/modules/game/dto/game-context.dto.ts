import { GameRoom, GameSession } from '@prisma/client';

export class GameContextDto {
  userId: number;
  roomCode: string;
  gameRoom: GameRoom;
  gameSession: GameSession;
}

import { Injectable } from '@nestjs/common';
import { GameSession } from '@prisma/client';
import {
  GAME_PLAYER_STATUS,
  GAME_SESSION_STATUS,
} from 'src/common/constants/game.constant';
import { UserCannotJoinRoomException } from 'src/common/exception/room.exception';
import { PrismaService } from 'src/modules/core/prisma/prisma.service';

@Injectable()
export class GameRoomRuleService {
  constructor(private readonly prisma: PrismaService) {}

  async canJoinRoom(gameSession: GameSession) {
    const { sessionId, status } = gameSession;

    this.ensureGameNotStarted(status, sessionId);
    await this.ensureRoomNotFull(sessionId);
  }

  private ensureGameNotStarted(status: number, sessionId: number) {
    if (status !== GAME_SESSION_STATUS.NOT_STARTED) {
      throw new UserCannotJoinRoomException(
        `The game room ${sessionId} has already started.`,
      );
    }
  }

  private async ensureRoomNotFull(sessionId: number) {
    const playerCount = await this.prisma.gamePlayer.count({
      where: { sessionId, status: GAME_PLAYER_STATUS.NOMAL },
    });
    if (playerCount >= 7) {
      throw new UserCannotJoinRoomException(
        `The game room ${sessionId} is full.`,
      );
    }
  }
}

import { Injectable } from '@nestjs/common';
import { GameSession } from '@prisma/client';
import {
  GAME_PLAYER_STATUS,
  GAME_SESSION_STATUS,
} from 'src/common/constants/game.constant';
import { UserCannotJoinRoomException } from 'src/common/exception/game.exception';
import { PrismaService } from 'src/modules/core/prisma/prisma.service';

@Injectable()
export class GameRoomRuleService {
  constructor(private readonly prisma: PrismaService) {}

  async canJoinRoom(gameSession: GameSession) {
    const { sessionId, status } = gameSession;

    this.ensureGameNotStarted(sessionId, status);
    await this.ensureRoomNotFull(sessionId);
  }

  ensureGameNotStarted(sessionId: number, status: number) {
    if (status !== GAME_SESSION_STATUS.NOT_STARTED) {
      throw new UserCannotJoinRoomException(
        `The game room ${sessionId} has already started.`,
      );
    }
  }

  ensureUserIsRoomManager(userId: number, managerId: number) {
    if (managerId !== userId) {
      throw new UserCannotJoinRoomException(`user ${userId} is not manager`);
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

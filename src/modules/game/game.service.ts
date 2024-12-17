import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { GameRoom, GameSession } from '@prisma/client';
import {
  GAME_PLAYER_STATUS,
  GAME_ROOM_STATUS,
} from 'src/common/constants/game.constant';
import {
  GameRoomNotFoundException,
  GameSessionNotFoundException,
  ReadyNotFoundException,
  RoomCodeMissingException,
  SocreNotFoundException,
  SongNotFoundException,
} from 'src/common/exception/game.exception';
import { RedisService } from '../core/redis/redis.service';

type GameResponse = { gameRoom: GameRoom; gameSession: GameSession };

@Injectable()
export class GameService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async getGameSessionFromRoomCode(roomCode: string): Promise<GameResponse> {
    if (!roomCode) throw new RoomCodeMissingException();

    const gameRoom = await this.prisma.gameRoom.findFirst({
      where: {
        roomCode,
        status: {
          not: GAME_ROOM_STATUS.DELETED,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!gameRoom) throw new GameRoomNotFoundException();

    const gameSession = await this.prisma.gameSession.findFirst({
      where: { room_id: gameRoom.room_id },
    });
    if (!gameSession) throw new GameSessionNotFoundException();

    return { gameRoom, gameSession };
  }

  async ensureUserNotInRoom(userId: number, sessionId: number): Promise<void> {
    const isUserInRoom = await this.isUserInRoom(userId, sessionId);
    if (isUserInRoom) {
      throw new BadRequestException(`already user in room ${sessionId}`);
    }
  }

  async ensureUserInRoom(userId: number, sessionId: number): Promise<void> {
    const isUserInRoom = await this.isUserInRoom(userId, sessionId);
    if (!isUserInRoom) {
      throw new BadRequestException(`don't exist user in room ${sessionId}`);
    }
  }

  async isUserInRoom(userId: number, sessionId: number) {
    // 이미 방에 있는지 확인
    const existingPlayer = await this.prisma.gamePlayer.count({
      where: {
        sessionId,
        userId,
        status: GAME_PLAYER_STATUS.NOMAL,
      },
    });
    // 이미 방에 있으면 잘못된 접근
    return existingPlayer > 0;
  }

  async leaveAllRooms(userId: number) {
    // count를 사용하면
    // 업데이트가 필요 없는 경우 불필요한 업데이트 쿼리를 방지할 수 있다. 대규모 트래픽 환경에서 성능을 약간 개선할 수 있다.
    // 하지만
    // count는 쿼리 비용이 발생하고,
    // updateMany는 실행했을 때 영향을 받는 row가 없을 경우 비용이 보통 매우 적어서 더 효율적일 수 있다.
    // const existingNotLeaveRoom = await prisma.gamePlayer.count({
    //   where: {
    //     NOT: { sessionId },
    //     userId,
    //     status: GAME_PLAYER_STATUS.NOMAL,
    //   },
    // });
    // if (existingNotLeaveRoom > 0) {

    // 접속 중인 다른 방 있으면 다른 방이면 나감
    await this.prisma.gamePlayer.updateMany({
      data: { status: GAME_PLAYER_STATUS.LEAVE },
      where: { userId, status: GAME_PLAYER_STATUS.NOMAL },
    });
    // }
  }

  async updateGameRoom(
    gameRoomData: Partial<GameRoom>,
    prisma?: PrismaService,
  ) {
    const { status, roomId } = gameRoomData;
    const activePrisma = prisma ? prisma : this.prisma;
    const updateData: any = {};

    if (status !== undefined) updateData.status = status;

    await activePrisma.gameSession.update({
      where: { roomId },
      data: updateData,
    });
  }

  async updateGameSession(
    gameRoomData: Partial<GameSession>,
    prisma?: PrismaService,
  ) {
    const { status, sessionId, userId, goalScore, playlistId, questionOrder } =
      gameRoomData;
    const activePrisma = prisma ? prisma : this.prisma;
    const updateData: any = {};

    if (status !== undefined) updateData.status = status;
    if (userId !== undefined) updateData.userId = userId;
    if (goalScore !== undefined) updateData.goalScore = goalScore;
    if (playlistId !== undefined) updateData.playlistId = playlistId;
    if (questionOrder !== undefined) updateData.questionOrder = questionOrder;

    await activePrisma.gameSession.update({
      where: { sessionId },
      data: updateData,
    });
  }

  async getCurrentSongId(sessionId: number) {
    const songId = await this.redisService.get(
      `session:${sessionId}:currentSong`,
    );
    if (!songId) {
      throw new SongNotFoundException(
        `No current song found for session: ${sessionId}`,
      );
    }
    return parseInt(songId, 10);
  }

  async getPlayersScore(users: any[], sessionId: number) {
    if (users.length === 0) return [];

    const promises = users.map(async (user) => {
      const score = await this.redisService.get(
        `session:${sessionId}:users:${user.userId}:score`,
      );
      return { userId: user.userId, score: parseInt(score || '0', 10) };
    });

    const users_score = await Promise.all(promises);
    return users_score;
  }

  async getPlayersReady(users: any[], sessionId: number) {
    if (users.length === 0) return [];

    const promises = users.map(async (user) => {
      const isReady = await this.redisService.get(
        `session:${sessionId}:users:${user.userId}:ready`,
      );
      return { userId: user.userId, isReady: isReady === 'true' };
    });

    const users_score = await Promise.all(promises);
    return users_score;
  }

  async getPlayerScore(userId: number, sessionId: number) {
    const score = await this.redisService.get(
      `session:${sessionId}:users:${userId}:score`,
    );
    if (!score) {
      throw new SocreNotFoundException(
        `No player score found for session: ${sessionId}, user: ${userId}`,
      );
    }
    return parseInt(score, 10);
  }

  async getPlayerReady(userId: number, sessionId: number) {
    const isReady = await this.redisService.get(
      `session:${sessionId}:users:${userId}:ready`,
    );
    if (!isReady) {
      throw new ReadyNotFoundException(
        `No player ready found for session: ${sessionId}, user: ${userId}`,
      );
    }
    return isReady === 'true';
  }
}

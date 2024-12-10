import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { GameRoom, GameSession } from '@prisma/client';
import {
  GAME_PLAYER_STATUS,
  GAME_ROOM_STATUS,
} from 'src/common/constants/game.constant';
import { UserCannotJoinRoomException } from 'src/common/exception/room.exception';

type GameResponse = { gameRoom: GameRoom; gameSession: GameSession };

@Injectable()
export class GameService {
  constructor(private readonly prisma: PrismaService) {}

  async getGameSessionFromRoomCode(roomCode: string): Promise<GameResponse> {
    if (!roomCode) throw new BadRequestException('방 번호가 없습니다.');

    const gameRoom = await this.prisma.gameRoom.findFirst({
      where: {
        roomCode,
        status: {
          not: GAME_ROOM_STATUS.DELETED,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!gameRoom) throw new NotFoundException('방이 존재하지 않습니다.');

    const gameSession = await this.prisma.gameSession.findFirst({
      where: { room_id: gameRoom.room_id },
    });
    if (!gameSession)
      throw new NotFoundException('게임 세션 정보를 찾을 수 없습니다.');

    return { gameRoom, gameSession };
  }

  async ensureUserNotInRoom(userId: number, sessionId: number): Promise<void> {
    const isUserInRoom = await this.isUserInRoom(userId, sessionId);
    if (isUserInRoom) {
      throw new UserCannotJoinRoomException('already user in room');
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
}

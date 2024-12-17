import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GameService } from '../game.service';

// Every guard must implement a canActivate() function.
// This function should return a boolean, indicating whether the current request is allowed or not.
// It can return the response either synchronously or asynchronously (via a Promise or Observable).
// Nest uses the return value to control the next action:
// https://docs.nestjs.com/guards

@Injectable()
export class UserInRoomGuard implements CanActivate {
  constructor(
    // private readonly userService: UserService,
    private readonly gameService: GameService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const userId = request.user.id;
      const roomCode = request.params.roomCode;

      // const cachedData = await cache.get(`room:${room_code}`);
      // if (cachedData) {
      //   return { status: 200, ...JSON.parse(cachedData) };
      // }
      const { gameRoom, gameSession } =
        await this.gameService.getGameSessionFromRoomCode(roomCode);

      // 캐시에 저장
      // await cache.set(
      //   `room:${room_code}`,
      //   JSON.stringify({ gameRoom, gameSession }),
      //   'EX',
      //   300, // 5분 TTL
      // );

      // 방 입장 시
      // await redis.sadd(`room:${gameSession.session_id}:users`, user_id);

      // 방 내 행동 시
      // const isUserInRoom = await redis.sismember(
      //   `room:${gameSession.session_id}:users`,
      //   user_id,
      // );
      await this.gameService.ensureUserNotInRoom(userId, gameSession.sessionId);

      request.gameRoom = gameRoom;
      request.gameSession = gameSession;
      return true;
    } catch (error) {
      throw error;
    }
  }
}

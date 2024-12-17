import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GameService } from '../game.service';

// Every guard must implement a canActivate() function.
// This function should return a boolean, indicating whether the current request is allowed or not.
// It can return the response either synchronously or asynchronously (via a Promise or Observable).
// Nest uses the return value to control the next action:
// https://docs.nestjs.com/guards

@Injectable()
export class WsUserInRoomGuard implements CanActivate {
  constructor(
    // private readonly userService: UserService,
    private readonly gameService: GameService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const data = context.switchToWs().getData(); // Get the payload of the WebSocket event
      const userId = data.user.id;
      const roomCode = data.roomCode;

      const { gameRoom, gameSession } =
        await this.gameService.getGameSessionFromRoomCode(roomCode);

      await this.gameService.ensureUserNotInRoom(userId, gameSession.sessionId);

      data.gameRoom = gameRoom;
      data.gameSession = gameSession;
      return true;
    } catch (error) {
      throw error;
    }
  }
}

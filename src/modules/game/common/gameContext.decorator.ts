import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GameContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const roomCode = request.params.roomCode;
    const userId = request.user?.id; // Assuming user info is injected
    const gameSession = request.gameSession;
    request.roomContext = { roomCode, userId, gameSession };

    return { roomCode, userId, gameSession };
  },
);

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // const client = context.switchToWs().getClient();
    const data = context.switchToWs().getData(); // Get the payload of the WebSocket event
    const token = data?.token; // Extract the token from the payload

    if (!token) {
      throw new WsException({ status: 401, message: 'Unauthorized' });
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET_KEY,
      });
      data.userId = payload.id; // Attach user info to the data payload
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new WsException({ status: 419, message: 'Token is expired' });
      }
      throw new WsException({ status: 401, message: 'Unauthorized' });
    }
    return true;
  }
}

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameRoomService } from './room.service';
import { ValidationPipe, UsePipes, UseGuards } from '@nestjs/common';
import { WsAuthGuard } from '../common/ws.guard';
import { WsUserInRoomGuard } from '../common/wsUserInRoom.guard';
import {
  UpdateGameSettingRequestDto,
  UserKickRequestDto,
} from './dto/ws-request.dto';

@WebSocketGateway(80, {
  namespace: 'idle',
  cors: { origin: '*' },
})
@UseGuards(WsAuthGuard)
@UseGuards(WsUserInRoomGuard)
export class GameRoomGateway {
  @WebSocketServer()
  server: Server;
  constructor(private readonly gameRoomService: GameRoomService) {}

  // // 소켓 연결 메서드 OnGatewayConnection 인터페이스에 구현되어있습니다/
  async handleConnection(socket: Socket): Promise<void> {
    const roomCode = socket.handshake.query.roomCode as string | undefined;
    if (roomCode) {
      socket.data.roomCode = roomCode;
      socket.join(roomCode);
    } else {
      // *수정 테스트
      socket.disconnect();
    }
  }
  // // 소켓 연결 끊어졌을 떄 메서드 OnGatewayDisconnect 인터페이스에 구현되어있습니다/
  // async handleDisconnect(client: Socket): Promise<void> {
  //   const socketId = client.id;
  //   this.removeClient(socketId);
  //   const clientInfo = await this.redisService.getClient(socketId);
  //   if (clientInfo != undefined) {
  //     await this.redisService.removeClient(socketId);
  //     const clientId = clientInfo['id'];
  //     const result = { status: 'offline', id: clientId };
  //     this.server.emit('client_info', result);
  //   }
  // }

  @UsePipes(new ValidationPipe())
  @SubscribeMessage('join user')
  async handleJoinUser(@ConnectedSocket() socket: Socket) {
    try {
      this.gameRoomService.wsJoinRoom(this.server, socket);
    } catch (error) {
      socket.emit('error', {
        message: error.message || 'An unexpected error occurred',
      });
    }
  }

  @SubscribeMessage('user kick')
  async handleUserKick(
    @MessageBody() params: UserKickRequestDto,
    @ConnectedSocket() socket: Socket,
  ) {
    try {
      this.gameRoomService.wsKickUser(this.server, socket, params);
    } catch (error) {
      socket.emit('error', {
        message: error.message || 'An unexpected error occurred',
      });
    }
  }

  @SubscribeMessage('change game setting')
  async handleChangeGameSetting(
    @MessageBody() params: UpdateGameSettingRequestDto,
    @ConnectedSocket() socket: Socket,
  ) {
    try {
      this.gameRoomService.wsUpdateRoomSettings(this.server, socket, params);
    } catch (error) {
      socket.emit('error', {
        message: error.message || 'An unexpected error occurred',
      });
    }
  }

  // http request 안 거치게 수정
  @SubscribeMessage('change user name')
  async handleChangeUserName(@ConnectedSocket() socket: Socket) {
    try {
      this.gameRoomService.wsUpdateUserName(this.server, socket);
    } catch (error) {
      socket.emit('error', {
        message: error.message || 'An unexpected error occurred',
      });
    }
  }

  @SubscribeMessage('change user status')
  async handleChangeUserStatus(@ConnectedSocket() socket: Socket) {
    try {
      this.gameRoomService.wsUpdateUserStatus(this.server, socket);
    } catch (error) {
      socket.emit('error', {
        message: error.message || 'An unexpected error occurred',
      });
    }
  }

  @SubscribeMessage('leave game')
  async handleLeaveGame(@ConnectedSocket() socket: Socket) {
    try {
      this.gameRoomService.wsLeaveRoom(this.server, socket);
    } catch (error) {
      socket.emit('error', {
        message: error.message || 'An unexpected error occurred',
      });
    }
  }
}

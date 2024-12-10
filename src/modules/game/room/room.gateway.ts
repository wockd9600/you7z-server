import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

@WebSocketGateway(80, {
  namespace: 'idle',
  cors: { origin: '*' },
})
export class GameRoomGateway {
  // @WebSocketServer()
  // server: Server;
  // constructor(private readonly redisService: RedisService) {}

  // // 소켓 연결 메서드 OnGatewayConnection 인터페이스에 구현되어있습니다/
  // async handleConnection(client: Socket): Promise<void> {
  //   const socketId = client.id;
  //   this.addClient(socketId);
  // }
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

  @SubscribeMessage('message')
  gameStart(client: Socket, payload: any) {
    // this.server.emit('client_info', result);
  }
}

// import {
//   WebSocketGateway,
//   WebSocketServer,
//   OnGatewayConnection,
//   OnGatewayDisconnect,
// } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';

// @WebSocketGateway() // 기본 WebSocket 서버 생성
// export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
//   @WebSocketServer()
//   server: Server;

//   async handleConnection(client: Socket) {
//     console.log(`Client connected: ${client.id}`);
//   }

//   async handleDisconnect(client: Socket) {
//     console.log(`Client disconnected: ${client.id}`);
//   }

//   // 예제: 메시지 수신 및 브로드캐스트
//   handleMessage(client: Socket, payload: string) {
//     console.log(`Message from ${client.id}: ${payload}`);
//     this.server.emit('message', payload); // 모든 클라이언트에 메시지 브로드캐스트
//   }
// }
